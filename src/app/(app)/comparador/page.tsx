import type { Metadata } from "next";

import { ComparadorScreen } from "@/features/comparison";

export const metadata: Metadata = { title: "Comparador" };

export default function ComparadorPage() {
  return <ComparadorScreen />;
}
