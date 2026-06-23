"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem {
  productId: string;
  name: string;
  priceUsd: number;
  quantity: number;
}

interface CheckoutSession {
  _id: string;
  stripeSessionId: string;
  email: string;
  currency: string;
  totalUsd: number;
  status: string;
  sandboxEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  orderId?: string;
}


export function CheckoutSessionDetail({ id }: { id: string }) {
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugs, setDebugs] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    setDebugs([]);
    fetch(`/api/admin/checkout/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session);
          setDebugs(data.debug ? [data.debug] : []);
          setLoading(false);
        } else {
          setDebugs(data.debug ? [data.debug] : []);
          // Try by stripeSessionId if not found by _id
          fetch(`/api/admin/checkout/by-stripe-session/${id}`)
            .then((res2) => res2.json())
            .then((data2) => {
              setSession(data2.session || null);
              setDebugs((prev) => data2.debug ? [...prev, data2.debug] : prev);
              setLoading(false);
            })
            .catch(() => {
              setError("Failed to load checkout session");
              setLoading(false);
            });
        }
      })
      .catch(() => {
        setError("Failed to load checkout session");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!session) return (
    <div className="p-8">
      Session not found.<br />
      Debug: id param = <span className="font-mono">{id}</span>
      {debugs.length > 0 && (
        <div className="mt-4">
          {debugs.map((dbg, i) => (
            <pre key={i} className="mb-2 bg-gray-100 p-2 text-xs rounded border overflow-x-auto">
              {JSON.stringify(dbg, null, 2)}
            </pre>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Checkout Session Detail</h1>
      <div className="mb-4 text-sm text-muted-foreground">Session ID: <span className="font-mono">{session.stripeSessionId}</span></div>
      <div className="mb-2">Email: <span className="font-mono">{session.email}</span></div>
      <div className="mb-2">Total: <b>£{session.totalUsd.toFixed(2)}</b> GBP</div>
      <div className="mb-2">Status: <b>{session.status}</b></div>
      <div className="mb-2">Sandbox: {session.sandboxEnabled ? "Yes" : "No"}</div>
      <div className="mb-2">Created: {new Date(session.createdAt).toLocaleString()}</div>
      <div className="mb-2">Updated: {new Date(session.updatedAt).toLocaleString()}</div>
      {session.orderId && (
        <div className="mb-2">
          Order: <Link href={`/admin/orders/${session.orderId}`} className="underline text-blue-600">View Order</Link>
        </div>
      )}
      <h2 className="mt-6 mb-2 font-semibold">Items</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm mb-4">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 border">Product</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Price (£)</th>
              <th className="p-2 border">Subtotal (£)</th>
            </tr>
          </thead>
          <tbody>
            {session.items.map((item) => (
              <tr key={item.productId}>
                <td className="p-2 border">{item.name}</td>
                <td className="p-2 border">{item.quantity}</td>
                <td className="p-2 border">£{item.priceUsd.toFixed(2)}</td>
                <td className="p-2 border">£{(item.priceUsd * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="px-4 py-2 rounded bg-green-600 text-white">Mark as Paid</button>
        <button className="px-4 py-2 rounded bg-red-600 text-white">Mark as Failed</button>
        <button className="px-4 py-2 rounded bg-muted border" onClick={() => exportToCSV(session)}>Export CSV</button>
      </div>
    </div>
  );
}

function exportToCSV(session: CheckoutSession) {
  const rows = [
    ["Product", "Quantity", "Price", "Subtotal"],
    ...session.items.map((item) => [item.name, item.quantity, item.priceUsd, (item.priceUsd * item.quantity).toFixed(2)]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `checkout-session-${session.stripeSessionId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
