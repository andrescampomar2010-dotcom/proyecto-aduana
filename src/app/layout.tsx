import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AduanaSaaS — Plataforma Aduanera",
  description: "Gestión integral de procesos aduaneros con IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full`}>
      <body className="min-h-full antialiased font-sans bg-[#080b12] text-white">{children}</body>
    </html>
  );
}
