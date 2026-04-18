import { Suspense } from 'react';
import { OrderConfirmationClient } from './order-confirmation-client';

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <OrderConfirmationClient />
    </Suspense>
  );
}