"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface Profile {
    id: string
    name: string
    image_url: string
}

interface AuthContextType {
    user: Profile | null
    login: (profile: Profile) => void
    logout: () => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_VERSION = "v2-refresh" // Change this string to force global logout

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Profile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const savedVersion = localStorage.getItem("auth_version")
        const savedProfile = localStorage.getItem("user_profile")

        // If version doesn't match, or no version exists -> Clear Query
        if (savedVersion !== AUTH_VERSION) {
            localStorage.removeItem("user_profile")
            localStorage.setItem("auth_version", AUTH_VERSION)
            setUser(null)
        } else if (savedProfile) {
            setUser(JSON.parse(savedProfile))
        }
        setIsLoading(false)
    }, [])

    useEffect(() => {
        if (!isLoading) {
            if (!user && pathname !== "/login") {
                router.push("/login")
            }
        }
    }, [user, isLoading, pathname, router])

    const login = (profile: Profile) => {
        localStorage.setItem("user_profile", JSON.stringify(profile))
        localStorage.setItem("auth_version", AUTH_VERSION)
        setUser(profile)
        router.push("/")
    }

    const logout = () => {
        localStorage.removeItem("user_profile")
        setUser(null)
        router.push("/login")
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
