import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MonitoringScreen } from "@/features/monitoring";
import { getCurrentSession } from "@/server/auth/session";
import { hasPermission } from "@/shared/lib/permissions";

export const metadata: Metadata = { title: "Monitoreo · Inteligencia empresarial" };

export default async function MonitoringPage() {
  const user = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.rol, "monitoreo.ver")) {
    redirect("/acceso-denegado");
  }
  return <MonitoringScreen />;
}
