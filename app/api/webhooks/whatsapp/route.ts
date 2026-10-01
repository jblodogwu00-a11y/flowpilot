import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(
  request: NextRequest
) {
  const { searchParams } =
    new URL(request.url);

  const mode =
    searchParams.get("hub.mode");

  const token =
    searchParams.get(
      "hub.verify_token"
    );

  const challenge =
    searchParams.get(
      "hub.challenge"
    );

  if (
    mode === "subscribe" &&
    token &&
    VERIFY_TOKEN &&
    token === VERIFY_TOKEN &&
    challenge
  ) {
    return new NextResponse(
      challenge,
      {
        status: 200,
        headers: {
          "Content-Type":
            "text/plain",
        },
      }
    );
  }

  return NextResponse.json(
    {
      error:
        "Webhook verification failed",
    },
    {
      status: 403,
    }
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    console.log(
      "WhatsApp webhook received:",
      JSON.stringify(
        body,
        null,
        2
      )
    );

    /*
     * WhatsApp message status updates
     *
     * Examples:
     * sent
     * delivered
     * read
     * failed
     */

    const entries =
      Array.isArray(body?.entry)
        ? body.entry
        : [];

    for (const entry of entries) {
      const changes =
        Array.isArray(
          entry?.changes
        )
          ? entry.changes
          : [];

      for (const change of changes) {
        const value =
          change?.value;

        const statuses =
          Array.isArray(
            value?.statuses
          )
            ? value.statuses
            : [];

        for (const status of statuses) {
          console.log(
            "WhatsApp message status:",
            {
              messageId:
                status?.id,
              recipient:
                status?.recipient_id,
              status:
                status?.status,
              timestamp:
                status?.timestamp,
              errors:
                status?.errors || [],
            }
          );
        }

        const messages =
          Array.isArray(
            value?.messages
          )
            ? value.messages
            : [];

        for (const message of messages) {
          console.log(
            "WhatsApp incoming message:",
            {
              messageId:
                message?.id,
              from:
                message?.from,
              type:
                message?.type,
              timestamp:
                message?.timestamp,
            }
          );
        }
      }
    }

    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "WhatsApp webhook error:",
      error
    );

    /*
     * Always return 200 so Meta
     * does not repeatedly retry
     * malformed webhook events.
     */

    return NextResponse.json(
      {
        received: false,
      },
      {
        status: 200,
      }
    );
  }
}