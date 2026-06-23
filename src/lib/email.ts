import nodemailer from 'nodemailer';

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST) {
    console.log("-----------------------------------------");
    console.log("📧 [EMAIL SERVICE - DEV MODE]");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Content:", html);
    console.log("-----------------------------------------");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send email via SMTP:", error);
    // Catch error and do not rethrow to prevent breaking user flows (like registration)
  }
}
