import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendWhatsAppMessage } from "../../../lib/whatsapp";

const prisma = new PrismaClient();

function normalizePhone(phone: string | null | undefined) {
  return (phone || "").replace(/[^\d]/g, "");
}

function normalizeText(text: string | null | undefined) {
  return (text || "").trim().toLowerCase();
}

function personalizeReply(reply: string, firstName: string | null) {
  return reply.replace(
    /\{first\s*name\}/gi,
    firstName || "there"
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token &&
    verifyToken &&
    token === verifyToken
  ) {
    return new NextResponse(challenge || "", {
      status: 200,
    });
  }

  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(
      "WhatsApp webhook received:",
      JSON.stringify(body, null, 2)
    );

    if (body?.object !== "whatsapp_business_account") {
      return NextResponse.json({ received: true });
    }

    for (const entry of body?.entry || []) {
      for (const change of entry?.changes || []) {
        const value = change?.value;

        if (!value) {
          continue;
        }

        /*
         * ---------------------------------------------------------
         * DELIVERY STATUS EVENTS
         * ---------------------------------------------------------
         */

        for (const status of value?.statuses || []) {
          console.log("WhatsApp message status:", {
            messageId: status?.id,
            recipient: status?.recipient_id,
            status: status?.status,
            timestamp: status?.timestamp,
            errors: status?.errors || [],
          });
        }

        /*
         * ---------------------------------------------------------
         * INCOMING WHATSAPP MESSAGES
         * ---------------------------------------------------------
         */

        for (const incomingMessage of value?.messages || []) {
          const messageType = incomingMessage?.type;
          const senderPhone = normalizePhone(
            incomingMessage?.from
          );

          if (!senderPhone) {
            continue;
          }

          console.log("Incoming WhatsApp message:", {
            from: senderPhone,
            type: messageType,
            messageId: incomingMessage?.id,
          });

          /*
           * Auto Replies currently handle text messages.
           */

          if (messageType !== "text") {
            console.log(
              "Auto Reply skipped: incoming message is not text."
            );
            continue;
          }

          const incomingText =
            incomingMessage?.text?.body || "";

          const normalizedIncomingText =
            normalizeText(incomingText);

          if (!normalizedIncomingText) {
            continue;
          }

          /*
           * Find the FlowPilot contact using the WhatsApp number.
           */

          const contacts = await prisma.contact.findMany({
            where: {
              OR: [
                {
                  phone: senderPhone,
                },
                {
                  phone: `+${senderPhone}`,
                },
              ],
            },
            include: {
              lists: {
                include: {
                  autoReplyRules: {
                    where: {
                      enabled: true,
                      channel: "WHATSAPP",
                    },
                    orderBy: {
                      createdAt: "asc",
                    },
                  },
                },
              },
            },
          });

          if (contacts.length === 0) {
            console.log(
              "Auto Reply skipped: sender is not a FlowPilot contact.",
              senderPhone
            );
            continue;
          }

          let matchedRule:
            | {
                id: string;
                reply: string;
                trigger: string;
                listId: string;
              }
            | null = null;

          let matchedContact = contacts[0];

          /*
           * Search the contact's lists for a matching
           * enabled WhatsApp Auto Reply rule.
           */

          for (const contact of contacts) {
            for (const list of contact.lists) {
              for (const rule of list.autoReplyRules) {
                const trigger = normalizeText(rule.trigger);

                if (!trigger) {
                  continue;
                }

                /*
                 * Match either an exact message or a message
                 * containing the trigger phrase.
                 */

                if (
                  normalizedIncomingText === trigger ||
                  normalizedIncomingText.includes(trigger)
                ) {
                  matchedRule = {
                    id: rule.id,
                    reply: rule.reply,
                    trigger: rule.trigger,
                    listId: list.id,
                  };

                  matchedContact = contact;
                  break;
                }
              }

              if (matchedRule) {
                break;
              }
            }

            if (matchedRule) {
              break;
            }
          }

          if (!matchedRule) {
            console.log(
              "Auto Reply: no matching rule found.",
              {
                senderPhone,
                message: incomingText,
              }
            );

            continue;
          }

          /*
           * Get the contact's first name for personalization.
           */

          const firstName =
            matchedContact.name?.trim().split(/\s+/)[0] || null;

          const replyMessage = personalizeReply(
            matchedRule.reply,
            firstName
          );

          console.log("Auto Reply matched:", {
            ruleId: matchedRule.id,
            trigger: matchedRule.trigger,
            senderPhone,
            reply: replyMessage,
          });

          /*
           * Send the automatic WhatsApp reply.
           */

          const sendResult = await sendWhatsAppMessage(
            senderPhone,
            replyMessage
          );

          if (!sendResult.success) {
            console.error("Auto Reply send failed:", {
              ruleId: matchedRule.id,
              senderPhone,
              error: sendResult.error,
            });
          } else {
            console.log("Auto Reply sent successfully:", {
              ruleId: matchedRule.id,
              senderPhone,
              messageId: sendResult.messageId,
            });
          }
        }
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);

    return NextResponse.json({
      received: true,
    });
  }
}