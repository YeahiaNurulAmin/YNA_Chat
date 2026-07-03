export const RGB_THEME_PRESETS = [
  {
    id: "rainbow-flow",
    label: "Rainbow Flow",
    gradient: "conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b0082, #ff0000)",
    swatch: "linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #0000ff)"
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    gradient: "conic-gradient(from 0deg, #ff007f, #7f00ff, #00ffff, #7f00ff, #ff007f)",
    swatch: "linear-gradient(45deg, #ff007f, #7f00ff, #00ffff)"
  },
  {
    id: "aurora",
    label: "Cosmic Aurora",
    gradient: "conic-gradient(from 0deg, #00ff87, #60efff, #0061ff, #7a00ff, #00ff87)",
    swatch: "linear-gradient(45deg, #00ff87, #0061ff, #7a00ff)"
  },
  {
    id: "fire",
    label: "Volcanic Fire",
    gradient: "conic-gradient(from 0deg, #ff4e50, #f9d423, #ff4e50)",
    swatch: "linear-gradient(45deg, #ff4e50, #f9d423)"
  },
  {
    id: "matrix",
    label: "Matrix Neon",
    gradient: "conic-gradient(from 0deg, #00ff00, #003300, #00ff00)",
    swatch: "linear-gradient(45deg, #00ff00, #003300)"
  },
  {
    id: "violet",
    label: "Electric Violet",
    gradient: "conic-gradient(from 0deg, #9d4edd, #c77dff, #e0aaff, #9d4edd)",
    swatch: "linear-gradient(45deg, #9d4edd, #c77dff, #e0aaff)"
  }
];

export const RGB_SPEEDS = [
  { id: "slow", label: "Slow", duration: "12s" },
  { id: "medium", label: "Medium", duration: "6s" },
  { id: "fast", label: "Fast", duration: "3s" }
];

export const RGB_INTENSITIES = [
  { id: "off", label: "Off", blur: "0px", opacity: "0" },
  { id: "low", label: "Low", blur: "16px", opacity: "0.3" },
  { id: "medium", label: "Medium", blur: "24px", opacity: "0.55" },
  { id: "high", label: "High", blur: "36px", opacity: "0.85" }
];

export function getRgbPresetById(id) {
  return RGB_THEME_PRESETS.find((p) => p.id === id) ?? RGB_THEME_PRESETS[0];
}

export function getRgbSpeedById(id) {
  return RGB_SPEEDS.find((s) => s.id === id) ?? RGB_SPEEDS[1];
}

export function getRgbIntensityById(id) {
  return RGB_INTENSITIES.find((i) => i.id === id) ?? RGB_INTENSITIES[2];
}
