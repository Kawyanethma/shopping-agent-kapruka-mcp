"use client";

import { useEffect, useState } from "react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        Theme
      </Button>
    );
  }

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant='ghost'
      size='icon-lg'
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="gap-2"
    >
      {isDark ? <SunMedium className="size-5" /> : <Moon className="size-4" />}
    </Button>
  );
}
