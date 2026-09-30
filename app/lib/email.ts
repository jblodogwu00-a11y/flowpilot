import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailAttachment = {
  filename: string;
  content: string;
};

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  attachments: EmailAttachment[] = []
) {
  try {
    const result = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "onboarding@resend.dev",
      to,
      subject,
      text,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
      })),
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Email send error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send email.",
    };
  }
}