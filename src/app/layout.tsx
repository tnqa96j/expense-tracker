import type { Metadata, Viewport } from "next";
import AppProviders from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "日日記帳｜個人收支簿",
  description: "簡單記下收入與支出，讓日常花費一目了然。",
};

export const viewport: Viewport = {
  themeColor: "#f5f7f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
