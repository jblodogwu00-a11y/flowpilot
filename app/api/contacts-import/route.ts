import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "../../../auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { entries, tag } = await req.json();

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "No contacts to import" }, { status: 400 });
  }
  if (!tag) {
    return NextResponse.json({ error: "A tag is required" }, { status: 400 });
  }

  let created = 0;
  let updated = 0;

  for (const entry of entries) {
    const value = entry.trim();
    if (!value) continue;

    const isEmail = value.includes("@");
    const whereClause = isEmail
      ? { userId_email: undefined }
      : undefined;

    const existing = await prisma.contact.findFirst({
      where: {
        userId: user.id,
        ...(isEmail ? { email: value } : { phone: value }),
      },
    });

    if (existing) {
      const newTags = Array.from(new Set([...existing.tags, tag]));
      await prisma.contact.update({
        where: { id: existing.id },
        data: { tags: newTags },
      });
      updated++;
    } else {
      await prisma.contact.create({
        data: {
          userId: user.id,
          email: isEmail ? value : null,
          phone: isEmail ? null : value,
          tags: [tag],
        },
      });
      created++;
    }
  }

  return NextResponse.json({ created, updated });
}