"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Store,
  Tag,
  Trophy,
  Wrench,
  CreditCard,
  ExternalLink,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard",  href: "/admin",           icon: LayoutDashboard, group: "overview" },
  { name: "Settings",   href: "/admin/settings",  icon: Settings,        group: "overview" },
  { name: "Landing",    href: "/admin/landing",   icon: Store,           group: "content"  },
  { name: "Sports",     href: "/admin/sports",    icon: Trophy,          group: "content"  },
  { name: "Equipment",  href: "/admin/equipment", icon: Wrench,          group: "content"  },
  { name: "Brands",     href: "/admin/brands",    icon: Tag,             group: "catalog"  },
  { name: "Products",   href: "/admin/products",  icon: Package,         group: "catalog"  },
  { name: "Checkouts",  href: "/admin/checkout",  icon: CreditCard,      group: "orders"   },
];

const groups = [
  { key: "overview", label: "Overview"      },
  { key: "content",  label: "Content"       },
  { key: "catalog",  label: "Catalog"       },
  { key: "orders",   label: "Orders"        },
];

export function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#000]/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col overflow-hidden transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "linear-gradient(180deg, #0f1a2e 0%, #0d1625 100%)" }}
      >
      {/* ── Brand header ───────────────────────────────────── */}
      <div
        className="flex shrink-0 flex-col items-center justify-center gap-2 px-5 py-6"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* SVG Mountain mark */}
        <div className="h-12 w-12">
          <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="asb-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e8edf5" />
                <stop offset="100%" stopColor="#8898b0" />
              </linearGradient>
              <linearGradient id="asb-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4a84b" />
                <stop offset="100%" stopColor="#9a6e08" />
              </linearGradient>
              <linearGradient id="asb-navy" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3a6090" />
                <stop offset="100%" stopColor="#1e3a5f" />
              </linearGradient>
            </defs>
            <polygon points="6,62 26,18 46,62"  fill="url(#asb-silver)" />
            <polygon points="24,62 44,8 64,62"  fill="url(#asb-silver)" opacity="0.75" />
            <polygon points="44,8 39,24 49,24"  fill="white" opacity="0.95" />
            <path d="M4,68 Q22,52 42,60 Q58,66 74,52" stroke="url(#asb-gold)"  strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M4,74 Q24,62 44,68 Q60,73 76,60" stroke="url(#asb-navy)" strokeWidth="3"   fill="none" strokeLinecap="round" opacity="0.5" />
          </svg>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <p className="text-[13px] font-black uppercase tracking-[0.22em] text-white leading-tight">
            Highlanders
          </p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: "#c8a84b" }}>
            Sports &amp; Fitness
          </p>
        </div>

        {/* Gold divider + label */}
        <div className="mt-1 flex items-center gap-2">
          <div className="h-px w-6 rounded-full" style={{ background: "rgba(200,168,75,0.4)" }} />
          <span className="text-[9px] font-semibold uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.3)" }}>
            Admin Panel
          </span>
          <div className="h-px w-6 rounded-full" style={{ background: "rgba(200,168,75,0.4)" }} />
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {groups.map((group) => {
          const items = navigation.filter((n) => n.group === group.key);
          return (
            <div key={group.key} className="mb-1">
              {/* Group label */}
              <p
                className="mb-1 px-3 text-[9px] font-bold uppercase tracking-[0.25em]"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                {group.label}
              </p>

              {/* Items */}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
                        style={
                          active
                            ? {
                                background: "rgba(200,168,75,0.15)",
                                color: "#f0c870",
                                boxShadow: "inset 0 0 0 1px rgba(200,168,75,0.25)",
                              }
                            : {
                                color: "rgba(255,255,255,0.55)",
                              }
                        }
                        onMouseEnter={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
                            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.9)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.55)";
                          }
                        }}
                      >
                        {/* Gold left border on active */}
                        {active && (
                          <span
                            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
                            style={{ background: "#c8a84b" }}
                          />
                        )}

                        <Icon
                          className="h-4 w-4 shrink-0"
                          style={{ color: active ? "#f0c870" : "rgba(255,255,255,0.4)" }}
                        />
                        <span className="flex-1 truncate">{item.name}</span>

                        {active && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: "#c8a84b" }}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── Footer link ────────────────────────────────────── */}
      <div className="shrink-0 px-3 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150"
          style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.8)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)";
          }}
        >
          <Store className="h-3.5 w-3.5 shrink-0" />
          <span>Visit Storefront</span>
          <ExternalLink className="ml-auto h-3 w-3" style={{ color: "#c8a84b" }} />
        </Link>
      </div>
    </aside>
    </>
  );
}