/**
 * Auth action column with Clerk continue button.
 * Used by the unused split-layout auth composition.
 */

import { useClerk } from "@clerk/react";
import { Button } from "@heroui/react";
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { AppLogo } from "../AppLogo";
import { AuthCardShell } from "./AuthCardShell";

const AFTER_AUTH = "/";

const logoTileClassName = [
  "relative rounded-lg p-2",
  "bg-[var(--cl-glass)] ring-1 ring-cyan-400/20",
  "shadow-[0_0_18px_-6px] shadow-cyan-400/30",
].join(" ");

const continueButtonClassName = [
  "group relative h-13 overflow-hidden rounded-md text-[15px] font-semibold",
  "bg-linear-to-r from-cyan-400 to-violet-500 text-[#04040a]",
  "shadow-[0_0_18px_-4px_rgba(34,211,238,0.45)]",
].join(" ");

export function AuthActionPanel() {
  const clerk = useClerk();

  return (
    <section className="relative flex flex-1 flex-col items-stretch justify-center overflow-hidden px-5 py-12 sm:px-10 md:px-14 md:py-10 lg:px-16">
      <AuthCardShell>
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div
              aria-hidden
              className="absolute -inset-3.5 rounded-[16px] bg-linear-to-br from-cyan-400/20 via-violet-500/8 to-transparent opacity-90 blur-xl"
            />
            <div className={logoTileClassName}>
              <AppLogo size={52} className="rounded-xl" alt="" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-accent">
            <SparklesIcon className="size-3.5" strokeWidth={2} aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
              Secure entry
            </span>
          </div>
        </div>

        {
          <Button
            fullWidth
            size="lg"
            variant="primary"
            className={continueButtonClassName}
            onPress={() => {
              clerk.openSignIn({ fallbackRedirectUrl: AFTER_AUTH, forceRedirectUrl: AFTER_AUTH });
            }}
          >
            <span className="relative z-1 flex items-center justify-center gap-2">
              Continue
              <ArrowRightIcon
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Button>
        }

        <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/6 pt-6 text-[11px] text-[var(--cl-on-surface-variant)]">
          <ShieldCheckIcon
            className="size-3.5 shrink-0 text-success"
            strokeWidth={2}
            aria-hidden
          />
          <span>Protected session · TLS encryption</span>
        </div>
      </AuthCardShell>
    </section>
  );
}
