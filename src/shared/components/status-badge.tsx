import { Badge } from "@/components/ui/badge";
import type { EstadoMatricula, Severidad } from "@/shared/types/domain";
import { ESTADO_MATRICULA_LABEL, SEVERIDAD_LABEL } from "@/shared/utils/labels";
import { cn } from "cn";

const enrollmentClass: Record<EstadoMatricula, string> = {
  ACTIVA: "border-transparent bg-success/15 text-success",
  SUSPENDIDA: "border-transparent bg-warning/20 text-amber-950",
  CANCELADA: "border-transparent bg-destructive/10 text-destructive",
  INACTIVA: "border-transparent bg-muted text-muted-foreground",
};

const severityClass: Record<Severidad, string> = {
  INFORMATIVA: "border-transparent bg-slate-100 text-slate-700",
  ATENCION: "border-transparent bg-warning/25 text-amber-950",
  IMPORTANTE: "border-transparent bg-important text-white",
};

export function EnrollmentBadge({ estado }: { estado: EstadoMatricula }) {
  return (
    <Badge variant="outline" className={cn(enrollmentClass[estado])}>
      {ESTADO_MATRICULA_LABEL[estado]}
    </Badge>
  );
}

export function SeverityBadge({ severidad }: { severidad: Severidad }) {
  return (
    <Badge variant="outline" className={cn(severityClass[severidad])}>
      {SEVERIDAD_LABEL[severidad]}
    </Badge>
  );
}
