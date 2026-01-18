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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Profile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const savedProfile = localStorage.getItem("user_profile")
        if (savedProfile) {
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
