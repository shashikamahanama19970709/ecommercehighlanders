import { LogoLoader } from "@/components/logo-loader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-md transition-all duration-300">
      <div className="space-y-4 text-center">
        <LogoLoader size="lg" />
        <div className="space-y-1">
          <p className="text-sm font-bold tracking-widest uppercase text-[#0f1a2e] animate-pulse">
            Highlanders
          </p>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8a84b]">
            Sports &amp; Fitness
          </p>
        </div>
      </div>
    </div>
  );
}
