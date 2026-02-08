"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { clsx } from 'clsx';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative p-2 h-9 w-9 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition-all"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
      <Moon className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
    </button>
  );
}
