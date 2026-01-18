"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScheduleItem } from "@/components/schedule-item"
import { supabase, Schedule } from "@/lib/supabase"
import { Loader2, Plus } from "lucide-react"
import { ScheduleDetailDrawer } from "@/components/schedule-detail-drawer"
import { AddScheduleDrawer } from "@/components/add-schedule-drawer"

export default function SchedulePage() {
    const [day, setDay] = useState(1)
    const [optionType, setOptionType] = useState<"A" | "B">("A")
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [loading, setLoading] = useState(true)

    // Detail View State
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

    // 1. Fetch User Location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                },
                (error) => {
                    console.error("Error getting location:", error)
                }
            )
        }
    }, [])

    const router = useRouter()

    // Lift fetchSchedules to be reusable
    async function fetchSchedules() {
        setLoading(true)

        if (!supabase) {
            console.log("Using mock data")
            setSchedules([])
            setLoading(false)
            return
        }

        let query = supabase
            .from('schedules')
            .select('*, profiles(name)')
            .eq('day_number', day)
            .order('start_time', { ascending: true })

        const { data, error } = await query

        if (error) {
            console.error('Error fetching schedules:', error)
        } else {
            const filtered = data.filter(item =>
                item.option_type === null || item.option_type === optionType
            )
            setSchedules(filtered)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSchedules()
    }, [day, optionType])

    const handleItemClick = (schedule: Schedule) => {
        setSelectedSchedule(schedule)
        setIsDrawerOpen(true)
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#F7F3F2] relative overflow-hidden">
            {/* Exact Background Gradient Image from User */}
            <div className="absolute top-0 left-0 right-0 z-0 flex justify-center">
                <img
                    src="/top-gradient.png"
                    alt="Background Gradient"
                    className="w-full max-w-[600px] h-auto object-cover opacity-90"
                />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 pt-10 pb-4 px-6 relative">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-[32px] font-bold tracking-tight text-[#1D1D1F]">
                        여행 일정
                    </h1>
                    <button
                        onClick={() => router.push('/schedule/add')}
                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white active:scale-95 transition-all"
                    >
                        <Plus className="w-6 h-6 text-[#1D1D1F]" />
                    </button>
                </div>

                {/* Day Selector (Tabs Style) */}
                <div className="flex justify-between gap-3 mb-4">
                    {[1, 2, 3].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDay(d)}
                            className={`flex flex-col items-center justify-center flex-1 py-3 rounded-xl transition-all duration-300 border ${day === d
                                ? "date-card-active"
                                : "bg-transparent border-transparent text-gray-400 hover:bg-white/40"
                                }`}
                        >
                            <span className="text-[11px] font-medium mb-0.5">Day</span>
                            <span className={`text-xl font-bold ${day === d ? "text-[#1D1D1F]" : "text-gray-400"}`}>{d}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Schedule List */}
            <main className="flex-1 px-5 py-2 pb-32 relative z-10">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : schedules.length > 0 ? (
                    <div className="space-y-4 px-1">
                        {schedules.map((schedule, index) => (
                            <div key={schedule.id} onClick={() => handleItemClick(schedule)} className="cursor-pointer transition-transform active:scale-[0.98]">
                                <ScheduleItem schedule={schedule} index={index} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-300">
                        <div className="text-4xl mb-4">📅</div>
                        <p className="font-medium">등록된 일정이 없습니다</p>
                    </div>
                )}
            </main>

            {/* Detail Drawer */}
            <ScheduleDetailDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                schedule={selectedSchedule}
                currentLocation={currentLocation}
            />
        </div>
    )
}
