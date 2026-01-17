
"use client"

import { useState, useEffect } from "react"
import NaverMap from "@/components/naver-map"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase, Schedule } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function MapPage() {
    const [day, setDay] = useState(1)
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchSchedules() {
            setLoading(true)

            if (!supabase) {
                setSchedules([])
                setLoading(false)
                return
            }

            // Default to Option A for map view simply
            let query = supabase
                .from('schedules')
                .select('*')
                .eq('day_number', day)
                .order('start_time', { ascending: true })

            const { data, error } = await query

            if (error) {
                console.error('Error fetching schedules:', error)
            } else {
                // Filter for A option by default for visualization
                const filtered = data.filter(item =>
                    (item.option_type === null || item.option_type === 'A') &&
                    item.lat && item.lng // Only items with coordinates
                )
                setSchedules(filtered)
            }
            setLoading(false)
        }

        fetchSchedules()
    }, [day])

    // Calculate center (average of points) or default
    const center = schedules.length > 0
        ? {
            lat: schedules.reduce((acc, cur) => acc + (cur.lat || 0), 0) / schedules.length,
            lng: schedules.reduce((acc, cur) => acc + (cur.lng || 0), 0) / schedules.length
        }
        : { lat: 33.3846, lng: 126.5535 }

    const markers = schedules.map(s => ({
        lat: s.lat!,
        lng: s.lng!,
        label: s.location
    }))

    const path = schedules.map(s => ({
        lat: s.lat!,
        lng: s.lng!
    }))

    return (
        <div className="flex flex-col h-screen pb-16">
            <header className="absolute top-0 left-0 right-0 z-10 p-4">
                <div className="bg-white/90 backdrop-blur rounded-full shadow-lg p-1">
                    <Tabs defaultValue="1" value={day.toString()} onValueChange={(v) => setDay(parseInt(v))} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-9">
                            <TabsTrigger value="1" className="text-xs">Day 1</TabsTrigger>
                            <TabsTrigger value="2" className="text-xs">Day 2</TabsTrigger>
                            <TabsTrigger value="3" className="text-xs">Day 3</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </header>

            <div className="flex-1 w-full h-full">
                <NaverMap center={center} markers={markers} path={path} />
            </div>

            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            )}
        </div>
    )
}
