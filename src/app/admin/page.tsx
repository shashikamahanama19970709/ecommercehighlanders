import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth";
import { getCollection } from "@/lib/mongodb";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/admin/login");
  }

  const ordersCol = await getCollection<Order>("orders");
  const productsCol = await getCollection<Product>("products");

  const [orders, products] = await Promise.all([
    ordersCol.find({}).toArray(),
    productsCol.find({}).toArray(),
  ]);

  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.totalUsd, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Overview of sales and inventory.</p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3 text-xs">
        <div className="rounded-2xl border bg-background p-4">
          <p className="text-[11px] text-muted-foreground">Total revenue (USD)</p>
          <p className="mt-1 text-xl font-semibold text-foreground">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border bg-background p-4">
          <p className="text-[11px] text-muted-foreground">Orders</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{orders.length}</p>
        </div>
        <div className="rounded-2xl border bg-background p-4">
          <p className="text-[11px] text-muted-foreground">Active products</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{products.filter((p) => p.isActive).length}</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] text-xs">
        <div className="space-y-3 overflow-hidden rounded-2xl border bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recent orders</h2>
          </div>
          <div className="max-h-72 overflow-auto text-[11px]">
            <table className="min-w-full text-left">
              <thead className="bg-muted text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Total (USD)</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      No orders yet.
                    </td>
                  </tr>
                )}
                {orders.slice(0, 10).map((order) => (
                  <tr key={order._id as any} className="border-t text-[11px] text-foreground">
                    <td className="px-4 py-2">{order.email}</td>
                    <td className="px-4 py-2">${order.totalUsd.toFixed(2)}</td>
                    <td className="px-4 py-2 capitalize">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 overflow-hidden rounded-2xl border bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inventory</h2>
          </div>
          <div className="max-h-72 overflow-auto text-[11px]">
            <table className="min-w-full text-left">
              <thead className="bg-muted text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      No products yet. Use the upcoming product management screen to add items.
                    </td>
                  </tr>
                )}
                {products.map((product) => (
                  <tr key={product._id as any} className="border-t text-foreground">
                    <td className="px-4 py-2">{product.name}</td>
                    <td className="px-4 py-2">{product.category}</td>
                    <td className="px-4 py-2">{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
