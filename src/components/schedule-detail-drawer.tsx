"use client"

import { Drawer } from "vaul"
import { Schedule } from "@/lib/supabase"
import NaverMap from "@/components/naver-map"
import { Badge } from "@/components/ui/badge"
import { Navigation, Clock, MapPin, X, Pencil } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface ScheduleDetailDrawerProps {
    isOpen: boolean
    onClose: () => void
    schedule: Schedule | null
    currentLocation: { lat: number; lng: number } | null
}

export function ScheduleDetailDrawer({ isOpen, onClose, schedule, currentLocation }: ScheduleDetailDrawerProps) {
    const router = useRouter()
    // Route Path State
    const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[]>([])
    const [isRouteLoading, setIsRouteLoading] = useState(false)

    // Reset path when schedule changes
    useEffect(() => {
        setRoutePath([])
    }, [schedule])

    // Fetch Route when drawer is open and we have data
    useEffect(() => {
        async function fetchRoute() {
            if (!isOpen || !schedule || !currentLocation || !schedule.lat || !schedule.lng) return

            setIsRouteLoading(true)
            const startParam = `${currentLocation.lng},${currentLocation.lat}`
            const goalParam = `${schedule.lng},${schedule.lat}`
            const cacheKey = `route_v2_${startParam}_${goalParam}`

            // 1. Check Cache
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
                setRoutePath(JSON.parse(cached))
                setIsRouteLoading(false)
                return
            }

            // 2. Fetch API
            try {
                const queryParams = new URLSearchParams({
                    start: startParam,
                    goal: goalParam,
                    option: "traoptimal"
                })

                const res = await fetch(`/api/direction?${queryParams.toString()}`)
                if (!res.ok) throw new Error("API Error")

                const data = await res.json()
                const routeData = data.route?.traoptimal ? data.route.traoptimal[0] : null
                const pathCoords = routeData?.path

                if (pathCoords && pathCoords.length > 0) {
                    const formatted = pathCoords.map((p: number[]) => ({ lng: p[0], lat: p[1] }))
                    setRoutePath(formatted)
                    localStorage.setItem(cacheKey, JSON.stringify(formatted))
                } else {
                    // Fallback to straight line if no route found (e.g. invalid inputs)
                    setRoutePath([
                        currentLocation,
                        { lat: schedule.lat!, lng: schedule.lng! }
                    ])
                }
            } catch (error) {
                console.error("Failed to fetch route", error)
                // Fallback straight line
                setRoutePath([
                    currentLocation,
                    { lat: schedule.lat!, lng: schedule.lng! }
                ])
            }
            setIsRouteLoading(false)
        }

        fetchRoute()
    }, [isOpen, schedule, currentLocation])


    if (!schedule) return null

    // Construct External Link
    const getNaverMapUrl = () => {
        const destName = encodeURIComponent(schedule.location)
        const destLat = schedule.lat
        const destLng = schedule.lng

        if (currentLocation) {
            const startLat = currentLocation.lat
            const startLng = currentLocation.lng
            const startName = encodeURIComponent("내 위치")

            return `https://map.naver.com/index.nhn?slng=${startLng}&slat=${startLat}&stext=${startName}&elng=${destLng}&elat=${destLat}&etext=${destName}&menu=route`
        } else {
            return `https://map.naver.com/v5/search/${destName}`
        }
    }

    const markers = [
        ...(currentLocation ? [{ lat: currentLocation.lat, lng: currentLocation.lng, label: "내 위치", color: "blue" }] : []),
        ...(schedule.lat && schedule.lng ? [{ lat: schedule.lat, lng: schedule.lng, label: schedule.location }] : [])
    ]

    const center = schedule.lat && schedule.lng
        ? { lat: schedule.lat, lng: schedule.lng }
        : { lat: 33.3846, lng: 126.5535 }

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} shouldScaleBackground>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content className="bg-[#F7F3F2] flex flex-col rounded-t-[20px] h-[90vh] mt-24 fixed bottom-0 left-0 right-0 z-[60] focus:outline-none">
                    {/* Header / Grabber */}
                    <div className="p-4 bg-white rounded-t-[20px] shadow-sm z-10 relative">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-4" />

                        {/* Edit Button */}
                        <button
                            onClick={() => {
                                onClose()
                                router.push(`/schedule/${schedule.id}/edit`)
                            }}
                            className="absolute right-16 top-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                            <Pencil className="w-5 h-5 text-gray-500" />
                        </button>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[#FF8D28] border-[#FF8D28]">
                                    {schedule.start_time.substring(0, 5)}
                                </Badge>
                                <span className="text-gray-400 text-xs">~</span>
                            </div>
                            <Drawer.Title className="font-bold text-2xl text-[#1D1D1F]">
                                {schedule.location}
                            </Drawer.Title>
                            {schedule.purpose && (
                                <Drawer.Description className="text-gray-500 font-medium">
                                    {schedule.purpose}
                                </Drawer.Description>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto bg-[#F7F3F2]">
                        <div className="p-4 space-y-6">

                            {/* Remarks Section */}
                            {schedule.remarks && (
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-[#FF8D28] rounded-full" />
                                        메모
                                    </h4>
                                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                        {schedule.remarks}
                                    </p>
                                </div>
                            )}

                            {/* Map & Route Section */}
                            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                <div className="p-3 border-b border-gray-50 flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#FF8D28]" />
                                        위치 및 경로
                                    </h4>
                                    {!currentLocation && (
                                        <span className="text-xs text-red-500 font-medium">위치 권한 필요</span>
                                    )}
                                </div>

                                <div className="h-[300px] w-full relative bg-gray-100">
                                    {schedule.lat && schedule.lng ? (
                                        <NaverMap
                                            center={center}
                                            markers={markers}
                                            path={routePath}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                            좌표 정보가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Footer / Fixed Button */}
                    <div className="p-4 bg-white border-t border-gray-100 pb-8">
                        <a
                            href={getNaverMapUrl()}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="w-full bg-[#03C75A] text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm hover:bg-[#02b350] transition-colors active:scale-[0.98]"
                        >
                            <Navigation className="w-5 h-5 fill-current" />
                            네이버 지도로 길찾기
                        </a>
                        <p className="text-center text-xs text-gray-400 mt-2">
                            네이버 지도 앱 또는 웹으로 연결됩니다.
                        </p>
                    </div>

                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}
