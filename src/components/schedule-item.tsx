
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, ChevronRight } from "lucide-react"
import { Schedule } from "@/lib/supabase"

interface ScheduleItemProps {
    schedule: Schedule
    index: number
}

export function ScheduleItem({ schedule, index }: ScheduleItemProps) {
    // Simple time formatter
    const formatTime = (time: string) => {
        return time.substring(0, 5)
    }

    return (
        <div className="relative pl-6 pb-6 last:pb-0">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-gray-200 last:hidden" />

            {/* Timeline dot */}
            <div className="absolute left-0 top-6 w-6 h-6 rounded-full bg-[#0077B6] text-white flex items-center justify-center text-xs font-bold z-10 border-2 border-white shadow-sm">
                {index + 1}
            </div>

            <Card className="ml-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98] transition-transform">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </div>
                        {schedule.purpose && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                                {schedule.purpose}
                            </Badge>
                        )}
                    </div>

                    <h3 className="font-bold text-lg mb-1">{schedule.location}</h3>

                    {schedule.remarks && (
                        <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md mt-2 flex items-start">
                            <span className="mr-2">💡</span>
                            {schedule.remarks}
                        </p>
                    )}

                    {/* This would link to actual map destination later */}
                    <div className="mt-3 flex items-center text-xs text-gray-400 group">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>지도 보기</span>
                        <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
