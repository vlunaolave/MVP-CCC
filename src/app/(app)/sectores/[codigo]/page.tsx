import type { Metadata } from "next";

import { SectorDetailScreen } from "@/features/sectors";

export const metadata: Metadata = { title: "Sector" };

export default async function SectorPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  return <SectorDetailScreen codigo={codigo} />;
}
