import { NextResponse } from "next/server";
import { PrismaClient, AutoReplyChannel } from "@prisma/client";
import { auth } from "../../../auth";

const prisma = new PrismaClient();

/**
 * GET
 * Load all Auto Reply rules belonging to the logged-in user.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const rules = await prisma.autoReplyRule.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        list: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Auto Reply GET error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load Auto Reply rules",
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Create a new Auto Reply rule.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const listId = String(body?.listId || "").trim();
    const channel = String(body?.channel || "").trim();
    const trigger = String(body?.trigger || "").trim();
    const reply = String(body?.reply || "").trim();

    if (!listId || !channel || !trigger || !reply) {
      return NextResponse.json(
        {
          error:
            "Contact list, channel, trigger, and reply are required",
        },
        { status: 400 }
      );
    }

    if (
      channel !== AutoReplyChannel.EMAIL &&
      channel !== AutoReplyChannel.WHATSAPP
    ) {
      return NextResponse.json(
        {
          error: "Channel must be EMAIL or WHATSAPP",
        },
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
        {
          error: "Contact list not found",
        },
        { status: 404 }
      );
    }

    const rule = await prisma.autoReplyRule.create({
      data: {
        userId: user.id,
        listId,
        channel: channel as AutoReplyChannel,
        trigger,
        reply,
        enabled: true,
      },
      include: {
        list: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Auto Reply POST error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Auto Reply rule",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH
 * Edit or activate/deactivate an Auto Reply rule.
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const id = String(body?.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          error: "Auto Reply rule id is required",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.autoReplyRule.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Auto Reply rule not found",
        },
        { status: 404 }
      );
    }

    const data: {
      listId?: string;
      channel?: AutoReplyChannel;
      trigger?: string;
      reply?: string;
      enabled?: boolean;
    } = {};

    if (body.listId !== undefined) {
      const listId = String(body.listId || "").trim();

      if (!listId) {
        return NextResponse.json(
          {
            error: "Contact list is required",
          },
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
          {
            error: "Contact list not found",
          },
          { status: 404 }
        );
      }

      data.listId = listId;
    }

    if (body.channel !== undefined) {
      const channel = String(body.channel || "").trim();

      if (
        channel !== AutoReplyChannel.EMAIL &&
        channel !== AutoReplyChannel.WHATSAPP
      ) {
        return NextResponse.json(
          {
            error: "Channel must be EMAIL or WHATSAPP",
          },
          { status: 400 }
        );
      }

      data.channel = channel as AutoReplyChannel;
    }

    if (body.trigger !== undefined) {
      const trigger = String(body.trigger || "").trim();

      if (!trigger) {
        return NextResponse.json(
          {
            error: "Trigger message is required",
          },
          { status: 400 }
        );
      }

      data.trigger = trigger;
    }

    if (body.reply !== undefined) {
      const reply = String(body.reply || "").trim();

      if (!reply) {
        return NextResponse.json(
          {
            error: "Reply message is required",
          },
          { status: 400 }
        );
      }

      data.reply = reply;
    }

    if (body.enabled !== undefined) {
      data.enabled = Boolean(body.enabled);
    }

    const updated = await prisma.autoReplyRule.update({
      where: {
        id,
      },
      data,
      include: {
        list: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Auto Reply PATCH error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update Auto Reply rule",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 * Delete an Auto Reply rule belonging to the logged-in user.
 */
export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const id = String(body?.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          error: "Auto Reply rule id is required",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.autoReplyRule.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error: "Auto Reply rule not found",
        },
        { status: 404 }
      );
    }

    await prisma.autoReplyRule.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Auto Reply DELETE error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete Auto Reply rule",
      },
      { status: 500 }
    );
  }
}