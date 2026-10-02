import type { Metadata } from "next";

import { ListsScreen } from "@/features/lists";

export const metadata: Metadata = { title: "Listas" };

export default function ListasPage() {
  return <ListsScreen />;
}
