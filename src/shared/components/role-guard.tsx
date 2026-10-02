"use client";

import type { ReactNode } from "react";

import { useUiStore } from "@/shared/lib/ui-store";
import type { PermissionCode } from "@/shared/types/domain";

export function RoleGuard({ permission, children }: { permission: PermissionCode; children: ReactNode }) {
  const user = useUiStore((state) => state.user);
  if (!user?.permisos.includes(permission)) {
    return null;
  }
  return children;
}
