import { NextResponse } from "next/server";

import { PrismaClient } from "@prisma/client";

import { auth } from "../../../auth";

const prisma = new PrismaClient();

type AttachmentData = {
  filename: string;
  mimeType: string | null;
  content: Buffer;
};

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const listId = searchParams.get("listId");

  const automations = await prisma.automation.findMany({
    where: {
      userId: user.id,
      ...(listId ? { listId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      list: true,
      attachments: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json(automations);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") || "";

  let name = "";
  let message = "";
  let listId = "";
  let files: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    name = String(formData.get("name") || "");
    message = String(formData.get("message") || "");
    listId = String(formData.get("listId") || "");

    files = formData
      .getAll("attachments")
      .filter((item): item is File => item instanceof File);
  } else {
    const body = await req.json();

    name = body.name || "";
    message = body.message || "";
    listId = body.listId || "";
  }

  if (!name || !message || !listId) {
    return NextResponse.json(
      { error: "Name, message, and list are required" },
      { status: 400 }
    );
  }

  const list = await prisma.contactList.findFirst({
    where: {
      id: listId,
      userId: user.id,
    },
  });

  if (!list) {
    return NextResponse.json(
      { error: "List not found" },
      { status: 404 }
    );
  }

  const attachmentData: AttachmentData[] = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    attachmentData.push({
      filename: file.name,
      mimeType: file.type || null,
      content: buffer,
    });
  }

  const automation = await prisma.automation.create({
    data: {
      userId: user.id,
      listId,
      name,
      message,
      attachments:
        attachmentData.length > 0
          ? {
              create: attachmentData,
            }
          : undefined,
    },
    include: {
      list: true,
      attachments: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json(automation);
}

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") || "";

  let id = "";
  let name: string | undefined;
  let message: string | undefined;
  let enabled: boolean | undefined;
  let files: File[] = [];
  let replaceAttachments = false;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    id = String(formData.get("id") || "");

    const formName = formData.get("name");
    const formMessage = formData.get("message");
    const formEnabled = formData.get("enabled");

    name =
      formName !== null
        ? String(formName)
        : undefined;

    message =
      formMessage !== null
        ? String(formMessage)
        : undefined;

    if (formEnabled !== null) {
      enabled = String(formEnabled) === "true";
    }

    files = formData
      .getAll("attachments")
      .filter((item): item is File => item instanceof File);

    replaceAttachments = true;
  } else {
    const body = await req.json();

    id = body.id || "";
    name = body.name;
    message = body.message;
    enabled = body.enabled;
  }

  if (!id) {
    return NextResponse.json(
      { error: "Automation id is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.automation.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Automation not found" },
      { status: 404 }
    );
  }

  const attachmentData: AttachmentData[] = [];

  if (replaceAttachments) {
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      attachmentData.push({
        filename: file.name,
        mimeType: file.type || null,
        content: buffer,
      });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (replaceAttachments) {
      await tx.automationAttachment.deleteMany({
        where: {
          automationId: id,
        },
      });
    }

    return tx.automation.update({
      where: {
        id,
      },
      data: {
        name: name ?? existing.name,
        message: message ?? existing.message,
        enabled:
          enabled !== undefined
            ? enabled
            : existing.enabled,
        attachments:
          replaceAttachments && attachmentData.length > 0
            ? {
                create: attachmentData,
              }
            : undefined,
      },
      include: {
        list: true,
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            createdAt: true,
          },
        },
      },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Automation id is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.automation.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Automation not found" },
      { status: 404 }
    );
  }

  await prisma.automation.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({ success: true });
}