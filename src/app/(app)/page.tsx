import type { Metadata } from "next";

import { HomeScreen } from "@/features/home";

export const metadata: Metadata = { title: "Inicio · Inteligencia empresarial" };

export default function HomePage() {
  return <HomeScreen />;
}
