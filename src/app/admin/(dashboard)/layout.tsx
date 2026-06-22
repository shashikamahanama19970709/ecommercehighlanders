import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminHeader } from "@/components/admin-header";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f0f4f8" }}>
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader session={session} />
        <main className="flex-1 overflow-y-auto p-6 pb-16" style={{ scrollbarWidth: "thin", scrollbarColor: "#c8d4e4 transparent" }}>
          {children}
        </main>
      </div>

      {/* Admin footer bar */}
      <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dde4ee] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex items-center justify-between px-6 py-2.5 text-[11px] text-[#94a3b8]">
          <span>© {new Date().getFullYear()} Highlanders Sports &amp; Fitness. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Powered by{" "}
            <a href="https://flexnodelive.site/" className="font-medium text-[#c8a84b] hover:text-[#9a6e08] transition-colors" target="_blank" rel="noopener noreferrer">
              FlexNode
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
