import { createContext, useContext, useEffect, useState } from "react";
import { getRgbPresetById, getRgbSpeedById, getRgbIntensityById } from "../data/rgbPresets";

const RgbContext = createContext(null);

const STORAGE_KEYS = {
  THEME: "rgb-theme-id",
  SPEED: "rgb-speed-id",
  INTENSITY: "rgb-intensity-id"
};

export function RgbProvider({ children }) {
  const [rgbTheme, setRgbThemeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) ?? "rainbow-flow";
  });
  const [speed, setSpeedState] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SPEED) ?? "medium";
  });
  const [glowIntensity, setGlowIntensityState] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.INTENSITY) ?? "medium";
  });

  const [isAlerting, setIsAlerting] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, rgbTheme);
  }, [rgbTheme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPEED, speed);
  }, [speed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INTENSITY, glowIntensity);
  }, [glowIntensity]);

  const preset = getRgbPresetById(rgbTheme);
  const speedObj = getRgbSpeedById(speed);
  const intensityObj = getRgbIntensityById(glowIntensity);

  // Compute CSS custom properties styles
  // If alerting is true, override speed to fast, intensity to high, and color to a flashing red/amber alert conic gradient
  const alertGradient = "conic-gradient(from 0deg, #ff0000, #ff5500, #ff0000, #ff5500, #ff0000)";
  const alertDuration = "1.2s";
  const alertBlur = "32px";
  const alertOpacity = "0.9";

  const rgbStyle = {
    "--rgb-gradient": isAlerting ? alertGradient : preset.gradient,
    "--rgb-duration": isAlerting ? alertDuration : speedObj.duration,
    "--rgb-glow-blur": isAlerting ? alertBlur : intensityObj.blur,
    "--rgb-glow-opacity": isAlerting ? alertOpacity : intensityObj.opacity,
  };

  const showGlow = isAlerting || glowIntensity !== "off";

  const triggerAlert = () => {
    setIsAlerting(true);
  };

  const clearAlert = () => {
    setIsAlerting(false);
  };

  const setRgbTheme = (id) => setRgbThemeState(id);
  const setSpeed = (id) => setSpeedState(id);
  const setGlowIntensity = (id) => setGlowIntensityState(id);

  const value = {
    rgbTheme,
    setRgbTheme,
    speed,
    setSpeed,
    glowIntensity,
    setGlowIntensity,
    isAlerting,
    triggerAlert,
    clearAlert,
    rgbStyle,
    showGlow
  };

  return <RgbContext.Provider value={value}>{children}</RgbContext.Provider>;
}

export function useRgb() {
  const ctx = useContext(RgbContext);
  if (!ctx) {
    throw new Error("useRgb must be used within RgbProvider");
  }
  return ctx;
}
