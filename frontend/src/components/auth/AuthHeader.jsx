/**
 * Auth page header with brand mark and appearance controls.
 * Used by the unused split-layout auth composition.
 */

import { APP_NAME, AppLogo } from "../AppLogo";
import { ThemePresetPicker } from "../ThemePresetPicker";
import { ThemeToggle } from "../ThemeToggle";
import { RgbCustomizer } from "../RgbCustomizer";

function AuthHeader() {
  return (
    <header className="glass-header rgb-accent-line sticky top-0 z-10 flex shrink-0 items-center gap-2 rounded-t-[14px] px-3 py-2">
      <div className="flex flex-1 items-center gap-2.5 px-1">
        <AppLogo size={52} className="rounded-[7px] ring-1 ring-white/10" alt="" />

        <div>
          <p className="brand-title truncate text-[15px] font-semibold leading-tight">{APP_NAME}</p>
          <p className="truncate text-xs text-[var(--cl-on-surface-variant)]">Private session</p>
        </div>
      </div>

      <div className="toolbar-cluster shrink-0">
        <RgbCustomizer />

        <ThemePresetPicker />

        <ThemeToggle />
      </div>
    </header>
  );
}
export default AuthHeader;
