import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ToastListener } from "@/components/toast-listener";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Society Connect — Your Society, Simplified",
  description: "The centralized hub for residential complexes — finance, communication, and security in one dashboard.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.className}`}>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.add('dark');localStorage.removeItem('sc-theme');}catch(e){}})()`,
          }}
        />
        {children}
        <Toaster theme="dark" />
        <ToastListener />
      </body>
    </html>
  );
}
