
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as a standard font
import "./globals.css";
import { MobileNav } from "@/components/mobile-nav";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jeju Travel Hub",
  description: "Share your Jeju itinerary with friends",
  referrer: 'origin-when-cross-origin',
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={cn(inter.className, "bg-gray-50 min-h-screen text-gray-900 antialiased pb-20")}>
        <main className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative">
          {children}
          <MobileNav />
        </main>
      </body>
    </html>
  );
}
