import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horizon Space — Navigator de Sitios de Aterrizaje Lunar",
  description: "Simulador táctico de iluminación y comunicaciones en el Polo Sur Lunar",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#050a12" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="h-dvh overflow-hidden bg-[#050a12] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
