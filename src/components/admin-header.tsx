"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogOut, User, Bell, LayoutDashboard, Store, Trophy, Wrench, Tag, Package, CreditCard } from "lucide-react";
import Image from "next/image";
import type { Session } from "next-auth";

const pageMap: Record<string, { title: string; subtitle: string; icon: React.ElementType }> = {
  "/admin":           { title: "Dashboard",   subtitle: "Overview of your store performance",      icon: LayoutDashboard },
  "/admin/landing":   { title: "Landing",     subtitle: "Manage hero banners and page content",    icon: Store           },
  "/admin/sports":    { title: "Sports",      subtitle: "Manage sports categories and equipment",  icon: Trophy          },
  "/admin/equipment": { title: "Equipment",   subtitle: "Configure equipment specifications",       icon: Wrench          },
  "/admin/brands":    { title: "Brands",      subtitle: "Manage your product brands",              icon: Tag             },
  "/admin/products":  { title: "Products",    subtitle: "Manage your product inventory",           icon: Package         },
  "/admin/checkout":  { title: "Checkouts",   subtitle: "View and manage customer orders",         icon: CreditCard      },
};

function getCurrentPage(pathname: string) {
  // Exact match first, then prefix match
  if (pageMap[pathname]) return pageMap[pathname];
  const matched = Object.entries(pageMap).find(([key]) => key !== "/admin" && pathname.startsWith(key));
  if (matched) return matched[1];
  return { title: "Admin", subtitle: "Highlanders Sports & Fitness", icon: LayoutDashboard };
}

export function AdminHeader({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const page = getCurrentPage(pathname);
  const PageIcon = page.icon;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <header className="shrink-0 border-b border-[#e8edf5] bg-white shadow-sm">
      {/* ── Gold → navy gradient accent line ── */}
      <div
        className="h-0.5 w-full"
        style={{
          background: "linear-gradient(90deg, #0f1a2e 0%, #1e3a5f 35%, #c8a84b 65%, #f0c870 100%)",
        }}
      />

      <div className="flex items-center justify-between gap-4 px-6 py-3">
        {/* ── Left: Page identity ── */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Page icon bubble */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #1e3a5f 100%)" }}
          >
            <PageIcon className="h-5 w-5 text-white" />
          </div>

          {/* Title + subtitle */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-bold tracking-tight text-[#0f1a2e] leading-none">
                {page.title}
              </h1>
              {/* Breadcrumb */}
              <span className="hidden text-xs text-[#94a3b8] sm:inline">·</span>
              <span className="hidden text-xs font-medium text-[#94a3b8] sm:inline">
                Highlanders Admin
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-[#94a3b8]">{page.subtitle}</p>
          </div>
        </div>

        {/* ── Right: Actions + user ── */}
        <div className="flex shrink-0 items-center gap-2">

          {/* Bell */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#e8edf5] text-[#94a3b8] transition-all hover:border-[#c8d4e4] hover:bg-[#f0f4f8] hover:text-[#0f1a2e] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Divider */}
          <div className="h-7 w-px bg-[#e8edf5]" />

          {/* Avatar + name */}
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={36}
                  height={36}
                  className="rounded-xl object-cover ring-2 ring-[#e8edf5]"
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl ring-2 ring-[#e8edf5]"
                  style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f1a2e 100%)" }}
                >
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>

            <div className="hidden flex-col sm:flex" style={{ minWidth: 0 }}>
              <span className="text-sm font-semibold leading-tight text-[#0f1a2e]">
                {session?.user?.name ?? "Admin User"}
              </span>
              <span className="text-[10px] font-semibold capitalize" style={{ color: "#c8a84b" }}>
                {(session?.user as { role?: string })?.role ?? "Administrator"}
              </span>
            </div>
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 transition-all hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}