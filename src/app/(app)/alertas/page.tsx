import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AlertsScreen } from "@/features/alerts";
import { getCurrentSession } from "@/server/auth/session";
import { hasPermission } from "@/shared/lib/permissions";
import { LoadingBlock } from "@/shared/components/screen-states";

export const metadata: Metadata = { title: "Alertas · Inteligencia empresarial" };

export default async function AlertsPage() {
  const user = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user.rol, "alertas.ver")) {
    redirect("/acceso-denegado");
  }
  return (
    <Suspense fallback={<LoadingBlock />}>
      <AlertsScreen />
    </Suspense>
  );
}
