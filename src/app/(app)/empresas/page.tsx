import type { Metadata } from "next";
import { Suspense } from "react";

import { CompaniesScreen } from "@/features/companies";
import { LoadingBlock } from "@/shared/components/screen-states";

export const metadata: Metadata = { title: "Empresas · Inteligencia empresarial" };

export default function CompaniesPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <CompaniesScreen />
    </Suspense>
  );
}
