import { create } from "zustand";

import type { SessionUser } from "@/shared/types/domain";

interface UiState {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
