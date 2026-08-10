import type { Metadata } from "next";
import "@fontsource-variable/anybody";
import "@fontsource-variable/familjen-grotesk";
import "@fontsource-variable/spline-sans-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jagerlaramais — Visual Guide",
  description: "Guia vivo de universo, personagens, cartas, miniaturas e direção visual de Jagerlaramais.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
