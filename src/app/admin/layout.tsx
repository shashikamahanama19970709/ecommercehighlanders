import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin-header";
import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6 pb-20">
          {children}
        </main>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3 text-xs text-muted-foreground">
          <span>© 2026 Sportify-Ecommerce. All rights reserved.</span>
          <span>Powered by FlexNode</span>
        </div>
      </footer>
    </div>
  );
}
