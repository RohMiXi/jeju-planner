import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    // Naver Maps (Cloud Platform) Client ID & Secret
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
    const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET

    console.log(`[Geocode API Debug] ClientID Loaded: ${clientId ? 'Yes' : 'No'} (${clientId?.slice(0, 2)}...)`)
    console.log(`[Geocode API Debug] Secret Loaded: ${clientSecret ? 'Yes' : 'No'} (${clientSecret?.slice(0, 2)}...)`)

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Server configuration error: Missing Keys' }, { status: 500 })
    }

    const apiUrl = 'https://maps.apigw.ntruss.com/map-geocode/v2/geocode'

    try {
        console.log(`[Geocode API] Requesting for: ${query}`)

        const response = await fetch(`${apiUrl}?query=${encodeURIComponent(query)}`, {
            headers: {
                'X-NCP-APIGW-API-KEY-ID': clientId,
                'X-NCP-APIGW-API-KEY': clientSecret,
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error("[Geocode API] Naver API Error Status:", response.status)
            console.error("[Geocode API] Error Body:", errorData)
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        console.log(`[Geocode API] Success. Found ${data.addresses?.length || 0} addresses.`)
        if (data.addresses?.length === 0) {
            console.warn("[Geocode API] No addresses found for query.")
        }
        return NextResponse.json(data)
    } catch (error) {
        console.error("[Geocode API] Internal Server Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
