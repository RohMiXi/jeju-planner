
"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { Loader2 } from "lucide-react"

declare global {
    interface Window {
        naver: any
    }
}

interface MapProps {
    center?: { lat: number; lng: number }
    markers?: Array<{
        lat: number
        lng: number
        label: string
        color?: string
    }>
    path?: Array<{ lat: number; lng: number }>
}

export default function NaverMap({ center, markers = [], path = [] }: MapProps) {
    const mapElement = useRef<HTMLDivElement>(null)
    const [loaded, setLoaded] = useState(false)
    const mapRef = useRef<any>(null)

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

    useEffect(() => {
        if (!mapElement.current || !loaded) return

        const initializeMap = () => {
            if (!window.naver || !window.naver.maps) return false

            const mapOptions = {
                center: new window.naver.maps.LatLng(center?.lat || 33.3846, center?.lng || 126.5535),
                zoom: 10,
                scaleControl: false,
                logoControl: false,
                mapDataControl: false,
                zoomControl: true
            }

            const map = new window.naver.maps.Map(mapElement.current, mapOptions)
            mapRef.current = map

            if (path.length > 0) {
                new window.naver.maps.Polyline({
                    map: map,
                    path: path.map(p => new window.naver.maps.LatLng(p.lat, p.lng)),
                    strokeColor: '#0077B6',
                    strokeWeight: 5,
                    strokeOpacity: 0.8
                });
            }

            markers.forEach((marker, index) => {
                new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(marker.lat, marker.lng),
                    map: map,
                    title: marker.label,
                    icon: {
                        content: `
              <div style="
                background-color: #0077B6; 
                color: white; 
                width: 24px; 
                height: 24px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                font-size: 14px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              ">
                ${index + 1}
              </div>
            `,
                        anchor: new window.naver.maps.Point(12, 12)
                    }
                })
            })

            return true
        }

        if (!initializeMap()) {
            const interval = setInterval(() => {
                if (initializeMap()) clearInterval(interval)
            }, 100)
            return () => clearInterval(interval)
        }

    }, [loaded, center, markers, path])

    if (!clientId || clientId === "your_naver_map_client_id_here") {
        return (
            <div className="flex flex-col items-center justify-center bg-gray-100 h-full rounded-lg p-4 text-center">
                <p className="text-gray-500 font-medium">Naver Map Client ID 필요</p>
                <p className="text-xs text-gray-400 mt-1">.env.local 설정 확인</p>
            </div>
        )
    }

    return (
        <>
            <Script
                strategy="afterInteractive"
                type="text/javascript"
                src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`}
                referrerPolicy="origin"
                onReady={() => setLoaded(true)}
            />
            <div ref={mapElement} className="w-full h-full min-h-[400px] rounded-lg bg-gray-100 relative">
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-gray-400" />
                    </div>
                )}
            </div>
        </>
    )
}
