"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { Delete, ChevronLeft, Loader2, KeyRound } from "lucide-react"

interface Profile {
    id: string
    name: string
    image_url: string
    password?: string
}

export default function LoginPage() {
    const { login } = useAuth()
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
    const [step, setStep] = useState<"SELECT" | "PASSWORD">("SELECT")
    const [passwordInput, setPasswordInput] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function fetchProfiles() {
            if (!supabase) {
                setLoading(false)
                return
            }
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('name')

            if (data) {
                setProfiles(data)
            }
            setLoading(false)
        }
        fetchProfiles()
    }, [])

    const handleProfileClick = (profile: Profile) => {
        setSelectedProfile(profile)
        setStep("PASSWORD")
        setPasswordInput("")
        setError("")
    }

    const handlePasswordSubmit = () => {
        if (!selectedProfile) return

        // Check password (simple check against DB value or default 0000)
        // In real app, verify on server or hash. Here we compare plain text as per user request context.
        const correctPassword = selectedProfile.password || "0000"

        if (passwordInput === correctPassword) {
            login(selectedProfile)
        } else {
            setError("비밀번호가 일치하지 않습니다")
            setPasswordInput("")
        }
    }

    const handleNumberClick = (num: number) => {
        if (passwordInput.length < 4) {
            const newVal = passwordInput + num.toString()
            setPasswordInput(newVal)

            // Auto submit on 4th digit
            if (newVal.length === 4) {
                // Slightly delay to allow UI update
                setTimeout(() => {
                    // Check logic again here because state might not update instantly in this closure if we used simple variable
                    // Actually calling a separate function with the value is better
                    submitPasswordDirectly(newVal)
                }, 100)
            }
        }
    }

    const submitPasswordDirectly = (input: string) => {
        if (!selectedProfile) return
        const correctPassword = selectedProfile.password || "0000"
        if (input === correctPassword) {
            login(selectedProfile)
        } else {
            setError("비밀번호가 일치하지 않습니다")
            setPasswordInput("")
        }
    }

    const handleDelete = () => {
        setPasswordInput(prev => prev.slice(0, -1))
        setError("")
    }

    if (loading) {
        return <div className="min-h-screen bg-[#F7F3F2] flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
        </div>
    }

    // Step 1: Select Profile
    if (step === "SELECT") {
        return (
            <div className="h-[100dvh] bg-[#F7F3F2] flex flex-col items-center justify-end p-6 relative overflow-hidden pb-12">
                {/* Top Island Background */}
                <div className="absolute top-0 left-0 right-0 h-[60vh] z-0 pointer-events-none">
                    <Image
                        src="/login-bg-island_v2.png"
                        alt="Island Background"
                        fill
                        className="object-cover object-top"
                        priority
                    />
                </div>

                {/* Orange Circular Background */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[420px] aspect-square z-0 pointer-events-none">
                    <Image
                        src="/profiles/selection_bg_v2.png"
                        alt="Background Pattern"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                <div className="text-center mb-10 relative z-10">
                    <h1 className="text-[24px] font-bold text-[#1D1D1F] leading-tight whitespace-pre-line">
                        채팅에 참여할{"\n"}
                        프로필을 선택하세요
                    </h1>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                    {profiles.map((profile) => (
                        <button
                            key={profile.id}
                            onClick={() => handleProfileClick(profile)}
                            className="bg-white rounded-[24px] py-2 flex flex-col items-center justify-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 ring-4 ring-transparent hover:ring-[#FF8D28]/20 transition-all">
                                <Image
                                    src={profile.image_url}
                                    alt={profile.name}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                />
                            </div>
                            <span className="text-[17px] font-bold text-[#1D1D1F]">
                                {profile.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // Step 2: Password
    return (
        <div className="min-h-screen bg-[#F7F3F2] flex flex-col relative overflow-hidden">
            {/* Back Button */}
            <div className="absolute top-6 left-6 z-20">
                <button onClick={() => setStep("SELECT")} className="p-2 -ml-2 text-gray-500 hover:text-gray-800">
                    <ChevronLeft className="w-8 h-8" />
                </button>
            </div>

            {/* Main Content Area (Top Half) */}
            <div className="flex-1 flex flex-col items-center justify-end relative z-10 w-full pb-6">

                {/* Orange Circular Background */}
                <div className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[600px] z-0 pointer-events-none">
                    <Image
                        src="/profiles/selection_bg_v2.png"
                        alt="Background Pattern"
                        fill
                        className="object-contain opacity-90 scale-y-[-1]"
                        priority
                    />
                </div>

                <div className="relative z-10 flex flex-col items-center w-full px-6">
                    <h1 className="text-2xl font-bold mb-2 text-[#1D1D1F]">비밀번호를 입력하세요</h1>
                    <p className="text-gray-400 text-sm mb-8">전화번호 뒤 네자리를 입력하세요</p>

                    {/* Selected Profile Preview */}
                    <div className="bg-white rounded-[32px] p-6 mb-8 shadow-sm flex flex-col items-center w-[160px] aspect-[4/5] justify-center gap-4">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-50">
                            <Image
                                src={selectedProfile?.image_url || ""}
                                alt="Profile"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="font-bold text-lg text-[#1D1D1F]">{selectedProfile?.name}</span>
                    </div>

                    {/* Password Dots (Input Boxes) */}
                    <div className="flex gap-3 mb-4 justify-center">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center transition-all duration-200
                                    ${passwordInput.length > i
                                        ? "ring-2 ring-[#FF8D28]" // Active/Filled state
                                        : ""}`}
                            >
                                {passwordInput.length > i && (
                                    <div className="w-4 h-4 rounded-full bg-[#1D1D1F]" />
                                )}
                            </div>
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-sm font-medium mt-4 h-5 animate-pulse">{error}</p>}
                </div>
            </div>

            {/* Keypad Area (Bottom, White Background) */}
            <div className="bg-white w-full px-8 pb-12 pt-8 rounded-t-[32px] shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
                <div className="grid grid-cols-3 gap-x-4 gap-y-6 w-full max-w-xs mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="text-[28px] font-medium text-[#1D1D1F] hover:bg-gray-50 w-full h-16 rounded-2xl transition-colors flex items-center justify-center active:scale-95"
                        >
                            {num}
                        </button>
                    ))}
                    <div /> {/* Empty slot */}
                    <button
                        onClick={() => handleNumberClick(0)}
                        className="text-[28px] font-medium text-[#1D1D1F] hover:bg-gray-50 w-full h-16 rounded-2xl transition-colors flex items-center justify-center active:scale-95"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center justify-center w-full h-16 text-[#1D1D1F] hover:bg-gray-50 rounded-2xl transition-colors active:scale-95"
                    >
                        <Delete className="w-7 h-7" />
                    </button>
                </div>
            </div>
        </div>
    )
}
