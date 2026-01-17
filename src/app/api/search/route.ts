import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const type = searchParams.get('type') || 'local' // 'local' or 'image'

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const clientId = process.env.NAVER_SEARCH_CLIENT_ID
    const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const apiUrl = type === 'image'
        ? 'https://openapi.naver.com/v1/search/image'
        : type === 'blog'
            ? 'https://openapi.naver.com/v1/search/blog.json'
            : 'https://openapi.naver.com/v1/search/local.json'

    const sort = type === 'local' ? 'random' : 'sim'

    try {
        const response = await fetch(`${apiUrl}?query=${encodeURIComponent(query)}&display=5&start=1&sort=${sort}`, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error("Naver API Error:", errorData)
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Internal Server Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
