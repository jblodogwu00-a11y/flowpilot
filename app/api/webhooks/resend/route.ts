import { NextResponse } from "next/server";
import { PrismaClient, AutoReplyChannel } from "@prisma/client";
import { Resend } from "resend";
import { sendEmail } from "../../../lib/email";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function extractEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);

  if (match?.[1]) {
    return normalizeEmail(match[1]);
  }

  return normalizeEmail(value);
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function personalizeReply(reply: string, firstName: string | null) {
  const safeFirstName = firstName?.trim() || "there";

  return reply.replace(/\{first name\}/gi, safeFirstName);
}

export async function POST(req: Request) {
  try {
    const payload = await req.text();

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "Resend webhook error: RESEND_WEBHOOK_SECRET is not configured."
      );

      return NextResponse.json(
        { error: "Webhook secret is not configured." },
        { status: 500 }
      );
    }

    const event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") || "",
        timestamp: req.headers.get("svix-timestamp") || "",
        signature: req.headers.get("svix-signature") || "",
      },
      webhookSecret,
    });

    console.log("Resend webhook received:", event.type);

    if (event.type !== "email.received") {
      return NextResponse.json({
        success: true,
        ignored: true,
      });
    }

    const emailId = event.data.email_id;

    if (!emailId) {
      console.error("Resend webhook error: Missing email_id.");

      return NextResponse.json(
        { error: "Missing email_id." },
        { status: 400 }
      );
    }

    const { data: receivedEmail, error: receivingError } =
      await resend.emails.receiving.get(emailId);

    if (receivingError || !receivedEmail) {
      console.error(
        "Failed to retrieve received email:",
        receivingError
      );

      return NextResponse.json(
        { error: "Failed to retrieve received email." },
        { status: 500 }
      );
    }

    console.log("Retrieved Resend email:", {
      id: receivedEmail.id,
      from: receivedEmail.from,
      subject: receivedEmail.subject,
      textLength: receivedEmail.text?.length || 0,
      htmlLength: receivedEmail.html?.length || 0,
    });

    const senderEmail = extractEmailAddress(event.data.from || "");

    if (!senderEmail) {
      console.log("Resend webhook: No sender email found.");

      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "No sender email found.",
      });
    }

    console.log("Incoming email sender:", senderEmail);

    /*
     * Find the FlowPilot contact directly by email.
     */
    const contact = await prisma.contact.findFirst({
      where: {
        OR: [
          {
            email: senderEmail,
          },
          {
            email: {
              equals: senderEmail,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (!contact) {
      console.log(
        "Email Auto Reply skipped: sender is not a FlowPilot contact.",
        senderEmail
      );

      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Sender is not a FlowPilot contact.",
      });
    }

    console.log("FlowPilot contact found:", {
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.email,
      userId: contact.userId,
    });

    /*
     * Get the lists that this exact contact belongs to.
     */
    const contactLists = await prisma.contactList.findMany({
      where: {
        userId: contact.userId,
        contacts: {
          some: {
            id: contact.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(
      "Contact lists found:",
      contactLists.map((list) => ({
        id: list.id,
        name: list.name,
      }))
    );

    if (contactLists.length === 0) {
      console.log(
        "Email Auto Reply skipped: contact is not assigned to any list."
      );

      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Contact is not assigned to any list.",
      });
    }

    /*
     * Find Email Auto Reply rules directly from the lists
     * that contain this exact contact.
     */
    const autoReplyRules = await prisma.autoReplyRule.findMany({
      where: {
        userId: contact.userId,
        enabled: true,
        channel: AutoReplyChannel.EMAIL,
        listId: {
          in: contactLists.map((list) => list.id),
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(
      "Email Auto Reply rules found:",
      autoReplyRules.map((rule) => ({
        id: rule.id,
        listId: rule.listId,
        trigger: rule.trigger,
        enabled: rule.enabled,
        channel: rule.channel,
      }))
    );

    /*
     * Resend's received-email API provides the actual email body.
     * Prefer plain text and fall back to HTML.
     */
    const incomingText =
      receivedEmail.text?.trim() ||
      stripHtml(receivedEmail.html || "");

    console.log("Retrieved email body:", {
      hasText: Boolean(receivedEmail.text),
      hasHtml: Boolean(receivedEmail.html),
      textLength: receivedEmail.text?.length || 0,
      htmlLength: receivedEmail.html?.length || 0,
    });

    if (!incomingText) {
      console.log(
        "Email Auto Reply skipped: email has no readable text."
      );

      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Email has no readable text.",
      });
    }

    console.log("Incoming email text:", incomingText);

    const incomingTextLower = incomingText.toLowerCase();

    /*
     * Match the incoming email against the Email Auto Reply rules.
     */
    let matchedRule = null;

    for (const rule of autoReplyRules) {
      const trigger = rule.trigger.trim().toLowerCase();

      if (!trigger) {
        continue;
      }

      if (
        incomingTextLower === trigger ||
        incomingTextLower.includes(trigger)
      ) {
        matchedRule = rule;
        break;
      }
    }

    if (!matchedRule) {
      console.log(
        "Email Auto Reply skipped: no matching Email Auto Reply rule.",
        {
          senderEmail,
          incomingText,
          availableRules: autoReplyRules.map((rule) => ({
            id: rule.id,
            listId: rule.listId,
            trigger: rule.trigger,
          })),
        }
      );

      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "No matching Email Auto Reply rule.",
      });
    }

    /*
     * Personalize the reply using the contact's first name.
     */
    const firstName =
      contact.name?.trim().split(/\s+/)[0] || null;

    const replyText = personalizeReply(
      matchedRule.reply,
      firstName
    );

    const originalSubject =
      event.data.subject?.trim() || "Your message";

    const replySubject = originalSubject
      .toLowerCase()
      .startsWith("re:")
      ? originalSubject
      : `Re: ${originalSubject}`;

    console.log("Email Auto Reply matched:", {
      ruleId: matchedRule.id,
      listId: matchedRule.listId,
      trigger: matchedRule.trigger,
      senderEmail,
      firstName,
      replySubject,
      replyText,
    });

    /*
     * Send the automatic email reply through Resend.
     */
    console.log("Sending Email Auto Reply through Resend:", {
      to: senderEmail,
      subject: replySubject,
    });

    const sendResult = await sendEmail(
      senderEmail,
      replySubject,
      replyText
    );

    /*
     * IMPORTANT DIAGNOSTIC:
     * Log the complete result returned by the email helper.
     */
    console.log("Resend sendEmail result:", {
      success: sendResult.success,
      data: sendResult.data ?? null,
      error: sendResult.error ?? null,
    });

    if (!sendResult.success) {
      console.error("Email Auto Reply send failed:", {
        ruleId: matchedRule.id,
        senderEmail,
        error: sendResult.error,
      });

      return NextResponse.json(
        {
          success: false,
          replied: false,
          error:
            sendResult.error ||
            "Failed to send Email Auto Reply.",
        },
        { status: 500 }
      );
    }

    console.log("Email Auto Reply sent successfully:", {
      ruleId: matchedRule.id,
      senderEmail,
      resendResponse: sendResult.data ?? null,
    });

    return NextResponse.json({
      success: true,
      replied: true,
      ruleId: matchedRule.id,
      recipient: senderEmail,
      resendResponse: sendResult.data ?? null,
    });
  } catch (error) {
    console.error("Resend webhook error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process Resend webhook.",
      },
      { status: 400 }
    );
  }
}