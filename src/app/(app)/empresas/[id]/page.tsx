import type { Metadata } from "next";

import { CompanyProfileScreen } from "@/features/companies";

export const metadata: Metadata = { title: "Perfil empresarial" };

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CompanyProfileScreen companyId={id} />;
}
