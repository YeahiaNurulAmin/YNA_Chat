import { LoaderIcon } from "lucide-react";
import { APP_NAME, AppLogo } from "./AppLogo";

const PageLoader = () => {
  return (
    <div className="app-shell items-center justify-center">
      <div className="app-shell-backdrop" aria-hidden />
      <div className="relative flex flex-col items-center gap-4">
        <AppLogo size={44} className="rounded-xl ring-1 ring-white/10" />

        <div className="flex items-center gap-2 text-sm font-medium text-[var(--cl-on-surface-variant)]">
          <LoaderIcon className="size-4 animate-spin text-[var(--cl-glow-cyan)]" aria-hidden />
          <span className="brand-title">Loading {APP_NAME}</span>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
