import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <AdminLayoutWrapper session={session}>
      {children}
    </AdminLayoutWrapper>
  );
}
