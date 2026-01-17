"use client"

import { useState } from "react"

export default function TestSearchPage() {
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const testSearch = async () => {
        try {
            setError(null)
            setResult("Loading...")
            const res = await fetch('/api/search?query=제주맛집&type=local')
            const data = await res.json()

            if (!res.ok) {
                throw new Error(JSON.stringify(data))
            }

            setResult(data)
        } catch (err: any) {
            setError(err.message || "Unknown error")
            setResult(null)
        }
    }

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Search API Test</h1>
            <button
                onClick={testSearch}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Test Search: "제주맛집"
            </button>

            <div className="mt-8">
                <h2 className="font-bold">Result:</h2>
                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded mt-2">
                        Error: {error}
                    </div>
                )}
                {result && (
                    <pre className="p-4 bg-gray-100 rounded mt-2 overflow-auto max-h-[500px]">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                )}
            </div>
        </div>
    )
}
