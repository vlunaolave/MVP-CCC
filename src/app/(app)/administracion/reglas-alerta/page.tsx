import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AlertRulesScreen } from "@/features/administration/components/alert-rules-screen";
import { getCurrentSession } from "@/server/auth/session";
import { hasPermission } from "@/shared/lib/permissions";

export const metadata: Metadata = { title: "Reglas de alerta · Inteligencia empresarial" };

export default async function AlertRulesPage() {
  const user = await getCurrentSession();
  if (!user) redirect("/login");
  if (!hasPermission(user.rol, "admin.configuracion")) redirect("/acceso-denegado");
  return <AlertRulesScreen />;
}
