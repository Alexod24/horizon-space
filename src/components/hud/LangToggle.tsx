"use client";

import { useMissionStore } from "@/store/useMissionStore";

function SpainFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-3 w-4 shrink-0 rounded-[2px]" aria-hidden="true">
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
    </svg>
  );
}

function UsFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-3 w-4 shrink-0 rounded-[2px]" aria-hidden="true">
      <rect width="24" height="16" fill="#B22234" />
      <path d="M0 2.3h24M0 5h24M0 7.7h24M0 10.4h24M0 13.1h24" stroke="#FFFFFF" strokeWidth="1.2" />
      <rect width="10" height="8.6" fill="#3C3B6E" />
    </svg>
  );
}

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
        title="Español"
        className={`flex items-center gap-1 px-2 py-1 transition ${
          lang === "es" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
        }`}
      >
        <SpainFlag />
        <span>ES</span>
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        title="English"
        className={`flex items-center gap-1 px-2 py-1 transition ${
          lang === "en" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
        }`}
      >
        <UsFlag />
        <span>EN</span>
      </button>
    </div>
  );
}
