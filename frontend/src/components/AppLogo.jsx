export const APP_NAME = "YNA Chat";

export function AppLogo({ className = "", size = 32, alt = APP_NAME }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      role={alt ? "img" : "presentation"}
      aria-label={alt || undefined}
    >
      <defs>
        <linearGradient id="yna-app-border-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#00f2fe" />
          <stop offset="35%" stop-color="#38bdf8" />
          <stop offset="70%" stop-color="#a855f7" />
          <stop offset="100%" stop-color="#ff007a" />
        </linearGradient>
        <linearGradient id="yna-app-body-grad" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0e1329" />
          <stop offset="100%" stop-color="#050711" />
        </linearGradient>
        <linearGradient id="yna-app-stem-grad" x1="50" y1="46" x2="50" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="40%" stop-color="#c084fc" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
        <filter id="yna-app-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="yna-app-aura" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
        </filter>
      </defs>

      {/* Ambient Glow Aura */}
      <path
        d="M50 10 C27.9 10 10 27.9 10 50 C10 60.5 14.1 70.1 20.8 77.2 L15.5 90 L29.2 86.8 C35.4 89.4 42.5 90 50 90 C72.1 90 90 72.1 90 50 C90 27.9 72.1 10 50 10 Z"
        fill="url(#yna-app-border-grad)"
        opacity="0.35"
        filter="url(#yna-app-aura)"
      />

      {/* Main Chat Bubble Body */}
      <path
        d="M50 10 C27.9 10 10 27.9 10 50 C10 60.5 14.1 70.1 20.8 77.2 L15.5 90 L29.2 86.8 C35.4 89.4 42.5 90 50 90 C72.1 90 90 72.1 90 50 C90 27.9 72.1 10 50 10 Z"
        fill="url(#yna-app-body-grad)"
        stroke="url(#yna-app-border-grad)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Top Specular Arc */}
      <path
        d="M25 24 C32 17 40 14 50 14 C60 14 68 17 75 24"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Glowing Neural Y Monogram */}
      <g filter="url(#yna-app-glow)">
        {/* Left Cyber Branch (Neon Cyan) */}
        <path d="M31 30 L50 49" stroke="#00f2fe" strokeWidth="6.5" strokeLinecap="round" />
        {/* Right Cyber Branch (Neon Magenta) */}
        <path d="M69 30 L50 49" stroke="#ff007a" strokeWidth="6.5" strokeLinecap="round" />
        {/* Center Stem (Violet/White Gradient) */}
        <path d="M50 49 V73" stroke="url(#yna-app-stem-grad)" strokeWidth="6.5" strokeLinecap="round" />

        {/* Lateral Cyber Signal Waves */}
        <path d="M22 47 C22 43 24 39 27 36" stroke="#00f2fe" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
        <path d="M78 47 C78 43 76 39 73 36" stroke="#ff007a" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />

        {/* Pulse Data Nodes */}
        <circle cx="31" cy="30" r="4" fill="#00f2fe" />
        <circle cx="69" cy="30" r="4" fill="#ff007a" />
        <circle cx="50" cy="49" r="4.8" fill="#ffffff" />
        <circle cx="50" cy="73" r="3.8" fill="#a855f7" />
      </g>
    </svg>
  );
}

