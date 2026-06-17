# Checkout Process Documentation

## Overview
The checkout flow guides a shopper from reviewing their cart to confirming the order. It is built with a **minimalist light theme** and a **two‑column dashboard**:
- **Left column** – Order review (items, quantities, and totals).
- **Right column** – Fulfillment details (shipping address, shipping options, tax calculation) and payment.

## UI Layout
| Column | Content |
|--------|---------|
| **Left** | *Cart items list* – image, name, quantity selector, price, subtotal. <br/>*Order summary* – subtotal, shipping, tax, discount, total. |
| **Right** | *Address Book* – select existing address or add a new one. <br/>*Shipping Options* – selectable list based on country. <br/>*Payment* – Stripe Checkout button (handled by `useCart`). |

The layout uses responsive flexbox (`flex` + `gap-8`) to collapse into a single column on narrow screens.

## Components Involved
- `src/app/checkout/page.tsx` – orchestrates the page layout and imports the sub‑components.
- `src/components/address-book.tsx` – lets the user pick or create an address.
- `src/app/order-confirmation/order-confirmation-client.tsx` – shows the confirmation screen after Stripe redirects back with `session_id`.
- `src/lib/cart-context.tsx` – global cart state and `clearCart()` call after a successful order.
- API routes (`/api/checkout/confirm`, `/api/orders/[id]`) – backend verification of the Stripe session and retrieval of order details.

## Checkout Flow Steps
1. **Cart Review** – Users adjust quantities. The `useCart` hook updates the cart state instantly.
2. **Address Selection** – `AddressBook` loads saved addresses from `/api/address`. Selecting an address stores it in local component state.
3. **Shipping Selection** – `getShippingOptionsForCountry` returns options based on the country; the UI displays a radio list.
4. **Tax Calculation** – `calculateTax` runs client‑side using the selected address and shipping option to compute tax.
5. **Place Order** – Clicking **Place Order** triggers a server‑side endpoint that creates a Stripe Checkout Session and redirects the browser.
6. **Stripe Checkout** – User completes payment on Stripe. Upon success Stripe redirects back to `/order-confirmation` with `session_id`.
7. **Confirmation** – `OrderConfirmationClient`:
   - Calls `/api/checkout/confirm?session_id=...`.
   - Handles three possible responses: `pending`, `confirmed`, `failed`.
   - On `confirmed`, it fetches the order details (`/api/orders/:id`), clears the cart, and displays a summary (items, shipping, tax, discounts, total, delivery location).
   - Provides graceful UI messages for `pending` and `error` states.

## Error Handling & Edge Cases
- **Missing session_id** – UI shows an error banner: *"Missing payment session."*.
- **Network failures** – Caught in try/catch; a generic *"Failed to confirm payment."* message is shown.
- **Pending payments** – Users are instructed to refresh the page; the component polls only on reload.
- **Address fetch failure** – `AddressBook` displays an error and allows retry.

## Accessibility
- All images now include a descriptive `alt` attribute (product name).
- `Image` components use `sizes="100vw"` for performance.
- Buttons and interactive elements have clear focus outlines and ARIA labels where appropriate.

## SEO Best Practices (static page)
- `<title>`: **Checkout – Your Store Name**
- `<meta name="description">`: Summarizes the checkout steps and highlights secure payment.
- Semantic HTML: `<main>`, `<section>`, `<header>`, `<footer>` used throughout.
- Single `<h1>` per page (`Checkout`).

---
*Prepared by Antigravity – your agentic coding assistant.*
