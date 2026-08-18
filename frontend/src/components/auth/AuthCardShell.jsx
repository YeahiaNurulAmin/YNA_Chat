/**
 * Glass-named auth card wrapper restyled as a solid Cyber Neon panel.
 * Used by AuthActionPanel.
 */

const cardClassName = "auth-glass-card";

export function AuthCardShell({ children }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-105">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[1.1rem] bg-linear-to-b from-cyan-400/25 via-transparent to-transparent opacity-80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[1.05rem] shadow-[0_0_0_1px_rgba(34,211,238,0.12)_inset]"
        />

        <div className={cardClassName}>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-0 size-56 rounded-full bg-cyan-400/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-400/40 to-transparent"
          />

          <div className="relative px-8 pb-9 pt-10 sm:px-10 sm:pb-10 sm:pt-11">{children}</div>
        </div>
      </div>
    </div>
  );
}
