import type { Metadata } from "next";

import { SectorsScreen } from "@/features/sectors";

export const metadata: Metadata = { title: "Sectores" };

export default function SectoresPage() {
  return <SectorsScreen />;
}
