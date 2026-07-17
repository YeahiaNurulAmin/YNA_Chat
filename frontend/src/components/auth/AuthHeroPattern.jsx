const gridStyle = (color) => ({
  backgroundImage: [
    `linear-gradient(${color} 1px, transparent 1px)`,
    `linear-gradient(90deg, ${color} 1px, transparent 1px)`,
  ].join(","),
  backgroundSize: "24px 24px",
});

const darkGridMask =
  "radial-gradient(ellipse 68% 58% at 50% 48%, #000 8%, #000 42%, transparent 78%)";

export function AuthHeroPattern() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_40%,color-mix(in_oklch,var(--accent)_22%,transparent),transparent_62%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-background via-transparent to-background opacity-80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/60 via-transparent to-background/95"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
        style={gridStyle("color-mix(in oklch, var(--foreground) 8%, transparent)")}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 hidden dark:block"
        style={{
          ...gridStyle("rgba(255,255,255,0.05)"),
          WebkitMaskImage: darkGridMask,
          maskImage: darkGridMask,
        }}
      />
    </>
  );
}
