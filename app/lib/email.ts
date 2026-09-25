import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, message: string) {
  try {
    const result = await resend.emails.send({
      from: "FlowPilot <onboarding@resend.dev>",
      to,
      subject,
      text: message,
    });
    return { success: true, result };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}