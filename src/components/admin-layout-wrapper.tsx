"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import type { Session } from "next-auth";

export function AdminLayoutWrapper({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f0f4f8" }}>
      {/* Admin Sidebar with toggle capabilities */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Admin Header with menu button toggle */}
        <AdminHeader session={session} onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Main Content Area */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 pb-16"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#c8d4e4 transparent" }}
        >
          {children}
        </main>
      </div>

      {/* Admin footer bar */}
      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dde4ee] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 text-[11px] text-[#94a3b8]">
          <span>© {new Date().getFullYear()} Highlanders Sports &amp; Fitness. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Powered by{" "}
            <a
              href="https://flexnodelive.site/"
              className="font-medium text-[#c8a84b] hover:text-[#9a6e08] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              FlexNode
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
