import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  if (!resend) {
    console.log(`[EMAIL SIMULATED] To: ${to} | Subject: ${subject} | Body: ${body}`);
    return { success: true, simulated: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "ShopFlow <notifications@shopflow.com>",
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">ShopFlow Notification</h2>
          <p>${body}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px;">Sent by ShopFlow Automation Engine</p>
        </div>
      `,
    });

    if (error) {
      console.error("Email error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, error: "Failed to send" };
  }
}