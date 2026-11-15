"use client";

import { useMissionStore } from "@/store/useMissionStore";

export default function LangToggle() {
  const lang = useMissionStore((s) => s.lang);
  const setLang = useMissionStore((s) => s.setLang);

  return (
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
  );
}
