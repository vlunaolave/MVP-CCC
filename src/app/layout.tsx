import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { AppProviders } from "@/shared/components/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inteligencia empresarial",
  description: "Plataforma Integral de Inteligencia Empresarial de la Cámara de Comercio de Cali.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Saltar al contenido
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
