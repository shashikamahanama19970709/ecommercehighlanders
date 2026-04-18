import { Suspense } from 'react';
import { CheckoutSessionDetail } from './ui/checkout-session-detail';

export default function AdminCheckoutDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <CheckoutSessionDetail id={params.id} />
    </Suspense>
  );
}
