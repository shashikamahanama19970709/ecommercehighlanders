"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Eye, 
  X, 
  MapPin, 
  Truck, 
  AlertCircle, 
  CreditCard, 
  Calendar, 
  DollarSign,
  Play
} from "lucide-react";

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
  orderStatus?: string;
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
  [key: string]: unknown;
}

// Helpers for badges
function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "order_created" || s === "succeeded" || s === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Paid
      </span>
    );
  }
  if (s === "dispatched") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Dispatched
      </span>
    );
  }
  if (s === "created" || s === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {status}
    </span>
  );
}

function getSandboxBadge(isSandbox: boolean) {
  if (isSandbox) {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
        Sandbox
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
      Live
    </span>
  );
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page to 1 on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Adjust pagination if sessions count changes
  useEffect(() => {
    const totalPages = Math.ceil(sessions.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [sessions.length, currentPage]);

  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = sessions.slice(startIndex, startIndex + itemsPerPage);

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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#0f1a2e] tracking-tight">Checkout Sessions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor, audit, and inspect recent payment sessions and order mappings.
          </p>
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email or session ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-[#0f1a2e] focus:ring-2 focus:ring-[#0f1a2e]/10"
          />
        </div>
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#c8a84b]" />
          <p className="text-sm text-slate-500 font-bold mt-4">Loading sessions...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-6 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm text-center p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No sessions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Try adjusting your search criteria or checking back later.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/70">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Environment</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedSessions.map((s) => (
                  <tr key={s.stripeSessionId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase">
                          {s.email?.slice(0, 2) || "U"}
                        </div>
                        <span className="font-semibold text-slate-800">{s.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#0f1a2e] bg-slate-100 px-2 py-1 rounded">
                        £{s.totalUsd.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(s.orderStatus || s.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSandboxBadge(s.sandboxEnabled)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      {s.orderId ? (
                        <button
                          onClick={async () => {
                            try {
                              setViewOrder(null);
                              setViewOrderId(s.orderId ?? null);   
                              setDispatchError(null);

                              const res = await fetch(`/api/admin/orders/${s.orderId}`);
                              if (!res.ok) throw new Error();
                              const data = await res.json();
                              setViewOrder(data.order);
                            } catch {
                              setViewOrder(null);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#0f1a2e] px-4 py-2 font-bold text-white shadow-sm hover:bg-[#c8a84b] hover:shadow transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Order</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-semibold px-3 py-1.5 border border-slate-100 rounded-full bg-slate-50/50">
                          No Order
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 p-6">
              <p className="text-xs text-slate-500 font-semibold">
                Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(startIndex + itemsPerPage, sessions.length)}
                </span>{" "}
                of <span className="font-bold text-slate-800">{sessions.length}</span> sessions
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 px-3 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      currentPage === page
                        ? "bg-[#0f1a2e] text-white shadow"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-8 px-3 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal - Checkout Session Detail */}
      {viewOrder && viewOrderId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setViewOrder(null);
                setViewOrderId(null);
              }}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:text-black hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c8a84b]/10 text-[#c8a84b]">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#0f1a2e] tracking-tight">Order Details</h2>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  ID: {viewOrder._id}
                </div>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100/50 text-sm mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                <span className="font-bold text-[#0f1a2e] uppercase inline-block mt-0.5">{viewOrder.status}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Created</span>
                <span className="font-medium text-slate-700 inline-block mt-0.5">
                  {new Date(viewOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 border-t border-slate-200/50 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Last Update</span>
                <span className="font-medium text-slate-700 inline-block mt-0.5">
                  {new Date(viewOrder.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <h3 className="text-sm font-bold text-slate-800 mb-3 tracking-tight">Order Items</h3>
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-4 py-2.5 text-center font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {viewOrder.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">£{item.priceUsd.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#0f1a2e]">
                        £{(item.priceUsd * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Delivery Location Section */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2 tracking-tight">
                <MapPin className="h-4 w-4 text-[#c8a84b]" />
                <span>Delivery Location Tracking</span>
              </h3>

              {viewOrder.deliveryLocation ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-100/50 p-5 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Latitude</span>
                      <span className="font-mono text-slate-800">{viewOrder.deliveryLocation.lat}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Longitude</span>
                      <span className="font-mono text-slate-800">{viewOrder.deliveryLocation.lng}</span>
                    </div>
                    <div className="col-span-2 border-t border-slate-200/50 pt-2 mt-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Location Updated</span>
                      <span>{new Date(viewOrder.deliveryLocation.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Simulate coordinates trigger */}
                  <button
                    onClick={async () => {
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
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <Play className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                    <span>Simulate Courier Movement</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl border border-slate-100/50 p-5 mb-4 text-center">
                  <p className="text-xs text-slate-500 font-medium mb-3">No delivery location has been set for this order yet.</p>
                  <button
                    onClick={async () => {
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f1a2e] text-white px-4 py-2 text-xs font-bold shadow hover:bg-[#c8a84b] transition-all"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Assign Initial Location</span>
                  </button>
                </div>
              )}

              {/* Coordinate Form */}
              {viewOrder.deliveryLocation && (
                <form
                  className="flex flex-wrap gap-3 items-end bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
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
                  <div className="flex-1 min-w-[120px] space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lat</label>
                    <input
                      type="number"
                      step="any"
                      name="lat"
                      defaultValue={viewOrder.deliveryLocation.lat}
                      className="w-full border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold outline-none focus:border-[#0f1a2e]"
                      placeholder="Latitude"
                      required
                    />
                  </div>
                  <div className="flex-1 min-w-[120px] space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lng</label>
                    <input
                      type="number"
                      step="any"
                      name="lng"
                      defaultValue={viewOrder.deliveryLocation.lng}
                      className="w-full border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold outline-none focus:border-[#0f1a2e]"
                      placeholder="Longitude"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#0f1a2e] hover:bg-[#c8a84b] text-white px-4 py-2.5 text-xs font-bold transition-all shrink-0"
                  >
                    Update Location
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Actions - Dispatch */}
            <div className="flex items-center justify-between border-t border-slate-100 mt-6 pt-6 gap-4">
              <button
                disabled={dispatching || viewOrder.status === "dispatched"}
                onClick={async () => {
                  try {
                    setDispatching(true);
                    setDispatchError(null);

                    const res = await fetch(`/api/admin/orders/${viewOrder._id}/dispatch`, { 
                      method: "POST" 
                    });
                    if (!res.ok) throw new Error();
                    setViewOrder({ ...viewOrder, status: "dispatched" });
                  } catch {
                    setDispatchError("Failed to dispatch order");
                  } finally {
                    setDispatching(false);
                  }
                }}
                className={`flex-1 rounded-xl py-3 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all duration-300 ${
                  viewOrder.status === "dispatched"
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                    : "bg-[#0f1a2e] hover:bg-emerald-600"
                }`}
              >
                {viewOrder.status === "dispatched" ? "Dispatched Successfully" : "Dispatch Order"}
              </button>

              {dispatchError && (
                <div className="text-red-600 text-xs font-bold">
                  {dispatchError}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}