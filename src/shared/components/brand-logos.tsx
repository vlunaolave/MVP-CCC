import { cn } from "cn";

export function CamaraLogo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/camara-comercio-cali.png"
      alt="Cámara de Comercio de Cali"
      width={414}
      height={189}
      className={cn("h-auto max-w-full object-contain", className)}
    />
  );
}

export function IntelectoLogo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/intelecto.png"
      alt="Intelecto"
      width={1400}
      height={542}
      className={cn("h-14 w-auto max-w-full object-contain", className)}
    />
  );
}

export function DevelopedBy({ className, label = "Desarrollado por" }: { className?: string; label?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
      <IntelectoLogo className="mt-2 h-14 w-auto" />
    </div>
  );
}
