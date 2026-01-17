import type { Metadata } from "next";
import "./globals.css";
import { MobileNav } from "@/components/mobile-nav";

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
            <head>
                <link rel="stylesheet" as="style" crossOrigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
            </head>
            <body className="font-sans antialiased bg-[#F7F3F2] text-[#1D1D1F]">
                <main className="max-w-md mx-auto min-h-screen bg-[#F7F3F2] shadow-xl relative pb-20">
                    {children}
                    <MobileNav />
                </main>
            </body>
        </html>
    );
}
