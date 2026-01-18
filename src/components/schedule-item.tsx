
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, ChevronRight } from "lucide-react"
import { Schedule } from "@/lib/supabase"

interface ScheduleItemProps {
    schedule: Schedule
    index: number
    isActive?: boolean
    isPrimary?: boolean
}

export function ScheduleItem({ schedule, index, isActive, isPrimary }: ScheduleItemProps) {
    // Simple time formatter
    const formatTime = (time: string) => {
        return time.substring(0, 5)
    }

    return (
        <div className="relative pl-6 pb-2 last:pb-0 group isolate">
            {/* Timeline Line */}
            <div className="absolute left-[7px] top-2 bottom-0 w-[2px] bg-gray-200 -z-10" />

            {/* Timeline dot */}
            <div
                className={`absolute left-0 top-0 w-4 h-4 rounded-full border-2 z-20 transition-colors ${isActive ? "border-[#FF8D28] bg-[#FF8D28]" : "border-[#FF8D28] bg-white"
                    }`}
            />

            {/* Content */}
            <div className={`ml-3 transition-all duration-300 ${isActive ? "translate-x-1" : ""}`}>
                <div className={`schedule-card overflow-hidden ${isActive ? "active ring-2 ring-orange-100" : ""}`}>
                    <div className="p-4 flex flex-col gap-4">
                        {/* Time */}
                        <div className="text-[14px] font-bold text-[#FF8D28] leading-none">
                            {formatTime(schedule.start_time)}
                            {isPrimary && <span className="ml-2 text-[10px] text-white bg-[#FF8D28] px-2 py-0.5 rounded-full align-top">도착</span>}
                        </div>

                        {/* Title & Subtitle Group */}
                        <div className="flex flex-col gap-2">
                            {/* Title */}
                            <h3 className="text-[17px] font-bold text-[#1D1D1F] leading-tight flex items-center justify-between">
                                <span>{schedule.location}</span>
                                {/* @ts-ignore - joined payload */}
                                {schedule.profiles?.name && (
                                    <span className="text-[10px] text-gray-400 font-normal bg-gray-100 px-1.5 py-0.5 rounded-sm">
                                        {/* @ts-ignore */}
                                        {schedule.profiles.name}
                                    </span>
                                )}
                            </h3>

                            {/* Purpose / Subtitle */}
                            {schedule.purpose && (
                                <div className="text-[14px] text-gray-500 font-medium leading-tight">
                                    {schedule.purpose}
                                </div>
                            )}
                        </div>

                        {/* Remarks Box */}
                        {schedule.remarks && (
                            <div className="bg-[#F7F3F2] rounded-xl px-4 py-3 text-[13px] text-gray-600 font-medium leading-relaxed">
                                {schedule.remarks}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
