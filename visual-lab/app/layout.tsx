import type { Metadata } from "next";
import "@fontsource-variable/anybody";
import "@fontsource-variable/familjen-grotesk";
import "@fontsource-variable/spline-sans-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jagerlaramais — Visual Lab",
  description: "Laboratório de direção visual para o universo de Jagerlaramais.",
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
