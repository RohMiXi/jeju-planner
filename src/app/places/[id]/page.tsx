"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase, Place } from "@/lib/supabase"
import { searchImage, searchBlog, ImageSearchResult, BlogSearchResult } from "@/lib/naver-search"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowLeft, ExternalLink, MessageSquare, Star, Clock } from "lucide-react"

export default function PlaceDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string

    const [place, setPlace] = useState<Place | null>(null)
    const [loading, setLoading] = useState(true)
    const [images, setImages] = useState<ImageSearchResult[]>([])
    const [reviews, setReviews] = useState<BlogSearchResult[]>([])

    useEffect(() => {
        async function fetchData() {
            if (!id || !supabase) return

            // 1. Fetch Basic Info
            const { data: placeData, error } = await supabase
                .from('places_pool')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !placeData) {
                console.error("Place not found", error)
                setLoading(false)
                return
            }

            setPlace(placeData)

            // 2. Check Cache
            const CACHE_KEY_IMG = `place_imgs_v2_${id}`
            const CACHE_KEY_REVIEW = `place_reviews_v2_${id}`

            const cachedImages = localStorage.getItem(CACHE_KEY_IMG)
            const cachedReviews = localStorage.getItem(CACHE_KEY_REVIEW)

            if (cachedImages && cachedReviews) {
                setImages(JSON.parse(cachedImages))
                setReviews(JSON.parse(cachedReviews))
                setLoading(false)
                return
            }

            // 3. Fetch Images & Reviews (Parallel)
            // Query: "Start with 5 items" is handled by API route limit (default 5)
            const query = `제주 ${placeData.name}`

            Promise.all([
                searchImage(query),
                searchBlog(query)
            ]).then(([imgResults, reviewResults]) => {
                const limitedImages = imgResults.slice(0, 5)
                const limitedReviews = reviewResults.slice(0, 5)

                setImages(limitedImages)
                setReviews(limitedReviews)

                // Cache Results
                localStorage.setItem(CACHE_KEY_IMG, JSON.stringify(limitedImages))
                localStorage.setItem(CACHE_KEY_REVIEW, JSON.stringify(limitedReviews))

                setLoading(false)
            })
        }

        fetchData()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    if (!place) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">장소를 찾을 수 없습니다</h1>
                <Button onClick={() => router.back()}>돌아가기</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header / Hero Image */}
            <div className="relative w-full h-[300px] bg-gray-100">
                {images.length > 0 ? (
                    <img src={images[0].link} alt={place.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-6xl">🏝️</span>
                    </div>
                )}

                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-4 left-4 rounded-full bg-white/80 hover:bg-white"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <Badge className="bg-blue-500 hover:bg-blue-600 border-0 mb-2">{place.category}</Badge>
                    <h1 className="text-3xl font-bold mb-1">{place.name}</h1>
                    <p className="text-sm opacity-90 flex items-center">
                        {place.sub_category && <span className="mr-2">| {place.sub_category}</span>}
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Description */}
                <section>
                    <h2 className="text-lg font-bold mb-2 flex items-center">
                        <Star className="w-5 h-5 mr-2 text-yellow-500" />
                        소개
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        {place.description || "설명이 없습니다."}
                    </p>
                </section>

                {/* Naver Map Link */}
                <section>
                    <a
                        href={place.naver_map_url || `https://map.naver.com/v5/search/${place.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full p-4 bg-[#03C75A] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                        <MapPin className="w-5 h-5 mr-2" />
                        네이버 지도로 길찾기
                    </a>
                </section>

                {/* Photo Gallery */}
                {images.length > 1 && (
                    <section>
                        <h2 className="text-lg font-bold mb-3">사진</h2>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {images.slice(1, 6).map((img, i) => (
                                <div key={i} className="min-w-[120px] h-[120px] rounded-lg overflow-hidden relative border">
                                    <img src={img.thumbnail} alt="gallery" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Blog Reviews */}
                {reviews.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold mb-3 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                            블로그 후기 ({reviews.length})
                        </h2>
                        <div className="space-y-3">
                            {reviews.map((review, i) => (
                                <a
                                    key={i}
                                    href={review.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 border rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm"
                                >
                                    <div className="font-bold text-sm mb-2 truncate" dangerouslySetInnerHTML={{ __html: review.title }} />
                                    <div className="text-xs text-gray-500 mb-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: review.description }} />
                                    <div className="text-xs text-blue-500 flex justify-between items-center">
                                        <span>{review.bloggername}</span>
                                        <div className="flex items-center text-gray-400">
                                            <span className="mr-2">{review.postdate.substring(0, 4)}.{review.postdate.substring(4, 6)}.{review.postdate.substring(6, 8)}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
