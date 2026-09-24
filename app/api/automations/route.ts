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

  const automations = await prisma.automation.findMany({
    where: {
      userId: user.id,
      ...(listId ? { listId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { list: true },
  });

  return NextResponse.json(automations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { name, message, listId } = await req.json();

  if (!name || !message || !listId) {
    return NextResponse.json({ error: "Name, message, and list are required" }, { status: 400 });
  }

  const list = await prisma.contactList.findFirst({ where: { id: listId, userId: user.id } });
  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const automation = await prisma.automation.create({
    data: {
      userId: user.id,
      listId,
      name,
      message,
    },
  });

  return NextResponse.json(automation);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id, name, message, enabled } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Automation id is required" }, { status: 400 });
  }

  const existing = await prisma.automation.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  }

  const updated = await prisma.automation.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      message: message ?? existing.message,
      enabled: enabled !== undefined ? enabled : existing.enabled,
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
    return NextResponse.json({ error: "Automation id is required" }, { status: 400 });
  }

  const existing = await prisma.automation.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  }

  await prisma.automation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}