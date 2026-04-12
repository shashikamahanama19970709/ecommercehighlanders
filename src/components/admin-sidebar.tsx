"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Store, Tag, Trophy, Wrench } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Sports", href: "/admin/sports", icon: Trophy },
  { name: "Equipment", href: "/admin/equipment", icon: Wrench },
  { name: "Brands", href: "/admin/brands", icon: Tag },
  { name: "Products", href: "/admin/products", icon: Package },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-background shadow-lg">
      <div className="flex h-16 shrink-0 items-center justify-center border-b px-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Sportify</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`cursor-pointer group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}