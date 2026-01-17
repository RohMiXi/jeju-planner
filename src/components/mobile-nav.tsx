
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Map, MessageCircle, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const pathname = usePathname()

    const links = [
        { href: "/schedule", label: "일정", icon: Calendar },
        { href: "/map", label: "지도", icon: Map },
        { href: "/places", label: "추천장소", icon: MapPin },
        { href: "/chat", label: "메시지", icon: MessageCircle },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href || (pathname === "/" && link.href === "/schedule")

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs font-medium transition-colors",
                                isActive
                                    ? "text-[#0077B6]"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="w-6 h-6" />
                            <span>{link.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
