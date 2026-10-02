import type { Metadata } from "next";

import { DashboardScreen } from "@/features/dashboard";

export const metadata: Metadata = { title: "Dashboard · Inteligencia empresarial" };

export default function DashboardPage() {
  return <DashboardScreen />;
}
