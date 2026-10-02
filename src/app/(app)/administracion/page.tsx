import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdministrationScreen } from "@/features/administration";
import { getCurrentSession } from "@/server/auth/session";
import { hasPermission } from "@/shared/lib/permissions";

export const metadata: Metadata = { title: "Administración · Inteligencia empresarial" };

export default async function AdministrationPage() {
  const user = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.rol, "admin.usuarios")) {
    redirect("/acceso-denegado");
  }
  return <AdministrationScreen />;
}
