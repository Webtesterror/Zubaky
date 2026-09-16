import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZUBY | DÁSNĚ — stomatologické centrum v Hradci Králové",
  description: "ZUBY | DÁSNĚ — informace o ordinaci, náš tým, průběh léčby, ceník a kontakt.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className="antialiased">{children}</body>
    </html>
  );
}
