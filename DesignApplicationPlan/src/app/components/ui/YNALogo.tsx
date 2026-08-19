import { motion } from "motion/react";

export function YNALogo({ className = "w-12 h-12", glowColor = "#22d3ee" }: { className?: string, glowColor?: string }) {
  return (
    <div className={`relative ${className} group`}>
      {/* Outer Glow Layer */}
      <div 
        className="absolute inset-0 blur-md opacity-40 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
        style={{ backgroundColor: glowColor }}
      />
      
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
      >
        {/* Outer Hexagon Frame */}
        <motion.path
          d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 L50 5Z"
          stroke={glowColor}
          strokeWidth="2"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Neural Connectors / Circuit Lines */}
        <motion.path
          d="M30 35 L45 50 L30 65"
          stroke={glowColor}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M70 35 L55 50 L70 65"
          stroke={glowColor}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />

        {/* Central 'Y' Monogram with Cyber Slab styling */}
        <motion.path
          d="M35 25 L50 48 L65 25 M50 48 V75"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="square"
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />

        {/* Data Nodes */}
        <circle cx="50" cy="48" r="3" fill={glowColor} />
        <circle cx="35" cy="25" r="2" fill="white" />
        <circle cx="65" cy="25" r="2" fill="white" />
        <circle cx="50" cy="75" r="2" fill="white" />
      </svg>

      {/* Decorative scanline effect across logo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        <motion.div 
          className="w-full h-[2px] bg-white/20"
          animate={{ y: [0, 100] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
}
