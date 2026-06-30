"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  Package,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  FileText
} from "lucide-react";
import ImageWithFallback from "@/components/image-with-fallback";

// Helper to format currency pricing based on order currency settings
function formatOrderPrice(amount: number, order?: any) {
  if (!order) return `$${amount.toFixed(2)}`;
  const rate = order.currencyRate || 1.0;
  const symbol = order.currencySymbol || '$';
  const converted = amount * rate;
  const space = symbol.length > 1 ? ' ' : '';
  return `${symbol}${space}${converted.toFixed(2)}`;
}

export default function OrderLookupPage() {
  const { data: session, status: authStatus } = useSession();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'dispatched' | 'failed' | 'lookup'>('all');
  
  // States for logged in user orders
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // States for guest order lookup form
  const [guestEmail, setGuestEmail] = useState("");
  const [guestSessionId, setGuestSessionId] = useState("");
  const [guestResult, setGuestResult] = useState<any>(null);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  
  // Dynamic product database mapping for image display
  const [products, setProducts] = useState<any[]>([]);
  
  // Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  
  // Expanded invoice breakdown states per order
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<Record<string, boolean>>({});

  // 1. Fetch user orders if authenticated
  useEffect(() => {
    if (session?.user) {
      setLoadingOrders(true);
      fetch("/api/orders")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load orders");
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setOrders(data);
          }
        })
        .catch((err) => console.error("Error loading user orders:", err))
        .finally(() => setLoadingOrders(false));
    }
  }, [session]);

  // 2. Fetch product list for images
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => console.error("Failed to load products list:", err));
  }, []);

  // Handle Guest Lookup Submission
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError(null);
    setGuestResult(null);
    setGuestLoading(true);
    try {
      const res = await fetch("/api/order-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestEmail.trim(), sessionId: guestSessionId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order not found.");
      setGuestResult(data.session);
    } catch (err: any) {
      setGuestError(err.message || "Order not found. Please check your inputs.");
    } finally {
      setGuestLoading(false);
    }
  };

  // Toggle invoice details expansion
  const toggleExpanded = (id: string) => {
    setExpandedInvoiceIds((v) => ({ ...v, [id]: !v[id] }));
  };

  // Resolve product image from loaded products map
  const getProductImage = (productId: string) => {
    const matched = products.find((p) => String(p._id) === productId);
    return matched?.featureImageUrl || "";
  };

  // Filter orders by active tab
  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'paid') return orders.filter(o => o.status === 'paid' || o.status === 'pending');
    if (activeTab === 'dispatched') return orders.filter(o => o.status === 'dispatched');
    if (activeTab === 'failed') return orders.filter(o => o.status === 'failed' || o.status === 'cancelled');
    return [];
  };

  const filteredOrders = getFilteredOrders();

  // Helper to resolve delivery estimation dates (e.g. 7-15 days from checkout)
  const getDeliveryEstimation = (createdAtStr?: string) => {
    const start = new Date(createdAtStr || Date.now());
    const end = new Date(createdAtStr || Date.now());
    start.setDate(start.getDate() + 7);
    end.setDate(end.getDate() + 15);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  // Render a Single Order Card (styled like SHEIN)
  const renderOrderCard = (order: any) => {
    const isExpanded = expandedInvoiceIds[order._id] || false;
    const formattedTotal = formatOrderPrice(order.totalUsd, order);
    const orderNo = order.stripeSessionId?.slice(8, 22).toUpperCase() || order._id?.slice(-12).toUpperCase() || 'N/A';

    return (
      <div key={order._id} className="border border-[#dde4ee] bg-white rounded-2xl p-6 mb-6 shadow-sm shadow-[#0f1a2e]/04 transition-all hover:border-[#cbd4e4]">
        
        {/* Card Header: Order Metadata */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#f1f5f9] pb-4 mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0f1a2e]/06 text-[#0f1a2e]">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#94a3b8]">Order No.</span>
                <span className="text-sm font-bold text-[#0f1a2e] font-mono">{orderNo}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#64748b] mt-0.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {order.status === 'paid' && (
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Paid / Processing
              </span>
            )}
            {order.status === 'dispatched' && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Shipped
              </span>
            )}
            {order.status === 'failed' && (
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                Failed
              </span>
            )}
            {order.status === 'cancelled' && (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                Cancelled
              </span>
            )}
          </div>
        </div>

        {/* Delivery Estimation Banner */}
        {order.status !== 'failed' && order.status !== 'cancelled' && (
          <div className="flex items-center gap-2 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] px-4 py-3 mb-4 text-xs font-semibold text-[#1e3a5f]">
            <Truck className="h-4 w-4 text-[#1e3a5f]/80" />
            <span>Estimated Delivery: <b className="text-[#0f1a2e]">{getDeliveryEstimation(order.createdAt)}</b></span>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-4 mb-4">
          {order.items.map((item: any) => {
            const itemImageUrl = getProductImage(item.productId);
            return (
              <div key={item.productId} className="flex gap-4 items-center">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#dde4ee] bg-[#f8fafc] flex items-center justify-center">
                  {itemImageUrl ? (
                    <ImageWithFallback
                      src={itemImageUrl}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-[#94a3b8]" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="text-sm font-semibold text-[#0f1a2e] truncate">{item.name}</h4>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Category: {item.category || "Sports"}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-bold text-[#c8a84b] font-mono">
                      {formatOrderPrice(item.priceUsd, order)}
                    </span>
                    <span className="text-xs font-bold text-[#94a3b8]">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-[#f1f5f9] pt-4 gap-4">
          <button
            onClick={() => toggleExpanded(order._id)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1e3a5f] hover:text-[#c8a84b] transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>{isExpanded ? "Hide Invoice Details" : "View Invoice Details"}</span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTrackingOrder(order)}
              className="rounded-full border-2 border-[#0f1a2e] bg-white px-4 py-2 text-xs font-bold text-[#0f1a2e] hover:bg-[#0f1a2e] hover:text-white transition-colors"
            >
              Track Package
            </button>
            <span className="text-sm font-bold text-[#0f1a2e]">
              Total: {formattedTotal}
            </span>
          </div>
        </div>

        {/* Expandable Invoice Breakdown */}
        {isExpanded && (
          <div className="mt-4 border-t border-[#f1f5f9] pt-4 text-xs space-y-2 bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
            <div className="flex justify-between">
              <span className="text-[#64748b]">Items Subtotal</span>
              <span className="font-semibold text-[#0f1a2e] font-mono">
                {formatOrderPrice(order.items.reduce((sum: number, i: any) => sum + i.priceUsd * i.quantity, 0), order)}
              </span>
            </div>
            
            {order.shipping && (
              <div className="flex justify-between">
                <span className="text-[#64748b]">Shipping ({order.shipping.label})</span>
                <span className="font-semibold text-[#0f1a2e] font-mono">
                  {formatOrderPrice(order.shipping.cost, order)}
                </span>
              </div>
            )}
            
            {order.tax && (
              <div className="flex justify-between">
                <span className="text-[#64748b]">Tax ({order.tax.label})</span>
                <span className="font-semibold text-[#0f1a2e] font-mono">
                  {formatOrderPrice(order.tax.amount, order)}
                </span>
              </div>
            )}
            
            {order.discount && (
              <div className="flex justify-between text-green-700">
                <span>Discount ({order.discount.label})</span>
                <span className="font-semibold font-mono">
                  -{formatOrderPrice(order.discount.amount, order)}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t border-[#e2e8f0] pt-2 font-bold text-sm text-[#0f1a2e]">
              <span>Grand Total</span>
              <span className="font-mono">{formattedTotal}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Back to store */}
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f1a2e]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to store
        </Link>

        {/* Page title header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0f1a2e] uppercase font-outfit">My Orders</h1>
          <p className="text-sm text-[#64748b] mt-1.5">Track shipping details and review past purchase transactions.</p>
        </div>

        {/* Tab Selection Headers (SHEIN Style) */}
        {session?.user && (
          <div className="flex border-b border-[#dde4ee] mb-8 overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
            {[
              { id: 'all', label: 'All orders' },
              { id: 'paid', label: 'Processing' },
              { id: 'dispatched', label: 'Shipped' },
              { id: 'failed', label: 'Failed' },
              { id: 'lookup', label: 'Guest Lookup' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3.5 text-sm font-semibold border-b-2 transition-all focus:outline-none ${
                  activeTab === tab.id
                    ? 'border-[#0f1a2e] text-[#0f1a2e] font-bold'
                    : 'border-transparent text-[#64748b] hover:text-[#0f1a2e]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        {session?.user && activeTab !== 'lookup' ? (
          <div>
            {loadingOrders ? (
              // Loading Skeleton
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="border border-[#dde4ee] bg-white rounded-2xl p-6 mb-6 animate-pulse">
                    <div className="h-6 bg-[#f1f5f9] rounded w-1/3 mb-4" />
                    <div className="h-10 bg-[#f1f5f9] rounded mb-4" />
                    <div className="h-16 bg-[#f1f5f9] rounded mb-4" />
                    <div className="h-8 bg-[#f1f5f9] rounded w-1/4 ml-auto" />
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              // Empty State
              <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0f1a2e]/06 text-[#0f1a2e] mb-4">
                  <Package className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-[#0f1a2e] uppercase font-outfit">No orders found</h3>
                <p className="mt-1.5 text-sm text-[#64748b] max-w-sm mx-auto">
                  You do not have any orders in this tab. Start browsing sports gear to create an order.
                </p>
                <div className="mt-6">
                  <Link
                    href="/best-selling"
                    className="inline-flex items-center gap-2 rounded-full bg-[#0f1a2e] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1e3a5f]"
                  >
                    Shop Best Sellers
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              // List Orders
              <div>
                {filteredOrders.map((o) => renderOrderCard(o))}
              </div>
            )}
          </div>
        ) : (
          // Guest Order Lookup Form Tab (displays for guests, or when 'lookup' is active)
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-[#dde4ee] p-8 shadow-lg shadow-[#0f1a2e]/06">
            
            {/* Header info */}
            <div className="text-center mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f]/06 text-[#1e3a5f] mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#0f1a2e] uppercase font-outfit">Guest Order Lookup</h2>
              <p className="text-xs text-[#64748b] mt-1">If you checked out as a guest, search your receipt using email and payment session ID.</p>
            </div>

            <form onSubmit={handleGuestSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f1a2e] uppercase">Email address</label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0f1a2e] uppercase">Stripe Session ID</label>
                <input
                  type="text"
                  required
                  value={guestSessionId}
                  onChange={(e) => setGuestSessionId(e.target.value)}
                  placeholder="cs_test_..."
                  className="w-full rounded-xl border border-[#dde4ee] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f1a2e] placeholder:text-[#94a3b8] font-mono outline-none transition-all duration-150 focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/12"
                />
              </div>

              <button
                type="submit"
                disabled={guestLoading}
                className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)" }}
              >
                {guestLoading ? "Searching orders..." : "Find My Order"}
              </button>
            </form>

            {guestError && (
              <div className="mt-4 flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{guestError}</span>
              </div>
            )}

            {guestResult && (
              <div className="mt-8 border-t border-[#dde4ee] pt-6">
                <h3 className="text-sm font-bold text-[#0f1a2e] mb-4 text-left uppercase">Search Results</h3>
                {renderOrderCard(guestResult)}
              </div>
            )}

            {!session?.user && (
              <div className="mt-6 border-t border-[#dde4ee] pt-4 text-center">
                <p className="text-xs text-[#64748b]">
                  Have a store profile?{" "}
                  <Link href="/login" className="font-bold text-[#1e3a5f] hover:underline">
                    Sign in to see all orders
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Package Tracking Modal overlay (SHEIN style popup) */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#dde4ee] bg-white p-6 shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#c8a84b]" />
                <h3 className="text-md font-bold text-[#0f1a2e] uppercase font-outfit">Track Shipment</h3>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="rounded-full p-1 text-[#94a3b8] hover:bg-[#f0f4f8] hover:text-[#0f1a2e] transition-colors"
                aria-label="Close modal"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Shipment Status Path */}
            <div className="space-y-6 text-left p-2">
              
              {/* Step 3: Out for delivery / Shipped */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    trackingOrder.status === 'dispatched'
                      ? 'border-[#c8a84b] bg-amber-50 text-[#c8a84b]'
                      : 'border-[#dde4ee] text-[#cbd5e1]'
                  }`}>
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="h-8 w-0.5 bg-[#dde4ee]" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${
                    trackingOrder.status === 'dispatched' ? 'text-[#0f1a2e]' : 'text-[#94a3b8]'
                  }`}>Shipped & In Transit</h4>
                  <p className="text-xs text-[#64748b] mt-0.5">Package handed over to delivery carrier. Estimated arrival in 7-15 business days.</p>
                </div>
              </div>

              {/* Step 2: Order Processed / Paid */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    trackingOrder.status === 'paid' || trackingOrder.status === 'dispatched'
                      ? 'border-green-500 bg-green-50 text-green-500'
                      : 'border-[#dde4ee] text-[#cbd5e1]'
                  }`}>
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="h-8 w-0.5 bg-green-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0f1a2e]">Payment Verified</h4>
                  <p className="text-xs text-[#64748b] mt-0.5">Transaction payment was processed successfully. Warehouse team is preparing packaging.</p>
                </div>
              </div>

              {/* Step 1: Order Created */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-500 bg-green-50 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0f1a2e]">Order Placed</h4>
                  <p className="text-xs text-[#64748b] mt-0.5">Order request logged successfully. System created invoice reference.</p>
                </div>
              </div>

            </div>

            {/* Close Button */}
            <div className="mt-6 border-t border-[#f1f5f9] pt-4 text-right">
              <button
                onClick={() => setTrackingOrder(null)}
                className="rounded-xl bg-[#0f1a2e] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1e3a5f] transition-colors"
              >
                Close Tracking
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
