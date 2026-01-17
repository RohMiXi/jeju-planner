"use client"

import { useState, useEffect, useRef } from "react"
import { supabase, Place } from "@/lib/supabase"
import { MapPin, ArrowRight } from "lucide-react"
import Link from 'next/link'
import { searchImage } from "@/lib/naver-search"

function PlaceCard({ place }: { place: Place }) {
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // 1. Check Local Storage first
        const cachedImage = localStorage.getItem(`place_img_${place.id}`)
        if (cachedImage) {
            setImageUrl(cachedImage)
            return // Skip intersection observer if we already have the image
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 }
        )

        if (cardRef.current) {
            observer.observe(cardRef.current)
        }

        return () => observer.disconnect()
    }, [place.id])

    useEffect(() => {
        if (!isVisible || imageUrl) return // Don't fetch if not visible or already has image

        async function fetchImage() {
            // Add a small random delay to stagger requests further
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))

            try {
                const results = await searchImage(`제주 ${place.name}`)
                if (results.length > 0) {
                    const img = results[0].thumbnail
                    setImageUrl(img)
                    // 2. Save to Local Storage
                    localStorage.setItem(`place_img_${place.id}`, img)
                }
            } catch (e) {
                console.error("Image fetch failed", e)
            }
        }
        fetchImage()
    }, [place.name, isVisible, imageUrl, place.id])

    return (
        <div ref={cardRef} className="schedule-card flex h-32 overflow-hidden mb-4">
            {/* Image Section (Left) */}
            <div className="w-32 h-full bg-gray-100 relative shrink-0">
                {imageUrl ? (
                    <img src={imageUrl} alt={place.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                        <span className="text-2xl">🏝️</span>
                    </div>
                )}
                {/* Category Badge */}
                <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-[#1D1D1F] shadow-sm">
                    {place.category}
                </span>
            </div>

            {/* Content Section (Right) */}
            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-base text-[#1D1D1F] truncate pr-2">{place.name}</h3>
                        {place.sub_category && (
                            <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{place.sub_category}</span>
                        )}
                    </div>

                    {place.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{place.description}</p>
                    )}
                </div>

                <div className="flex items-center justify-end">
                    <Link href={`/places/${place.id}`} className="flex items-center text-[#FF8D28] text-xs font-bold hover:underline">
                        상세보기 <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

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

    const categories = [
        { id: 'all', label: '전체' },
        { id: '식당', label: '맛집' },
        { id: '카페', label: '카페' },
        { id: '방문지', label: '관광' }
    ]

    return (
        <div className="flex flex-col min-h-screen bg-[#F7F3F2] relative overflow-hidden">
            {/* Background Gradient Effect */}
            <div className="absolute top-0 left-0 right-0 z-0 flex justify-center">
                <img
                    src="/top-gradient.png"
                    alt="Background Gradient"
                    className="w-full max-w-[600px] h-auto object-cover opacity-90"
                />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-40 pt-10 pb-4 px-6 relative">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-[32px] font-bold tracking-tight text-[#1D1D1F]">
                        추천 장소
                    </h1>
                </div>

                {/* Category Selector (Custom Tabs) */}
                <div className="flex justify-between gap-2 mb-4 overflow-x-auto no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex flex-col items-center justify-center flex-1 py-3 px-1 rounded-xl transition-all duration-300 border min-w-[70px] ${category === cat.id
                                ? "date-card-active"
                                : "bg-transparent border-transparent text-gray-400 hover:bg-white/40"
                                }`}
                        >
                            <span className="text-[13px] font-bold">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Place List */}
            <main className="flex-1 px-5 py-2 pb-32 relative z-10">
                <div className="">
                    {filteredPlaces.map((place) => (
                        <PlaceCard key={place.id} place={place} />
                    ))}
                    {filteredPlaces.length === 0 && (
                        <div className="text-center py-20 text-gray-300">
                            <div className="text-4xl mb-4">🏝️</div>
                            <p className="font-medium">해당 카테고리의 장소가 없습니다</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
