import nodemailer from 'nodemailer';

export async function sendMail({
  to,
  subject,
  html,
  fromKey = 'support',
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  fromKey?: 'support' | 'orders' | 'info';
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;

  // Determine credentials
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;

  if (fromKey === 'support' && process.env.SMTP_USER_SUPPORT && process.env.SMTP_PASS_SUPPORT) {
    user = process.env.SMTP_USER_SUPPORT;
    pass = process.env.SMTP_PASS_SUPPORT;
  } else if (fromKey === 'orders' && process.env.SMTP_USER_ORDERS && process.env.SMTP_PASS_ORDERS) {
    user = process.env.SMTP_USER_ORDERS;
    pass = process.env.SMTP_PASS_ORDERS;
  } else if (fromKey === 'info' && process.env.SMTP_USER_INFO && process.env.SMTP_PASS_INFO) {
    user = process.env.SMTP_USER_INFO;
    pass = process.env.SMTP_PASS_INFO;
  }

  // Determine from header
  let fromHeader = '';
  if (fromKey === 'support') {
    const fromAddr = process.env.SMTP_USER_SUPPORT || 'support@highlandersfitness.store';
    fromHeader = `"Highlanders Support" <${fromAddr}>`;
  } else if (fromKey === 'orders') {
    const fromAddr = process.env.SMTP_USER_ORDERS || 'orders@highlandersfitness.store';
    fromHeader = `"Highlanders Orders" <${fromAddr}>`;
  } else if (fromKey === 'info') {
    const fromAddr = process.env.SMTP_USER_INFO || 'info@highlandersfitness.store';
    fromHeader = `"Highlanders Sports & Fitness" <${fromAddr}>`;
  } else {
    const fromAddr = process.env.SMTP_FROM || user || 'info@highlandersfitness.store';
    fromHeader = `"Highlanders Sports & Fitness" <${fromAddr}>`;
  }

  if (!user || !pass || !host) {
    console.log("-----------------------------------------");
    console.log(`📧 [EMAIL SERVICE - DEV MODE] (FromKey: ${fromKey})`);
    console.log("From:", fromHeader);
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Content:", html);
    console.log("-----------------------------------------");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: fromHeader,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`📧 Email sent successfully from ${fromKey} to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email from ${fromKey} via SMTP:`, error);
  }
}
