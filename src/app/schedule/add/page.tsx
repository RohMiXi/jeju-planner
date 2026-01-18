"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowLeft, Search } from "lucide-react"
import { searchPlace, PlaceSearchResult } from "@/lib/naver-search"

type Mode = "select" | "suggest" | "add"

interface SearchSectionProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    handleSearch: (e: any) => void
    isSearching: boolean
    searchResults: PlaceSearchResult[]
    handleSelectResult: (item: PlaceSearchResult) => void
}

// Standalone Search Component
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
                네이버 장소 검색
            </h4>
            <div className="flex gap-2 mb-2">
                <Input
                    placeholder="장소명을 검색해보세요 (예: 스타벅스)"
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

            {/* Results List */}
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

export default function AddSchedulePage() {
    const { user } = useAuth()
    const router = useRouter()
    const [mode, setMode] = useState<Mode>("select")
    const [isLoading, setIsLoading] = useState(false)

    // Search State
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Form States
    const [suggestForm, setSuggestForm] = useState({
        category: "식당",
        name: "",
        address: "",
        naver_map_url: "",
        description: ""
    })

    const [addForm, setAddForm] = useState({
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

    // Geocoding Helper
    const fetchGeocode = async (address: string) => {
        try {
            const res = await fetch(`/api/geocode?query=${encodeURIComponent(address)}`)
            const data = await res.json()
            if (data.addresses && data.addresses.length > 0) {
                const { x, y } = data.addresses[0] // x: longitude, y: latitude
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

    // Handle Selection (Populates forms)
    const handleSelectResult = async (item: PlaceSearchResult) => {
        const cleanedTitle = cleanTitle(item.title)
        const address = item.roadAddress || item.address

        if (mode === "suggest") {
            setSuggestForm(prev => ({
                ...prev,
                name: cleanedTitle,
                address: address,
                naver_map_url: item.link || `https://map.naver.com/v5/search/${encodeURIComponent(cleanedTitle)}`
            }))
        } else if (mode === "add") {
            setAddForm(prev => ({
                ...prev,
                location: cleanedTitle,
                address: address,
                lat: null, // Reset coords on new selection so we know to fetch
                lng: null
            }))
        }

        setSearchResults([]) // Clear results after selection
    }

    const handleSuggestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !supabase) return
        setIsLoading(true)

        const { error } = await supabase.from('places_pool').insert({
            category: suggestForm.category,
            name: suggestForm.name,
            address: suggestForm.address,
            naver_map_url: suggestForm.naver_map_url || null,
            description: suggestForm.description || null,
            profile_id: user.id
        })

        setIsLoading(false)
        if (error) {
            console.error(error)
            alert("저장에 실패했습니다.")
        } else {
            alert("관광지가 추천되었습니다!")
            router.back()
        }
    }

    // Revised Add Submit Logic: Enforce Geocoding at Save Time
    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !supabase) return
        setIsLoading(true)

        // 1. Determine final coordinates
        let finalLat = addForm.lat
        let finalLng = addForm.lng

        // If coordinates are missing but we have an address, force fetch them now
        if ((!finalLat || !finalLng) && addForm.address) {
            const coords = await fetchGeocode(addForm.address)
            if (coords) {
                finalLat = coords.lat
                finalLng = coords.lng
            } else {
                alert(`위치 정보를 가져 올 수 없습니다.\n주소: ${addForm.address}`)
                setIsLoading(false)
                return; // Stop saving to prevent bad data
            }
        }

        const payload = {
            day_number: parseInt(addForm.day_number),
            start_time: addForm.start_time,
            end_time: addForm.end_time,
            location: addForm.location,
            address: addForm.address,
            purpose: addForm.purpose || null,
            remarks: addForm.remarks || null,
            lat: finalLat,
            lng: finalLng,
            profile_id: user.id
        }

        const { error } = await supabase.from('schedules').insert(payload)

        setIsLoading(false)
        if (error) {
            console.error("Supabase Insert Error:", error)
            alert("일정 추가에 실패했습니다.")
        } else {
            alert("일정이 추가되었습니다!")
            router.back()
            router.refresh() // Refresh to update list
        }
    }

    return (
        <div className="min-h-screen bg-[#F7F3F2] flex flex-col pb-safe">
            {/* Header */}
            <div className="h-14 px-4 flex items-center bg-white border-b border-gray-100 sticky top-0 z-30">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-800">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="flex-1 text-center font-bold text-lg text-[#1D1D1F] pr-10">
                    {mode === "select" && "새로운 항목 추가"}
                    {mode === "suggest" && "장소 추천하기"}
                    {mode === "add" && "일정 직접 추가"}
                </h1>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
                {/* Mode 1: Selection */}
                {mode === "select" && (
                    <div className="grid gap-4 mt-4">
                        <button
                            onClick={() => setMode("suggest")}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:bg-orange-50 transition-colors active:scale-[0.98]"
                        >
                            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl">
                                🏝️
                            </div>
                            <h3 className="font-bold text-lg text-[#1D1D1F]">장소 추천하기</h3>
                            <p className="text-sm text-gray-500 text-center">
                                맛집, 카페, 관광지 등을<br />추천 목록에 등록합니다.
                            </p>
                        </button>

                        <button
                            onClick={() => setMode("add")}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:bg-blue-50 transition-colors active:scale-[0.98]"
                        >
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
                                📅
                            </div>
                            <h3 className="font-bold text-lg text-[#1D1D1F]">일정 추가하기</h3>
                            <p className="text-sm text-gray-500 text-center">
                                특정 시간대의 일정을<br />시간표에 직접 추가합니다.
                            </p>
                        </button>
                    </div>
                )}

                {/* Mode 2: Suggest Form */}
                {mode === "suggest" && (
                    <>
                        <SearchSection
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            handleSearch={handleSearch}
                            isSearching={isSearching}
                            searchResults={searchResults}
                            handleSelectResult={handleSelectResult}
                        />
                        <form onSubmit={handleSuggestSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">카테고리</label>
                                <Select
                                    value={suggestForm.category}
                                    onValueChange={(val) => setSuggestForm({ ...suggestForm, category: val })}
                                >
                                    <SelectTrigger className="bg-white h-12">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-[70] bg-white">
                                        <SelectItem value="식당">식당 (맛집)</SelectItem>
                                        <SelectItem value="카페">카페</SelectItem>
                                        <SelectItem value="방문지">방문지 (관광)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">장소명</label>
                                <Input
                                    required
                                    placeholder="예: 런던베이글뮤지엄"
                                    className="h-12 bg-white"
                                    value={suggestForm.name}
                                    onChange={(e) => setSuggestForm({ ...suggestForm, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">주소</label>
                                <Input
                                    required
                                    readOnly
                                    placeholder="검색시 자동 입력됩니다"
                                    className="h-12 bg-gray-50 text-gray-600"
                                    value={suggestForm.address}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">추가 설명</label>
                                <Textarea
                                    placeholder="이 장소에 대한 간략한 설명이나 팁"
                                    className="bg-white min-h-[100px]"
                                    value={suggestForm.description}
                                    onChange={(e) => setSuggestForm({ ...suggestForm, description: e.target.value })}
                                />
                            </div>

                            <Button type="submit" className="w-full h-14 text-lg font-bold bg-[#FF8D28] hover:bg-[#e67512] mt-6" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : "추천 장소 등록"}
                            </Button>
                        </form>
                    </>
                )}

                {/* Mode 3: Add Schedule Form */}
                {mode === "add" && (
                    <>
                        <SearchSection
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            handleSearch={handleSearch}
                            isSearching={isSearching}
                            searchResults={searchResults}
                            handleSelectResult={handleSelectResult}
                        />
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Day</label>
                                <Select
                                    value={addForm.day_number}
                                    onValueChange={(val) => setAddForm({ ...addForm, day_number: val })}
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
                                        value={addForm.start_time}
                                        onChange={(e) => setAddForm({ ...addForm, start_time: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">종료 시간</label>
                                    <Input
                                        type="time"
                                        required
                                        className="h-12 bg-white"
                                        value={addForm.end_time}
                                        onChange={(e) => setAddForm({ ...addForm, end_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">장소명</label>
                                <Input
                                    required
                                    placeholder="예: 공항, 숙소, 식당 이름"
                                    className="h-12 bg-white"
                                    value={addForm.location}
                                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">주소</label>
                                <Input
                                    required
                                    readOnly
                                    placeholder="검색시 자동 입력됩니다 (좌표 자동 저장)"
                                    className="h-12 bg-gray-50 text-gray-600"
                                    value={addForm.address}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">목적 (간단히)</label>
                                <Input
                                    placeholder="예: 점심식사, 산책"
                                    className="h-12 bg-white"
                                    value={addForm.purpose}
                                    onChange={(e) => setAddForm({ ...addForm, purpose: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">메모 / 비고 (선택)</label>
                                <Textarea
                                    placeholder="예: 예약 정보, 메뉴 추천 등"
                                    className="bg-white min-h-[80px]"
                                    value={addForm.remarks}
                                    onChange={(e) => setAddForm({ ...addForm, remarks: e.target.value })}
                                />
                            </div>

                            <Button type="submit" className="w-full h-14 text-lg font-bold bg-[#FF8D28] hover:bg-[#e67512] mt-6" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : "일정 추가하기"}
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
