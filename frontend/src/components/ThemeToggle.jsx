import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5">
      <Button
        size="sm"
        variant={theme === "light" ? "primary" : "ghost"}
        isIconOnly
        onPress={() => setTheme("light")}
      >
        <Sun className="size-4" />
      </Button>
      <Button
        size="sm"
        variant={theme === "dark" ? "primary" : "ghost"}
        isIconOnly
        onPress={() => setTheme("dark")}
      >
        <Moon className="size-4" />
      </Button>
    </div>
  );
}
