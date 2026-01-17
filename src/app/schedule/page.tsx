
"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScheduleItem } from "@/components/schedule-item"
import { supabase, Schedule } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function SchedulePage() {
    const [day, setDay] = useState(1)
    const [optionType, setOptionType] = useState<"A" | "B">("A")
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchSchedules() {
            setLoading(true)

            if (!supabase) {
                // Mock data if Supabase is not connected
                console.log("Using mock data")
                setSchedules([])
                setLoading(false)
                return
            }

            let query = supabase
                .from('schedules')
                .select('*')
                .eq('day_number', day)
                .order('start_time', { ascending: true })

            const { data, error } = await query

            if (error) {
                console.error('Error fetching schedules:', error)
            } else {
                // Filter options in memory for simplicity or add complicated OR logic
                // We only want items where option_type is NULL OR option_type matches current selection
                const filtered = data.filter(item =>
                    item.option_type === null || item.option_type === optionType
                )
                setSchedules(filtered)
            }
            setLoading(false)
        }

        fetchSchedules()
    }, [day, optionType])

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header with Day Selection */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-[#0077B6] to-blue-500 bg-clip-text text-transparent">
                        Jeju Travel Hub 🍊
                    </h1>
                </div>

                <Tabs defaultValue="1" value={day.toString()} onValueChange={(v) => setDay(parseInt(v))} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="1">Day 1</TabsTrigger>
                        <TabsTrigger value="2">Day 2</TabsTrigger>
                        <TabsTrigger value="3">Day 3</TabsTrigger>
                    </TabsList>
                </Tabs>

                {day === 1 && (
                    <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-gray-100">
                        <Label htmlFor="option-mode" className="text-sm font-medium text-gray-600">
                            {optionType === 'A' ? 'A안 (액티비티)' : 'B안 (양조장)'}
                        </Label>
                        <Switch
                            id="option-mode"
                            checked={optionType === 'B'}
                            onCheckedChange={(checked) => setOptionType(checked ? 'B' : 'A')}
                        />
                    </div>
                )}
            </header>

            {/* Schedule List */}
            <main className="flex-1 px-4 py-6 pb-24">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : schedules.length > 0 ? (
                    <div className="space-y-2">
                        {schedules.map((schedule, index) => (
                            <ScheduleItem key={schedule.id} schedule={schedule} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>일정이 없습니다.</p>
                        <p className="text-xs mt-2">DB 연결을 확인해주세요.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
