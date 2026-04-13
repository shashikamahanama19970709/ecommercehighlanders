import Link from 'next/link';

export default function OrderConfirmationPage() {
  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Order Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}