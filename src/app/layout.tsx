import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horizon Space — Navigator de Sitios de Aterrizaje Lunar",
  description: "Simulador táctico de iluminación y comunicaciones en el Polo Sur Lunar",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.jpg", apple: "/icon.jpg" },
};

export const viewport: Viewport = { themeColor: "#0f0f0f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="h-dvh overflow-hidden bg-[#0f0f0f] text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
