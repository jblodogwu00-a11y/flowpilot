import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "../../../auth";
import { sendEmail } from "../../lib/email";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { contactId, subject, message } = await req.json();

  if (!contactId || !message) {
    return NextResponse.json({ error: "Contact and message are required" }, { status: 400 });
  }

  const contact = await prisma.contact.findFirst({ where: { id: contactId, userId: user.id } });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  if (!contact.email) {
    return NextResponse.json({ error: "This contact has no email address" }, { status: 400 });
  }

  const result = await sendEmail(contact.email, subject || "Message from FlowPilot", message);

  if (!result.success) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}