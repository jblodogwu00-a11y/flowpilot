import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "../../../../auth";
import { sendEmail } from "../../../lib/email";

const prisma = new PrismaClient();

type SendResult = {
  automationId: string;
  automationName: string;
  contactId: string;
  email: string | null;
  status: "sent" | "skipped" | "failed";
  reason?: string;
};

async function runAutomation(
  automationId: string,
  userId: string
): Promise<SendResult[]> {
  const automation = await prisma.automation.findFirst({
    where: {
      id: automationId,
      userId,
      enabled: true,
    },
    include: {
      list: {
        include: {
          contacts: true,
        },
      },
    },
  });

  if (!automation) {
    throw new Error("Active automation not found");
  }

  const results: SendResult[] = [];

  for (const contact of automation.list.contacts) {
    if (!contact.email) {
      results.push({
        automationId: automation.id,
        automationName: automation.name,
        contactId: contact.id,
        email: null,
        status: "skipped",
        reason: "Contact has no email address",
      });
      continue;
    }

    const killSwitchActive =
      automation.list.killSwitchTag &&
      contact.tags.includes(automation.list.killSwitchTag);

    if (killSwitchActive) {
      results.push({
        automationId: automation.id,
        automationName: automation.name,
        contactId: contact.id,
        email: contact.email,
        status: "skipped",
        reason: "Kill switch tag detected",
      });
      continue;
    }

    const existingSend = await prisma.$queryRaw<
      { id: string }[]
    >`
      SELECT "id"
      FROM "AutomationSend"
      WHERE "automationId" = ${automation.id}
        AND "contactId" = ${contact.id}
      LIMIT 1
    `;

    if (existingSend.length > 0) {
      results.push({
        automationId: automation.id,
        automationName: automation.name,
        contactId: contact.id,
        email: contact.email,
        status: "skipped",
        reason: "Already sent",
      });
      continue;
    }

    const emailResult = await sendEmail(
      contact.email,
      automation.name,
      automation.message
    );

    if (!emailResult.success) {
      await prisma.$executeRaw`
        INSERT INTO "AutomationSend"
          ("automationId", "contactId", "status", "error")
        VALUES
          (${automation.id}, ${contact.id}, 'failed', 'Email sending failed')
        ON CONFLICT ("automationId", "contactId")
        DO UPDATE SET
          "status" = 'failed',
          "error" = 'Email sending failed'
      `;

      results.push({
        automationId: automation.id,
        automationName: automation.name,
        contactId: contact.id,
        email: contact.email,
        status: "failed",
        reason: "Email sending failed",
      });

      continue;
    }

    await prisma.$executeRaw`
      INSERT INTO "AutomationSend"
        ("automationId", "contactId", "status")
      VALUES
        (${automation.id}, ${contact.id}, 'sent')
      ON CONFLICT ("automationId", "contactId")
      DO UPDATE SET
        "status" = 'sent',
        "sentAt" = CURRENT_TIMESTAMP,
        "error" = NULL
    `;

    results.push({
      automationId: automation.id,
      automationName: automation.name,
      contactId: contact.id,
      email: contact.email,
      status: "sent",
    });
  }

  return results;
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    let userId: string | null = null;
    let isCronRequest = false;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      userId = user.id;
    } else {
      const authHeader = req.headers.get("authorization");
      const cronSecret = process.env.CRON_SECRET;

      if (
        !cronSecret ||
        authHeader !== `Bearer ${cronSecret}`
      ) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      isCronRequest = true;
    }

    const body = await req.json().catch(() => ({}));
    const requestedAutomationId = body?.automationId;

    if (isCronRequest) {
      const enabledAutomations = await prisma.automation.findMany({
        where: {
          enabled: true,
        },
        select: {
          id: true,
          userId: true,
        },
      });

      const allResults: SendResult[] = [];

      for (const automation of enabledAutomations) {
        try {
          const results = await runAutomation(
            automation.id,
            automation.userId
          );

          allResults.push(...results);
        } catch (error) {
          console.error(
            `Automation ${automation.id} failed:`,
            error
          );
        }
      }

      return NextResponse.json({
        success: true,
        mode: "cron",
        processed: allResults.length,
        sent: allResults.filter((r) => r.status === "sent").length,
        skipped: allResults.filter((r) => r.status === "skipped").length,
        failed: allResults.filter((r) => r.status === "failed").length,
        results: allResults,
      });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!requestedAutomationId) {
      return NextResponse.json(
        { error: "Automation id is required" },
        { status: 400 }
      );
    }

    const results = await runAutomation(
      requestedAutomationId,
      userId
    );

    return NextResponse.json({
      success: true,
      mode: "manual",
      processed: results.length,
      sent: results.filter((r) => r.status === "sent").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    });
  } catch (error) {
    console.error("Automation run error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run automation",
      },
      { status: 500 }
    );
  }
}