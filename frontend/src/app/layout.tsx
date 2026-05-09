import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/common/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShareNova — Secure Temporary File & Text Sharing",
  description:
    "Share files and text securely with a 12-digit code. No accounts, no public URLs. End-to-end privacy with automatic expiry.",
  keywords: ["file sharing", "secure sharing", "temporary files", "text sharing", "privacy"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a14] text-white font-[var(--font-inter)]">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
      </body>
    </html>
  );
}
