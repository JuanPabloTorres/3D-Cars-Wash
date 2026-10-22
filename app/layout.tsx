import type { Metadata } from "next";
import "./febles.css";

export const metadata: Metadata = {
  title: "Febles · Tu car wash, de otra manera",
  description: "Entra al car wash virtual de Febles en Ponce. Explora y prepara tu visita.",
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
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
