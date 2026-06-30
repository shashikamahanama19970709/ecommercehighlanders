import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendMail } from "@/lib/email";

function formatNotificationPrice(amount: number) {
  return `$${Number(amount).toFixed(2)}`;
}

export async function checkAndSendRestockNotifications(productId: string, currentStock: number) {
  if (currentStock <= 0) return;

  try {
    const notificationsCol = await getCollection<any>("restock_notifications");
    
    // Find all unnotified subscribers for this product
    const pendingNotifications = await notificationsCol.find({
      productId: productId,
      notified: { $ne: true }
    }).toArray();

    if (pendingNotifications.length === 0) return;

    // Fetch product details
    const productsCol = await getCollection<any>("products");
    const product = await productsCol.findOne({ _id: new ObjectId(productId) });
    if (!product) return;

    const productName = product.name || "Sports Equipment";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const productUrl = `${appUrl}/shop-by-sport?sportId=${product.sport || ''}`;

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Product Restocked!</title>
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
            .product-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              background-color: #f8fafc;
            }
            .btn-container {
              text-align: center;
              margin: 30px 0;
            }
            .btn {
              display: inline-block;
              background-color: #0f1a2e;
              color: #ffffff !important;
              text-decoration: none;
              padding: 12px 28px;
              font-size: 14px;
              font-weight: 700;
              border-radius: 9999px;
              box-shadow: 0 4px 10px rgba(15, 26, 46, 0.2);
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
                <h1 class="greeting">Back In Stock!</h1>
                <div class="tagline">Premium equipment restocked</div>
                <p class="text">Hi there,<br><br>Good news! An item you requested a restock notification for is back in stock and ready to buy. Grab yours before it runs out again!</p>
                
                <div class="product-card">
                  <strong style="font-size: 16px; color: #0f1a2e;">${productName}</strong>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b;">
                    Price: ${formatNotificationPrice(product.price || 0)}
                  </p>
                </div>
                
                <div class="btn-container">
                  <a href="${productUrl}" class="btn">Buy Now</a>
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

    for (const notification of pendingNotifications) {
      await sendMail({
        to: notification.email,
        subject: `🔥 Back in Stock: ${productName} - Highlanders Sports & Fitness`,
        html: emailTemplate,
        fromKey: "support",
      }).catch(err => console.error(`Failed to send restock email to ${notification.email}:`, err));
    }

    await notificationsCol.updateMany(
      { productId: productId, notified: { $ne: true } },
      { $set: { notified: true, notifiedAt: new Date() } }
    );
  } catch (error) {
    console.error("Error checking and sending restock notifications:", error);
  }
}
