"use client";

import { useEffect, useState } from "react";

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
  orderId?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  priceUsd: number;
}

interface Order {
  _id: string;
  status: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  deliveryLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
  // 👇 safer than `any`
  [key: string]: unknown;
}

export function CheckoutAdminPage() {
  const [sessions, setSessions] = useState<CheckoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/admin/checkout?search=${encodeURIComponent(search)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setSessions(data.sessions ?? []);
      })
      .catch(() => {
        setError("Failed to load checkout sessions");
      })
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Checkout Sessions</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by email or session ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-2 py-1 rounded w-64"
        />
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Total (£)</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Sandbox</th>
                <th className="p-2 border">Created</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.stripeSessionId}>
                  <td className="p-2 border">{s.email}</td>
                  <td className="p-2 border">
                    £{s.totalUsd.toFixed(2)}
                  </td>
                  <td className="p-2 border">{s.status}</td>
                  <td className="p-2 border">
                    {s.sandboxEnabled ? "Yes" : "No"}
                  </td>
                  <td className="p-2 border">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2 border">
                    {s.orderId ? (
                      <button
                        className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
                        onClick={async () => {
                          try {
                            setViewOrder(null);
                            setViewOrderId(s.orderId ?? null);   
                           setDispatchError(null);

                            const res = await fetch(
                              `/api/admin/orders/${s.orderId}`
                            );

                            if (!res.ok) throw new Error();

                            const data = await res.json();
                            setViewOrder(data.order);
                          } catch {
                            setViewOrder(null);
                          }
                        }}
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        No Order
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {viewOrder && viewOrderId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => {
                setViewOrder(null);
                setViewOrderId(null);
              }}
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-2">Order Details</h2>

            <div className="mb-2 text-sm text-muted-foreground">
              Order ID:{" "}
              <span className="font-mono">{viewOrder._id}</span>
            </div>

            <div className="mb-2">
              Status: <b>{viewOrder.status}</b>
            </div>

            <div className="mb-2">
              Created:{" "}
              {new Date(viewOrder.createdAt).toLocaleString()}
            </div>

            <div className="mb-2">
              Updated:{" "}
              {new Date(viewOrder.updatedAt).toLocaleString()}
            </div>

            <h3 className="mt-4 mb-2 font-semibold">Items</h3>

            <table className="min-w-full border text-xs mb-4">
              <thead>
                <tr className="bg-muted">
                  <th className="p-1 border">Product</th>
                  <th className="p-1 border">Quantity</th>
                  <th className="p-1 border">Price (£)</th>
                  <th className="p-1 border">Subtotal (£)</th>
                </tr>
              </thead>
              <tbody>
                {viewOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-1 border">{item.name}</td>
                    <td className="p-1 border">{item.quantity}</td>
                    <td className="p-1 border">
                      £{item.priceUsd.toFixed(2)}
                    </td>
                    <td className="p-1 border">
                      £{(item.priceUsd * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Delivery Location Tracking */}
            {viewOrder.deliveryLocation && (
              <div className="mt-4">
                <h3 className="font-semibold mb-1">Delivery Location</h3>
                <div className="text-xs mb-1">
                  Lat: {viewOrder.deliveryLocation.lat}, Lng: {viewOrder.deliveryLocation.lng}
                  <br />
                  Updated: {new Date(viewOrder.deliveryLocation.updatedAt).toLocaleString()}
                </div>
                <button
                  className="px-2 py-1 rounded bg-blue-500 text-white text-xs"
                  onClick={async () => {
                    // Simulate location update (for demo/testing)
                    function randomOffset() {
                      return (Math.random() - 0.5) * 0.01;
                    }
                    const lat = Number(viewOrder.deliveryLocation?.lat ?? 0) + randomOffset();
                    const lng = Number(viewOrder.deliveryLocation?.lng ?? 0) + randomOffset();
                    const res = await fetch(`/api/orders/location?orderId=${viewOrder._id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ lat, lng })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setViewOrder({ ...viewOrder, deliveryLocation: data.deliveryLocation });
                    }
                  }}
                >
                  Simulate Location Update
                </button>
              </div>
            )}
            {!viewOrder.deliveryLocation && (
              <div className="mt-4">
                <h3 className="font-semibold mb-1">Delivery Location</h3>
                <button
                  className="px-2 py-1 rounded bg-blue-500 text-white text-xs"
                  onClick={async () => {
                    // Set initial location (for demo/testing)
                    const lat = 51.5 + Math.random();
                    const lng = -0.1 + Math.random();
                    const res = await fetch(`/api/orders/location?orderId=${viewOrder._id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ lat, lng })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setViewOrder({ ...viewOrder, deliveryLocation: data.deliveryLocation });
                    }
                  }}
                >
                  Set Initial Location
                </button>
              </div>
            )}

            {/* Manual Delivery Location Update */}
            {viewOrder.deliveryLocation && (
              <form
                className="mt-2 flex gap-2 items-center"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const lat = parseFloat(form.lat.value);
                  const lng = parseFloat(form.lng.value);
                  if (isNaN(lat) || isNaN(lng)) return;
                  const res = await fetch(`/api/orders/location?orderId=${viewOrder._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lng })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setViewOrder({ ...viewOrder, deliveryLocation: data.deliveryLocation });
                  }
                }}
              >
                <input
                  type="number"
                  step="any"
                  name="lat"
                  defaultValue={viewOrder.deliveryLocation.lat}
                  className="border px-1 py-0.5 rounded text-xs w-28"
                  placeholder="Latitude"
                  required
                />
                <input
                  type="number"
                  step="any"
                  name="lng"
                  defaultValue={viewOrder.deliveryLocation.lng}
                  className="border px-1 py-0.5 rounded text-xs w-28"
                  placeholder="Longitude"
                  required
                />
                <button
                  type="submit"
                  className="px-2 py-1 rounded bg-blue-700 text-white text-xs"
                >
                  Update Location
                </button>
              </form>
            )}

            <div className="flex gap-2 mt-4">
              <button
                className="px-4 py-2 rounded bg-green-600 text-white"
                disabled={
                  dispatching ||
                  viewOrder.status === "dispatched"
                }
                onClick={async () => {
                  try {
                    setDispatching(true);
                    setDispatchError(null);

                    const res = await fetch(
                      `/api/admin/orders/${viewOrder._id}/dispatch`,
                      { method: "POST" }
                    );

                    if (!res.ok) throw new Error();

                    setViewOrder({
                      ...viewOrder,
                      status: "dispatched",
                    });
                  } catch {
                    setDispatchError("Failed to dispatch order");
                  } finally {
                    setDispatching(false);
                  }
                }}
              >
                {viewOrder.status === "dispatched"
                  ? "Dispatched"
                  : "Dispatch Order"}
              </button>

              {dispatchError && (
                <span className="text-red-600 text-xs ml-2">
                  {dispatchError}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}