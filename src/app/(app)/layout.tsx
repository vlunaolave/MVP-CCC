import { redirect } from "next/navigation";

import { getCurrentSession } from "@/server/auth/session";
import { AppShell } from "@/shared/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  return <AppShell user={user}>{children}</AppShell>;
}
