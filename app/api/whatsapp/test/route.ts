import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendWhatsAppMessage } from "@/app/lib/whatsapp";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const to = String(body?.to || "").trim();
    const message = String(body?.message || "").trim();

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipient phone number is required.",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required.",
        },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage(to, message);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("WhatsApp test endpoint error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request.",
      },
      { status: 400 }
    );
  }
}