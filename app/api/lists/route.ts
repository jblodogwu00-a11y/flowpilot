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

  const lists = await prisma.contactList.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { contacts: true },
  });

  return NextResponse.json(lists);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { name, killSwitchTag } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "List name is required" }, { status: 400 });
  }

  const list = await prisma.contactList.create({
    data: {
      userId: user.id,
      name,
      killSwitchTag: killSwitchTag || null,
    },
  });

  return NextResponse.json(list);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id, name, killSwitchTag } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "List id is required" }, { status: 400 });
  }

  const existing = await prisma.contactList.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const updated = await prisma.contactList.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      killSwitchTag: killSwitchTag !== undefined ? killSwitchTag : existing.killSwitchTag,
    },
  });

  return NextResponse.json(updated);
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
    return NextResponse.json({ error: "List id is required" }, { status: 400 });
  }

  const existing = await prisma.contactList.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  await prisma.contactList.delete({ where: { id } });

  return NextResponse.json({ success: true });
}