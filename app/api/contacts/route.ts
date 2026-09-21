import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "../../../auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { name, email, phone, tags } = await req.json();

  if (!name && !email && !phone) {
    return NextResponse.json({ error: "Provide at least a name, email, or phone" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      userId: user.id,
      name: name || null,
      email: email || null,
      phone: phone || null,
      tags: tags || [],
    },
  });

  return NextResponse.json(contact);
}