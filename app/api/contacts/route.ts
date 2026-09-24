import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "../../../auth";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const listId = searchParams.get("listId");

  const contacts = await prisma.contact.findMany({
    where: {
      userId: user.id,
      ...(listId ? { lists: { some: { id: listId } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { lists: true },
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

  const { name, email, phone, tags, listId } = await req.json();

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
      ...(listId ? { lists: { connect: { id: listId } } } : {}),
    },
  });

  return NextResponse.json(contact);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id, name, email, phone, tags } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Contact id is required" }, { status: 400 });
  }

  const existing = await prisma.contact.findFirst({
    where: { id, userId: user.id },
    include: { lists: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const newTags = tags ?? existing.tags;

  const updated = await prisma.contact.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      email: email ?? existing.email,
      phone: phone ?? existing.phone,
      tags: newTags,
    },
  });

  let killSwitchTriggered = false;
  for (const list of existing.lists) {
    if (list.killSwitchTag && newTags.includes(list.killSwitchTag)) {
      killSwitchTriggered = true;
    }
  }

  return NextResponse.json({ ...updated, killSwitchTriggered });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Contact id is required" }, { status: 400 });
  }

  const existing = await prisma.contact.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  await prisma.contact.delete({ where: { id } });

  return NextResponse.json({ success: true });
}