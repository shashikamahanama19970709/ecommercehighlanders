/**
 * Email Templates for Highlanders Sports & Fitness
 * Branded with Navy (#0f1a2e) and Gold (#c8a84b) colors
 */

// Helper to format currency pricing in templates
function formatTemplatePrice(amount: number, rate: number, symbol: string) {
  const converted = amount * rate;
  const space = symbol.length > 1 ? ' ' : '';
  return `${symbol}${space}${converted.toFixed(2)}`;
}

/**
 * Returns HTML for the user email verification template
 */
export function getVerificationEmailTemplate(name: string, verifyUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 20px;
            box-sizing: border-box;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(15, 26, 46, 0.05);
            border: 1px border #e2e8f0;
          }
          .header {
            background-color: #0f1a2e;
            padding: 30px 40px;
            text-align: center;
            border-bottom: 3px solid #c8a84b;
          }
          .logo-text {
            color: #ffffff;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 1px;
            margin: 0;
            text-transform: uppercase;
          }
          .logo-sub {
            color: #c8a84b;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 2px;
            margin: 4px 0 0 0;
            text-transform: uppercase;
          }
          .content {
            padding: 40px;
            line-height: 1.6;
          }
          .greeting {
            font-size: 22px;
            font-weight: 700;
            color: #0f1a2e;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .text {
            font-size: 15px;
            color: #475569;
            margin-bottom: 30px;
          }
          .btn-container {
            text-align: center;
            margin-bottom: 35px;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 30px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 9999px;
            box-shadow: 0 4px 10px rgba(30, 58, 95, 0.2);
            transition: all 0.2s ease;
          }
          .verify-link {
            font-size: 12px;
            color: #94a3b8;
            word-break: break-all;
            background-color: #f1f5f9;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin-top: 25px;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            font-size: 12px;
            color: #64748b;
            margin: 0;
          }
          .footer-links {
            margin-top: 10px;
          }
          .footer-link {
            font-size: 12px;
            color: #c8a84b;
            text-decoration: none;
            margin: 0 8px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div style="margin-bottom: 12px; display: inline-block;">
                <svg width="48" height="48" viewBox="0 0 80 80" style="display: block; margin: 0 auto;" aria-hidden="true">
                  <polygon points="6,62 26,18 46,62" fill="#c8d4e4"/>
                  <polygon points="24,62 44,8 64,62" fill="#8898b0" opacity="0.85"/>
                  <polygon points="44,8 39,24 49,24" fill="#ffffff"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="#c8a84b" stroke-width="4.5" fill="none" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="logo-text">Highlanders</div>
              <div class="logo-sub">Sports & Fitness</div>
            </div>
            <div class="content">
              <h1 class="greeting">Verify your email address</h1>
              <p class="text">Hi ${name},<br><br>Thank you for creating an account with Highlanders Sports & Fitness! To complete your registration and activate your profile, please confirm your email address by clicking the button below:</p>
              
              <div class="btn-container">
                <a href="${verifyUrl}" class="btn">Confirm Email Address</a>
              </div>
              
              <p class="text">If the button above does not work, copy and paste the following URL into your web browser:</p>
              <div class="verify-link">
                <a href="${verifyUrl}" style="color: #1e3a5f; text-decoration: none;">${verifyUrl}</a>
              </div>
              
              <p class="text" style="margin-bottom: 0; margin-top: 30px; font-size: 13px; color: #94a3b8;">If you did not sign up for a Highlanders account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p class="footer-text">© ${new Date().getFullYear()} Highlanders Sports & Fitness. All rights reserved.</p>
              <div class="footer-links">
                <a href="#" class="footer-link">Shop</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="#" class="footer-link">Support</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="#" class="footer-link">Terms</a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Returns HTML for the customer invoice/order receipt template
 */
export function getCustomerInvoiceTemplate(order: any): string {
  const rate = order.currencyRate || 1.0;
  const symbol = order.currencySymbol || '$';
  
  const formattedSubtotal = formatTemplatePrice(
    order.items.reduce((sum: number, item: any) => sum + item.priceUsd * item.quantity, 0),
    rate,
    symbol
  );
  const formattedShipping = order.shipping
    ? formatTemplatePrice(order.shipping.cost, rate, symbol)
    : 'Free';
  const formattedTax = order.tax
    ? formatTemplatePrice(order.tax.amount, rate, symbol)
    : null;
  const formattedDiscount = order.discount
    ? formatTemplatePrice(order.discount.amount, rate, symbol)
    : null;
  const formattedTotal = formatTemplatePrice(order.totalUsd, rate, symbol);

  const itemRows = order.items.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; font-weight: 500; font-size: 14px; color: #1e293b;">
        ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-size: 14px; color: #64748b;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-mono: true; font-size: 14px; color: #64748b;">
        ${formatTemplatePrice(item.priceUsd, rate, symbol)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; font-size: 14px; color: #1e293b;">
        ${formatTemplatePrice(item.priceUsd * item.quantity, rate, symbol)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Invoice</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
          }
          .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 20px;
            box-sizing: border-box;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(15, 26, 46, 0.05);
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: #0f1a2e;
            padding: 30px 40px;
            text-align: center;
            border-bottom: 3px solid #c8a84b;
          }
          .logo-text {
            color: #ffffff;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 1px;
            margin: 0;
            text-transform: uppercase;
          }
          .logo-sub {
            color: #c8a84b;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 2px;
            margin: 4px 0 0 0;
            text-transform: uppercase;
          }
          .content {
            padding: 40px;
          }
          .greeting {
            font-size: 20px;
            font-weight: 700;
            color: #0f1a2e;
            margin-top: 0;
            margin-bottom: 12px;
          }
          .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 30px;
          }
          .meta-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
          }
          .meta-label {
            font-size: 12px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            padding-bottom: 4px;
          }
          .meta-val {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }
          .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .item-th {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #94a3b8;
            padding: 12px;
            border-bottom: 2px solid #e2e8f0;
          }
          .totals-table {
            width: 250px;
            margin-left: auto;
            border-collapse: collapse;
          }
          .totals-tr {
            border-bottom: 1px solid #f1f5f9;
          }
          .totals-label {
            padding: 8px 12px;
            font-size: 13px;
            color: #64748b;
            text-align: left;
          }
          .totals-val {
            padding: 8px 12px;
            font-size: 13px;
            color: #1e293b;
            text-align: right;
            font-weight: 600;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            font-size: 12px;
            color: #64748b;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div style="margin-bottom: 12px; display: inline-block;">
                <svg width="48" height="48" viewBox="0 0 80 80" style="display: block; margin: 0 auto;" aria-hidden="true">
                  <polygon points="6,62 26,18 46,62" fill="#c8d4e4"/>
                  <polygon points="24,62 44,8 64,62" fill="#8898b0" opacity="0.85"/>
                  <polygon points="44,8 39,24 49,24" fill="#ffffff"/>
                  <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="#c8a84b" stroke-width="4.5" fill="none" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="logo-text">Highlanders</div>
              <div class="logo-sub">Sports & Fitness</div>
            </div>
            <div class="content">
              <h1 class="greeting">Thank you for your order!</h1>
              <p class="subtitle">We have received your payment and are preparing your shipment. Below is your copy of the receipt details.</p>
              
              <div class="meta-box">
                <table class="meta-table">
                  <tr>
                    <td style="width: 50%; padding-bottom: 15px;">
                      <div class="meta-label">Order ID</div>
                      <div class="meta-val" style="font-family: monospace;">${order.stripeSessionId?.slice(0, 18) || order._id || 'Pending'}</div>
                    </td>
                    <td style="width: 50%; padding-bottom: 15px;">
                      <div class="meta-label">Payment Date</div>
                      <div class="meta-val">${new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div class="meta-label">Payment Method</div>
                      <div class="meta-val">Credit / Debit Card (Stripe)</div>
                    </td>
                    <td>
                      <div class="meta-label">Customer Email</div>
                      <div class="meta-val" style="font-family: monospace;">${order.email}</div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <table class="item-table">
                <thead>
                  <tr>
                    <th class="item-th" style="text-align: left;">Product</th>
                    <th class="item-th" style="text-align: center; width: 40px;">Qty</th>
                    <th class="item-th" style="text-align: right; width: 80px;">Price</th>
                    <th class="item-th" style="text-align: right; width: 90px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
              
              <table class="totals-table">
                <tr class="totals-tr">
                  <td class="totals-label">Subtotal</td>
                  <td class="totals-val">${formattedSubtotal}</td>
                </tr>
                <tr class="totals-tr">
                  <td class="totals-label">Shipping</td>
                  <td class="totals-val">${formattedShipping}</td>
                </tr>
                ${formattedTax ? `
                  <tr class="totals-tr">
                    <td class="totals-label">${order.tax?.label || 'Tax'}</td>
                    <td class="totals-val">${formattedTax}</td>
                  </tr>
                ` : ''}
                ${formattedDiscount ? `
                  <tr class="totals-tr">
                    <td class="totals-label" style="color: #10b981;">${order.discount?.label || 'Discount'}</td>
                    <td class="totals-val" style="color: #10b981;">-${formattedDiscount}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td class="totals-label" style="font-size: 16px; font-weight: 800; color: #0f1a2e; padding-top: 15px;">Total Paid</td>
                  <td class="totals-val" style="font-size: 16px; font-weight: 800; color: #0f1a2e; padding-top: 15px;">${formattedTotal}</td>
                </tr>
              </table>
            </div>
            <div class="footer">
              <p class="footer-text">© ${new Date().getFullYear()} Highlanders Sports & Fitness. All rights reserved.</p>
              <p class="footer-text" style="margin-top: 6px; font-size: 11px; color: #94a3b8;">If you need assistance with this order, please reply directly to this email or write to support@highlandersfitness.store</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Returns HTML for the administrative order notification template
 */
export function getAdminAlertTemplate(order: any, viewUrl: string): string {
  const rate = order.currencyRate || 1.0;
  const symbol = order.currencySymbol || '$';
  const formattedTotal = formatTemplatePrice(order.totalUsd, rate, symbol);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Alert</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #dddddd;
            border-radius: 8px;
            overflow: hidden;
          }
          .header {
            background-color: #0f1a2e;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .details {
            background-color: #f9f9f9;
            border: 1px solid #eeeeee;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .btn {
            display: inline-block;
            background-color: #c8a84b;
            color: #ffffff !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Order Placed!</h2>
          </div>
          <div class="content">
            <p>Hello Admin,</p>
            <p>A new order has been paid and created successfully in the store catalog.</p>
            
            <div class="details">
              <strong>Order Summary:</strong><br>
              <ul>
                <li><strong>Customer:</strong> ${order.email}</li>
                <li><strong>Total Value:</strong> ${formattedTotal} (${order.currency || 'USD'})</li>
                <li><strong>Payment ID:</strong> ${order.stripeSessionId || 'N/A'}</li>
                <li><strong>Items Count:</strong> ${order.items?.length || 0}</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${viewUrl}" class="btn">View Order in Dashboard</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Returns HTML for the forgot password email template
 */
export function getForgotPasswordTemplate(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
          }
          .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 20px;
            box-sizing: border-box;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(15, 26, 46, 0.05);
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: #0f1a2e;
            padding: 30px 40px;
            text-align: center;
            border-bottom: 3px solid #c8a84b;
          }
          .logo-text {
            color: #ffffff;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 1px;
            margin: 0;
            text-transform: uppercase;
          }
          .logo-sub {
            color: #c8a84b;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 2px;
            margin: 4px 0 0 0;
            text-transform: uppercase;
          }
          .content {
            padding: 40px;
            line-height: 1.6;
          }
          .greeting {
            font-size: 22px;
            font-weight: 700;
            color: #0f1a2e;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .text {
            font-size: 15px;
            color: #475569;
            margin-bottom: 30px;
          }
          .btn-container {
            text-align: center;
            margin-bottom: 35px;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 30px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 9999px;
            box-shadow: 0 4px 10px rgba(30, 58, 95, 0.2);
          }
          .footer {
            background-color: #f1f5f9;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            font-size: 12px;
            color: #94a3b8;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <p class="logo-text">Highlanders</p>
              <p class="logo-sub">Sports & Fitness</p>
            </div>
            <div class="content">
              <h1 class="greeting">Password Reset Request</h1>
              <p class="text">Hello,<br><br>We received a request to reset the password linked to your store credentials. To complete this request, please click the button below to specify a new password:</p>
              <div class="btn-container">
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </div>
              <p class="text">If you did not make this request, you can safely ignore this email; your credentials will remain unchanged.</p>
            </div>
            <div class="footer">
              <p class="footer-text">© ${new Date().getFullYear()} Highlanders Sports & Fitness. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Returns HTML for the admin verification code template
 */
export function getAdminProfileVerifyTemplate(code: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Profile Verification</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
          }
          .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 20px;
            box-sizing: border-box;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(15, 26, 46, 0.05);
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: #0f1a2e;
            padding: 30px 40px;
            text-align: center;
            border-bottom: 3px solid #c8a84b;
          }
          .logo-text {
            color: #ffffff;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 1px;
            margin: 0;
            text-transform: uppercase;
          }
          .logo-sub {
            color: #c8a84b;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 2px;
            margin: 4px 0 0 0;
            text-transform: uppercase;
          }
          .content {
            padding: 40px;
            line-height: 1.6;
          }
          .greeting {
            font-size: 22px;
            font-weight: 700;
            color: #0f1a2e;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .code-box {
            text-align: center;
            background-color: #f1f5f9;
            border: 1px dashed #c8a84b;
            padding: 20px;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 6px;
            color: #0f1a2e;
            border-radius: 12px;
            margin: 30px 0;
          }
          .text {
            font-size: 15px;
            color: #475569;
            margin-bottom: 10px;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            font-size: 12px;
            color: #94a3b8;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <p class="logo-text">Highlanders</p>
              <p class="logo-sub">Sports & Fitness</p>
            </div>
            <div class="content">
              <h1 class="greeting">Profile Verification Code</h1>
              <p class="text">Hello Admin,<br><br>We received a request to update the profile credentials for the store administrator. Please enter the following 6-digit verification code to complete the updates:</p>
              <div class="code-box">${code}</div>
              <p class="text">If you did not initiate this change request, please verify your account settings immediately.</p>
            </div>
            <div class="footer">
              <p class="footer-text">© ${new Date().getFullYear()} Highlanders Sports & Fitness. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Returns HTML for the newsletter subscription welcome email template
 */
export function getSubscriptionWelcomeTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Highlanders Sports & Fitness</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
          }
          .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 20px;
            box-sizing: border-box;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(15, 26, 46, 0.05);
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: #0f1a2e;
            padding: 30px 40px;
            text-align: center;
            border-bottom: 3px solid #c8a84b;
          }
          .logo-text {
            color: #ffffff;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 1px;
            margin: 0;
            text-transform: uppercase;
          }
          .logo-sub {
            color: #c8a84b;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 2px;
            margin: 4px 0 0 0;
            text-transform: uppercase;
          }
          .content {
            padding: 40px;
            line-height: 1.6;
          }
          .greeting {
            font-size: 22px;
            font-weight: 700;
            color: #0f1a2e;
            margin-top: 0;
            margin-bottom: 15px;
            text-align: center;
          }
          .tagline {
            font-size: 15px;
            color: #c8a84b;
            text-align: center;
            font-weight: 600;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .text {
            font-size: 14px;
            color: #475569;
            margin-bottom: 24px;
          }
          .promo-box {
            text-align: center;
            background: linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%);
            color: #ffffff;
            padding: 24px;
            border-radius: 12px;
            margin: 30px 0;
            border: 1px solid #c8a84b;
          }
          .promo-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #c8a84b;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .promo-code {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 2px;
            margin: 0;
          }
          .promo-desc {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 8px;
          }
          .btn-container {
            text-align: center;
            margin: 30px 0;
          }
          .btn {
            display: inline-block;
            background-color: #c8a84b;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 9999px;
            box-shadow: 0 4px 10px rgba(200, 168, 75, 0.25);
          }
          .footer {
            background-color: #f1f5f9;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            font-size: 12px;
            color: #94a3b8;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <p class="logo-text">Highlanders</p>
              <p class="logo-sub">Sports & Fitness</p>
            </div>
            <div class="content">
              <h1 class="greeting">Welcome to the Squad!</h1>
              <div class="tagline">You are officially in the game</div>
              <p class="text">Hi there,<br><br>Thank you for subscribing to the Highlanders Sports & Fitness newsletter! You'll now be the first to know about new arrivals, elite training tips, and premium sports gear drops.</p>
              
              <div class="promo-box">
                <div class="promo-label">Your Exclusive Subscription Discount</div>
                <div class="promo-code">WELCOME10</div>
                <div class="promo-desc">Use this code at checkout to claim 10% off your next purchase.</div>
              </div>
              
              <p class="text">Ready to upgrade your training gear? Use your coupon code and check out our latest collections of professional equipment.</p>
              
              <div class="btn-container">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Shop Latest Gear</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">© ${new Date().getFullYear()} Highlanders Sports & Fitness. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
