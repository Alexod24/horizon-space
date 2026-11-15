"use client";

import { useEffect } from "react";
import { useMissionStore } from "@/store/useMissionStore";

export default function LangToggle() {
  const lang = useMissionStore((s) => s.lang);
  const setLang = useMissionStore((s) => s.setLang);
  const theme = useMissionStore((s) => s.theme);
  const setTheme = useMissionStore((s) => s.setTheme);
  const enteredApp = useMissionStore((s) => s.enteredApp);
  const en = lang === "en";
  const isLight = theme === "light";

  useEffect(() => {
    document.documentElement.dataset.theme = enteredApp ? theme : "dark";
  }, [theme, enteredApp]);

  return (
    <div className="flex items-center gap-2">
      {enteredApp && (
        <button
          type="button"
          onClick={() => setTheme(isLight ? "dark" : "light")}
          title={
            isLight
              ? en
                ? "Switch to Dark Mode"
                : "Cambiar a Modo Oscuro"
              : en
                ? "Switch to Light Mode"
                : "Cambiar a Modo Claro"
          }
          aria-label={en ? "Toggle theme" : "Cambiar tema"}
          className="flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-900/90 px-2.5 py-1 text-[10px] font-semibold text-neutral-200 transition hover:border-neutral-500 hover:text-white"
        >
          <span aria-hidden="true">{isLight ? "🌙" : "☀"}</span>
          <span className="hidden sm:inline">
            {isLight
              ? en
                ? "Dark"
                : "Oscuro"
              : en
                ? "Light"
                : "Claro"}
          </span>
        </button>
      )}

      <div
        role="group"
        aria-label="Language selector"
        className="flex items-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-900/90 text-[10px] font-semibold"
      >
        <button
          type="button"
          onClick={() => setLang("es")}
          className={`px-2 py-1 transition ${
            lang === "es" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
          }`}
        >
          ES
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          className={`px-2 py-1 transition ${
            lang === "en" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
