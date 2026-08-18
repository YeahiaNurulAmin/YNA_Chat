/**
 * Light/dark theme toggle for HeroUI tokens.
 * Used in SidebarSettingsMenu, ChatHeaderMenu, AuthHeader, and AuthPage.
 */

import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5">
      <Button
        size="sm"
        variant="ghost"
        isIconOnly
        aria-pressed={theme === "light"}
        className={`cyber-header-icon ${theme === "light" ? "text-[var(--cl-glow-cyan)]" : "text-[var(--cl-on-surface-variant)]"}`}
        onPress={() => setTheme("light")}
      >
        <Sun className="size-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        isIconOnly
        aria-pressed={theme === "dark"}
        className={`cyber-header-icon ${theme === "dark" ? "text-[var(--cl-glow-cyan)]" : "text-[var(--cl-on-surface-variant)]"}`}
        onPress={() => setTheme("dark")}
      >
        <Moon className="size-4" />
      </Button>
    </div>
  );
}
