import { cn } from "@/lib/utils";

export function Logo() {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-2 select-none pointer-events-none">
      <h1
        className={cn(
          "font-montserrat text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl uppercase font-light",
          "bg-linear-to-r from-[#07f49e] to-[#0380b6] bg-size-[200%_200%] bg-clip-text text-transparent animate-gradient"
        )}
      >
        HM
      </h1>
      <span className="text-xs text-muted-foreground">
        Sistema de control de expedientes
      </span>
    </div>
  );
}
