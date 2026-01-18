"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowLeft, Search, Trash2 } from "lucide-react"
import { searchPlace, PlaceSearchResult } from "@/lib/naver-search"

// Reusing SearchSection (Inline to avoid import issues if not exported, or duplicate)
// Ideally this should be a shared component, but for now I'll duplicate to keep it self-contained as per plan.

interface SearchSectionProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    handleSearch: (e: any) => void
    isSearching: boolean
    searchResults: PlaceSearchResult[]
    handleSelectResult: (item: PlaceSearchResult) => void
}

function SearchSection({
    searchQuery,
    setSearchQuery,
    handleSearch,
    isSearching,
    searchResults,
    handleSelectResult
}: SearchSectionProps) {
    return (
        <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#FF8D28]" />
                장소 변경 검색
            </h4>
            <div className="flex gap-2 mb-2">
                <Input
                    placeholder="장소명을 검색해보세요"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-gray-50 border-0"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                />
                <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-gray-900 text-white w-16"
                >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
                </Button>
            </div>

            {searchResults.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-2 max-h-[160px] overflow-y-auto space-y-1 mt-2 border border-gray-100">
                    {searchResults.map((item, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectResult(item)}
                            className="w-full text-left p-2 hover:bg-white rounded-md transition-colors flex flex-col gap-0.5 group"
                        >
                            <span className="text-sm font-bold text-gray-800" dangerouslySetInnerHTML={{ __html: item.title }} />
                            <span className="text-[11px] text-gray-500 truncate">{item.roadAddress || item.address}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { user } = useAuth()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Search State
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const [form, setForm] = useState({
        day_number: "1",
        start_time: "",
        end_time: "",
        location: "", // Name of the place
        address: "",
        purpose: "",
        remarks: "",
        lat: null as number | null,
        lng: null as number | null
    })

    // Fetch initial data
    useEffect(() => {
        const fetchSchedule = async () => {
            if (!supabase) return
            // Wait for user to be ready? No, supabase client is enough for public/anon check, 
            // but we need to check if user owns it? For now just fetch.

            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('id', id)
                .single()

            if (error) {
                console.error("Error fetching schedule", error)
                alert("일정을 불러오지 못했습니다.")
                router.back()
                return
            }

            if (data) {
                setForm({
                    day_number: data.day_number.toString(),
                    start_time: data.start_time,
                    end_time: data.end_time,
                    location: data.location,
                    address: data.address || "",
                    purpose: data.purpose || "",
                    remarks: data.remarks || "",
                    lat: data.lat,
                    lng: data.lng
                })
            }
            setIsLoading(false)
        }
        fetchSchedule()
    }, [id, router])


    // Geocoding Helper
    const fetchGeocode = async (address: string) => {
        try {
            const res = await fetch(`/api/geocode?query=${encodeURIComponent(address)}`)
            const data = await res.json()
            if (data.addresses && data.addresses.length > 0) {
                const { x, y } = data.addresses[0]
                return { lat: parseFloat(y), lng: parseFloat(x) }
            }
        } catch (e) {
            console.error("Geocode failed", e)
        }
        return null
    }

    // Search Logic
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        const results = await searchPlace(searchQuery)
        setSearchResults(results)
        setIsSearching(false)
    }

    const cleanTitle = (title: string) => {
        return title.replace(/<[^>]*>?/gm, "")
    }

    const handleSelectResult = async (item: PlaceSearchResult) => {
        const cleanedTitle = cleanTitle(item.title)
        const address = item.roadAddress || item.address

        setForm(prev => ({
            ...prev,
            location: cleanedTitle,
            address: address,
            lat: null,
            lng: null
        }))

        setSearchResults([])
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!supabase) return
        setIsSaving(true)

        // 1. Determine final coordinates
        let finalLat = form.lat
        let finalLng = form.lng

        // If coordinates are missing but we have an address, force fetch them now
        // Or if address changed and lat/lng was nulled out (logic above)
        if ((!finalLat || !finalLng) && form.address) {
            const coords = await fetchGeocode(form.address)
            if (coords) {
                finalLat = coords.lat
                finalLng = coords.lng
            } else {
                alert(`위치 정보를 가져 올 수 없습니다.\n주소: ${form.address}`)
                setIsSaving(false)
                return
            }
        }

        const payload = {
            day_number: parseInt(form.day_number),
            start_time: form.start_time,
            end_time: form.end_time,
            location: form.location,
            address: form.address,
            purpose: form.purpose || null,
            remarks: form.remarks || null,
            lat: finalLat,
            lng: finalLng
        }

        const { error } = await supabase
            .from('schedules')
            .update(payload)
            .eq('id', id)

        setIsSaving(false)
        if (error) {
            console.error("Supabase Update Error:", error)
            alert("수정에 실패했습니다.")
        } else {
            alert("일정이 수정되었습니다!")
            router.back()
            router.refresh()
        }
    }

    const handleDelete = async () => {
        if (!confirm("정말로 이 일정을 삭제하시겠습니까?")) return
        if (!supabase) return

        setIsSaving(true) // reuse saving loading state

        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id)

        setIsSaving(false)

        if (error) {
            console.error("Delete Error:", error)
            alert("삭제에 실패했습니다.")
        } else {
            alert("일정이 삭제되었습니다.")
            router.back()
            router.refresh()
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F7F3F2] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F7F3F2] flex flex-col pb-safe">
            {/* Header */}
            <div className="h-14 px-4 flex items-center bg-white border-b border-gray-100 sticky top-0 z-30 justify-between">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-800">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-bold text-lg text-[#1D1D1F] ml-2">
                        일정 수정
                    </h1>
                </div>
                <button
                    onClick={handleDelete}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
                <SearchSection
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleSearch={handleSearch}
                    isSearching={isSearching}
                    searchResults={searchResults}
                    handleSelectResult={handleSelectResult}
                />

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Day</label>
                        <Select
                            value={form.day_number}
                            onValueChange={(val) => setForm({ ...form, day_number: val })}
                        >
                            <SelectTrigger className="bg-white h-12">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[70] bg-white">
                                <SelectItem value="1">Day 1</SelectItem>
                                <SelectItem value="2">Day 2</SelectItem>
                                <SelectItem value="3">Day 3</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">시작 시간</label>
                            <Input
                                type="time"
                                required
                                className="h-12 bg-white"
                                value={form.start_time}
                                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">종료 시간</label>
                            <Input
                                type="time"
                                required
                                className="h-12 bg-white"
                                value={form.end_time}
                                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">장소명</label>
                        <Input
                            required
                            placeholder="예: 공항, 숙소, 식당 이름"
                            className="h-12 bg-white"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">주소</label>
                        <Input
                            required
                            readOnly
                            placeholder="검색시 자동 입력됩니다"
                            className="h-12 bg-gray-50 text-gray-600"
                            value={form.address}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">목적 (간단히)</label>
                        <Input
                            placeholder="예: 점심식사, 산책"
                            className="h-12 bg-white"
                            value={form.purpose}
                            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">메모 / 비고 (선택)</label>
                        <Textarea
                            placeholder="예: 예약 정보, 메뉴 추천 등"
                            className="bg-white min-h-[80px]"
                            value={form.remarks}
                            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                        />
                    </div>

                    <Button type="submit" className="w-full h-14 text-lg font-bold bg-[#FF8D28] hover:bg-[#e67512] mt-6" disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" /> : "수정 완료"}
                    </Button>
                </form>
            </div>
        </div>
    )
}
