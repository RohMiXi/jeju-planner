"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Map, MessageCircle, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const pathname = usePathname()

    // Hide on profile selection screen or chat screen or login screen
    if (pathname === "/" || pathname === "/chat" || pathname === "/login") return null

    const links = [
        { href: "/schedule", label: "일정", icon: Calendar },
        { href: "/map", label: "지도", icon: Map },
        { href: "/places", label: "추천장소", icon: MapPin },
        { href: "/chat", label: "메시지", icon: MessageCircle },
    ]

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white/90 backdrop-blur-md border-t border-gray-100 pb-safe">
            <div className="flex justify-between items-center px-4 h-16">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href || (pathname === "/" && link.href === "/schedule")

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200",
                                isActive
                                    ? "text-primary"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Icon className={cn("w-6 h-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{link.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
