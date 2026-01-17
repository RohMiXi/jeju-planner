"use client"

import { useState } from "react"
import { Search, Loader2, MapPin } from "lucide-react"

export default function GeocodeTestPage() {
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const res = await fetch(`/api/geocode?query=${encodeURIComponent(query)}`)
            if (!res.ok) {
                throw new Error(`Error: ${res.status} ${res.statusText}`)
            }
            const data = await res.json()
            setResult(data)
        } catch (err: any) {
            setError(err.message || "Failed to fetch")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">📍 좌표 검색 테스트기 (Geocode Helper)</h1>

            <div className="w-full max-w-2xl">
                {/* Search Box */}
                <form onSubmit={handleSearch} className="flex gap-2 mb-8">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="장소명 또는 주소를 입력하세요 (예: 소노캄 제주)"
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF8D28] text-lg"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#FF8D28] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#E67510] transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Search />}
                        검색
                    </button>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200">
                        {error}
                    </div>
                )}

                {/* Result Display */}
                {result && (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        {result.addresses && result.addresses.length > 0 ? (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-[#1D1D1F]">
                                    <MapPin className="text-[#FF8D28]" />
                                    검색 결과 ({result.addresses.length}건)
                                </h2>

                                {result.addresses.map((addr: any, idx: number) => (
                                    <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-lg last:mb-0">
                                        <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                            <span className="font-semibold text-gray-500">도로명 주소:</span>
                                            <span className="font-bold text-gray-800">{addr.roadAddress}</span>

                                            <span className="font-semibold text-gray-500">지번 주소:</span>
                                            <span className="text-gray-700">{addr.jibunAddress}</span>

                                            <span className="font-semibold text-gray-500">좌표 (Lat/Lng):</span>
                                            <span className="font-mono text-blue-600 font-bold">
                                                {addr.y}, {addr.x}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => navigator.clipboard.writeText(`${addr.y}, ${addr.x}`)}
                                                className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-full transition-colors"
                                            >
                                                좌표 복사
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-yellow-50 text-yellow-800 p-6 rounded-xl text-center border border-yellow-200">
                                검색 결과가 없습니다. 주소를 더 정확하게 입력해보세요.
                            </div>
                        )}

                        {/* Raw JSON Debugger */}
                        <div className="bg-gray-900 text-gray-300 p-6 rounded-xl overflow-x-auto text-xs font-mono">
                            <h3 className="text-gray-500 mb-2 uppercase tracking-wider font-bold">Raw JSON Response</h3>
                            <pre>{JSON.stringify(result, null, 2)}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
