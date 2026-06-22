import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCollection, connectToDatabase } from "@/lib/mongodb";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";
import ProductModel from "@/lib/models/Product";
import SportModel from "@/lib/models/Sport";
import EquipmentModel from "@/lib/models/Equipment";

// Status badge styles
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    paid:       { bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
    pending:    { bg: "#fef9c3", text: "#a16207", dot: "#eab308" },
    cancelled:  { bg: "#fee2e2", text: "#b91c1c", dot: "#ef4444" },
    refunded:   { bg: "#e0f2fe", text: "#0369a1", dot: "#38bdf8" },
  };
  const s = map[status] ?? { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

// Stat card
function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-sm">
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: accent }} />
      <div className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#94a3b8]">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0f1a2e]">{value}</p>
          {sub && <p className="mt-1 text-[11px] text-[#94a3b8]">{sub}</p>}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: accent + "18" }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/admin/login");
  }

  await connectToDatabase();

  const ordersCol = await getCollection<Order>("orders");
  const [orders, products] = await Promise.all([
    ordersCol.find({}).toArray(),
    ProductModel.find({})
      .populate("sport")
      .populate("equipment")
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<any[]>,
  ]);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalUsd, 0);
  const activeProducts = products.filter((p) => p.isActive).length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-7">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0f1a2e]">
            Welcome back! 👋
          </h1>
          <p className="mt-1 text-sm text-[#64748b]">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-full border border-[#dde4ee] bg-white px-4 py-2 text-xs font-medium text-[#64748b] shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live data
        </div>
      </div>

      {/* ── Stat cards ── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`From ${paidOrders.length} paid order${paidOrders.length !== 1 ? "s" : ""}`}
          accent="#c8a84b"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <StatCard
          label="Total Orders"
          value={String(orders.length)}
          sub={`${pendingOrders} pending review`}
          accent="#1e3a5f"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          }
        />
        <StatCard
          label="Active Products"
          value={String(activeProducts)}
          sub={`${products.length - activeProducts} inactive`}
          accent="#7c3aed"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"/>
            </svg>
          }
        />
        <StatCard
          label="Total Products"
          value={String(products.length)}
          sub="In your catalog"
          accent="#0891b2"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          }
        />
      </section>

      {/* ── Tables grid ── */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">

        {/* Recent orders table */}
        <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-sm">
          {/* Table header */}
          <div className="flex items-center justify-between border-b border-[#f0f4f8] px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)" }}
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0f1a2e]">Recent Orders</h2>
                <p className="text-[10px] text-[#94a3b8]">Last {Math.min(orders.length, 10)} orders</p>
              </div>
            </div>
            <span className="rounded-full border border-[#e8edf5] px-2.5 py-1 text-[10px] font-semibold text-[#64748b]">
              {orders.length} total
            </span>
          </div>

          {/* Table */}
          <div className="max-h-80 overflow-auto">
            <table className="min-w-full text-left">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: "#f8fafc" }}>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Customer</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Total</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f8]">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-[#94a3b8]">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 10).map((order) => (
                    <tr key={String(order._id)} className="group transition-colors hover:bg-[#f8fafc]">
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-[#0f1a2e]">{order.email}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-[#0f1a2e]">
                          ${order.totalUsd.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory table */}
        <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f4f8] px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"/>
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0f1a2e]">Inventory</h2>
                <p className="text-[10px] text-[#94a3b8]">Stock overview</p>
              </div>
            </div>
            <span className="rounded-full border border-[#e8edf5] px-2.5 py-1 text-[10px] font-semibold text-[#64748b]">
              {products.length} items
            </span>
          </div>

          <div className="max-h-80 overflow-auto">
            <table className="min-w-full text-left">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: "#f8fafc" }}>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Product</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Sport</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f8]">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-sm text-[#94a3b8]">
                      No products yet
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const stock = product.stock ?? 0;
                    const stockColor =
                      stock === 0 ? "#ef4444" : stock < 5 ? "#f59e0b" : "#22c55e";
                    return (
                      <tr key={String(product._id)} className="transition-colors hover:bg-[#f8fafc]">
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium text-[#0f1a2e] line-clamp-1">
                            {product.name ?? product.equipment?.name ?? (typeof product.equipment === 'string' ? product.equipment : "—")}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-[#64748b]">
                            {product.sport?.name ?? (typeof product.sport === 'string' ? product.sport : "—")}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                            style={{ background: stockColor + "18", color: stockColor }}
                          >
                            {stock === 0 ? "Out" : stock}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
