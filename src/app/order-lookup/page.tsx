"use client";

import { useState } from "react";

function formatOrderPrice(amount: number, order?: any) {
  if (!order) return `$${amount.toFixed(2)}`;
  const rate = order.currencyRate || 1.0;
  const symbol = order.currencySymbol || '$';
  const converted = amount * rate;
  const space = symbol.length > 1 ? ' ' : '';
  return `${symbol}${space}${converted.toFixed(2)}`;
}

export default function OrderLookupPage() {
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/order-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), sessionId: sessionId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order not found.");
      setResult(data.session);
    } catch (err: any) {
      setError(err.message || "Order not found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Order Lookup</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Session ID</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 font-mono"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white rounded py-2 font-semibold disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Looking up…" : "Find Order"}
        </button>
      </form>
      {error && <div className="mt-4 text-red-600">{error}</div>}
      {result && (
        <div className="mt-6 border rounded p-4 bg-muted">
          <h2 className="font-semibold mb-2">Order Details</h2>
          <div className="mb-1">Email: <span className="font-mono">{result.email}</span></div>
          <div className="mb-1">Session ID: <span className="font-mono">{result.stripeSessionId}</span></div>
          <div className="mb-1">Status: <b>{result.status}</b></div>
          <div className="mb-1">Total: <b>{formatOrderPrice(result.totalUsd, result)}</b></div>
          <div className="mb-1">Created: {new Date(result.createdAt).toLocaleString()}</div>
          <h3 className="mt-3 font-medium">Items</h3>
          <ul className="list-disc ml-6">
            {result.items.map((item: any) => (
              <li key={item.productId}>
                {item.name} × {item.quantity} — {formatOrderPrice(item.priceUsd, result)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
