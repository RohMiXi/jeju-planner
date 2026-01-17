
"use client"

import { useState, useEffect } from "react"
import { supabase, Place } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, MapPin } from "lucide-react"

export default function PlacesPage() {
    const [places, setPlaces] = useState<Place[]>([])
    const [category, setCategory] = useState("all")

    useEffect(() => {
        async function fetchPlaces() {
            if (!supabase) return

            const { data, error } = await supabase
                .from('places_pool')
                .select('*')
                .order('name')

            if (data) setPlaces(data)
        }

        fetchPlaces()
    }, [])

    const filteredPlaces = category === "all"
        ? places
        : places.filter(p => p.category === category)

    const categories = ["all", "식당", "카페", "방문지"]

    return (
        <div className="flex flex-col min-h-screen bg-white pb-20">
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-4 py-3">
                <h1 className="text-xl font-bold mb-3">추천 장소 🏝️</h1>
                <Tabs defaultValue="all" value={category} onValueChange={setCategory}>
                    <TabsList className="w-full">
                        {categories.map((cat) => (
                            <TabsTrigger key={cat} value={cat} className="flex-1 capitalize">
                                {cat === "all" ? "전체" : cat}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </header>

            <main className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2">
                {filteredPlaces.map((place) => (
                    <Card key={place.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-blue-200 bg-blue-50">
                                            {place.category}
                                        </Badge>
                                        {place.sub_category && (
                                            <span className="text-xs text-gray-400">| {place.sub_category}</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-lg">{place.name}</h3>
                                </div>
                            </div>

                            {place.description && (
                                <p className="text-sm text-gray-500 mb-3">{place.description}</p>
                            )}

                            {place.naver_map_url && (
                                <a
                                    href={place.naver_map_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs text-blue-500 hover:text-blue-700 font-medium"
                                >
                                    <MapPin className="w-3 h-3 mr-1" />
                                    네이버 지도에서 보기
                                    <ExternalLink className="w-3 h-3 ml-1 opcaity-50" />
                                </a>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </main>
        </div>
    )
}
