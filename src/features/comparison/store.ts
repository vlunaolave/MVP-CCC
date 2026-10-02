import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ComparisonState {
  ids: string[];
  add: (id: string) => "added" | "removed" | "full";
  remove: (id: string) => void;
  clear: () => void;
}

const memory = new Map<string, string>();

const storage = {
  getItem: (name: string) => (typeof window === "undefined" ? (memory.get(name) ?? null) : window.sessionStorage.getItem(name)),
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") {
      memory.set(name, value);
      return;
    }
    window.sessionStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") {
      memory.delete(name);
      return;
    }
    window.sessionStorage.removeItem(name);
  },
};

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      ids: [],
      add: (id) => {
        const current = get().ids;
        if (current.includes(id)) {
          set({ ids: current.filter((item) => item !== id) });
          return "removed";
        }
        if (current.length >= 4) {
          return "full";
        }
        set({ ids: [...current, id] });
        return "added";
      },
      remove: (id) => set({ ids: get().ids.filter((item) => item !== id) }),
      clear: () => set({ ids: [] }),
    }),
    {
      name: "comparador-ids",
      storage: createJSONStorage(() => storage),
    },
  ),
);
