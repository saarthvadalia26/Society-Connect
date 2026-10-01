import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ToastListener } from "@/components/toast-listener";
import { TopLoadingBar } from "@/components/top-loading-bar";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Society Connect — Your Society, Simplified",
  description: "The centralized hub for residential complexes — finance, communication, and security in one dashboard.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.className}`} suppressHydrationWarning>
      <body>
        <TopLoadingBar />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sc-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){}})()`,
          }}
        />
        {children}
        <Toaster richColors closeButton />
        <ToastListener />
      </body>
    </html>
  );
}
