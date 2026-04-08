import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/admin/AdminLayout";

export const metadata: Metadata = {
  title: "Panel de Gestión | RESETSYSTEM",
  description: "Administra tu salón con facilidad.",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
