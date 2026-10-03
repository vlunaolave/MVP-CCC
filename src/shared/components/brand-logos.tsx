import { cn } from "cn";

export function CamaraLogo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/camara-comercio-cali.png"
      alt="Cámara de Comercio de Cali"
      width={300}
      height={300}
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
      className={cn("h-auto max-w-full object-contain", className)}
    />
  );
}

export function DevelopedBy({ className, label = "Desarrollado por" }: { className?: string; label?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
      <div className="mt-2 inline-flex max-w-full rounded-md bg-black px-2 py-1.5">
        <IntelectoLogo className="h-7 w-auto" />
      </div>
    </div>
  );
}
