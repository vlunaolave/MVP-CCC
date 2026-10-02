"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { makeQueryClient } from "@/shared/lib/query-client";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
