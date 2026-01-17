
"use client"

import { useState, useEffect, useMemo } from "react"
import NaverMap from "@/components/naver-map"
import { MapDrawer } from "@/components/map-drawer"

import { supabase, Schedule } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function MapPage() {
    const [day, setDay] = useState(1)
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [loading, setLoading] = useState(true)

    const [isRouteLoading, setIsRouteLoading] = useState(false)

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
                // Filter items that have coordinates for the map
                // Deduplicate by ID to fix potential DB duplication issues
                const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());

                const filtered = uniqueData.filter(item =>
                    item.option_type === null || item.option_type === 'A'
                )
                setSchedules(filtered)
            }
            setLoading(false)
        }

        fetchSchedules()
    }, [day])

    // Only items with coordinates contribute to map center/markers
    // Memoize to prevent infinite loop in useEffect
    const mapSchedules = useMemo(() => {
        // 1. Filter items with coordinates
        const withCoords = schedules.filter(s => s.lat && s.lng)

        // 2. Client-side Deduplication (Safety Net)
        // Keep only the first occurrence of a unique (lat, lng, start_time) combination
        const uniqueMap = new Map();
        const deduplicated = [];

        for (const item of withCoords) {
            const key = `${item.lat}-${item.lng}-${item.start_time}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, true);
                deduplicated.push(item);
            }
        }

        console.log(`[MapPage] Path Nodes (Day ${day}):`, deduplicated.map(s => `${s.start_time} ${s.location}`))
        return deduplicated;
    }, [schedules, day])

    // Driving Path State: Store segments keyed by Start Node ID
    // Key: Schedule ID of the start point
    // Value: Array of coords for that segment
    const [pathSegments, setPathSegments] = useState<Record<string, { lat: number; lng: number }[]>>({})

    // Interaction State
    const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null)

    const handleScheduleClick = (id: number) => {
        if (selectedScheduleId === id) {
            setSelectedScheduleId(null) // deselect
        } else {
            setSelectedScheduleId(id)
        }
    }

    // Computed path to display on map
    const displayPath = useMemo(() => {
        if (selectedScheduleId === null) {
            // Return ALL segments flattened
            return Object.values(pathSegments).flat()
        } else {
            // Return ONLY the segment ending at selected ID (i.e., starting from prev item)
            const idx = mapSchedules.findIndex(s => s.id === selectedScheduleId)

            if (idx > 0) {
                const prevItem = mapSchedules[idx - 1]
                // The segment starts at prevItem.id and goes to current item
                return pathSegments[prevItem.id] || []
            }

            // If first item selected, show nothing
            return []
        }
    }, [pathSegments, selectedScheduleId, mapSchedules])

    // Fetch Driving Direction
    useEffect(() => {
        async function fetchDirection() {
            if (mapSchedules.length < 2) {
                setPathSegments({})
                return
            }

            setIsRouteLoading(true)
            const newSegments: Record<string, { lat: number; lng: number }[]> = {}

            // Loop through each pair of locations (e.g., 1->2, 2->3)
            // We use 'mapSchedules' which is already deduplicated and sorted.
            for (let i = 0; i < mapSchedules.length - 1; i++) {
                const startNode = mapSchedules[i]
                const endNode = mapSchedules[i + 1]

                const startParam = `${startNode.lng},${startNode.lat}`
                const goalParam = `${endNode.lng},${endNode.lat}`

                // 1. Check LocalStorage Cache
                const cacheKey = `route_v1_${startParam}_${goalParam}`
                const cachedData = localStorage.getItem(cacheKey)

                if (cachedData) {
                    // Cache Hit
                    newSegments[startNode.id] = JSON.parse(cachedData)
                    continue
                }

                // 2. Cache Miss - Request API
                const segmentLabel = `[Path ${i + 1}] ${startNode.location} -> ${endNode.location}`
                console.log(`${segmentLabel}: Requesting API...`)

                try {
                    const queryParams = new URLSearchParams({
                        start: startParam,
                        goal: goalParam,
                        option: "traoptimal"
                    })

                    const res = await fetch(`/api/direction?${queryParams.toString()}`)

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}))
                        console.error(`${segmentLabel}: FAILED to fetch. Error:`, errData)
                        // Fallback: draw straight line
                        newSegments[startNode.id] = [
                            { lat: startNode.lat!, lng: startNode.lng! },
                            { lat: endNode.lat!, lng: endNode.lng! }
                        ]
                        continue
                    }

                    const data = await res.json()

                    const routeData = data.route?.traoptimal ? data.route.traoptimal[0] : null
                    const pathCoords = routeData?.path

                    if (pathCoords && pathCoords.length > 0) {
                        const formattedSegment = pathCoords.map((p: number[]) => ({
                            lng: p[0],
                            lat: p[1]
                        }))
                        newSegments[startNode.id] = formattedSegment

                        // Save to Cache
                        localStorage.setItem(cacheKey, JSON.stringify(formattedSegment))
                    } else {
                        newSegments[startNode.id] = []
                    }

                } catch (error) {
                    console.error(`${segmentLabel}: EXCEPTION.`, error)
                }
            }

            setPathSegments(newSegments)
            setIsRouteLoading(false)
        }

        fetchDirection()
    }, [mapSchedules]) // Re-run when filtered schedules change

    const center = mapSchedules.length > 0
        ? {
            lat: mapSchedules.reduce((acc, cur) => acc + (cur.lat || 0), 0) / mapSchedules.length,
            lng: mapSchedules.reduce((acc, cur) => acc + (cur.lng || 0), 0) / mapSchedules.length
        }
        : { lat: 33.3846, lng: 126.5535 }

    const markers = mapSchedules.map(s => ({
        lat: s.lat!,
        lng: s.lng!,
        label: s.location
    }))

    return (
        <div className="flex flex-col h-screen pb-16 relative">
            {/* Map takes full background */}
            <div className="absolute inset-0 z-0">
                <NaverMap center={center} markers={markers} path={displayPath} />
            </div>

            <header className="absolute top-0 left-0 right-0 z-10 px-6 pt-6 pb-2">
                <div className="flex justify-between gap-3">
                    {[1, 2, 3].map((d) => (
                        <button
                            key={d}
                            onClick={() => {
                                setDay(d)
                                setSelectedScheduleId(null)
                            }}
                            className={`flex flex-col items-center justify-center flex-1 py-3 rounded-xl transition-all duration-300 border shadow-sm backdrop-blur-sm ${day === d
                                ? "date-card-active"
                                : "bg-white/80 border-transparent text-gray-400 hover:bg-white"
                                }`}
                        >
                            <span className="text-[11px] font-medium mb-0.5">Day</span>
                            <span className={`text-xl font-bold ${day === d ? "text-[#1D1D1F]" : "text-gray-400"}`}>{d}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Bottom Sheet Drawer */}
            <MapDrawer
                schedules={mapSchedules}
                selectedId={selectedScheduleId}
                onItemClick={handleScheduleClick}
            />

            {(loading || isRouteLoading) && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-[#FF8D28] mb-3" />
                    <p className="text-sm font-bold text-[#1D1D1F] animate-pulse">
                        {loading ? "일정을 불러오는 중..." : "경로를 찾고 있어요..."}
                    </p>
                </div>
            )}
        </div>
    )
}
