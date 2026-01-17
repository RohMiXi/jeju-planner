export interface PlaceSearchResult {
    title: string
    link: string
    category: string
    description: string
    telephone: string
    address: string
    roadAddress: string
    mapx: string
    mapy: string
}

export interface ImageSearchResult {
    title: string
    link: string // URL of the image
    thumbnail: string
    sizeheight: string
    sizewidth: string
}

export interface BlogSearchResult {
    title: string
    link: string
    description: string
    bloggername: string
    bloggerlink: string
    postdate: string
}

export async function searchPlace(query: string): Promise<PlaceSearchResult[]> {
    try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=local`)
        if (!res.ok) return []
        const data = await res.json()
        return data.items || []
    } catch (e) {
        console.error("Failed to search place:", e)
        return []
    }
}

export async function searchImage(query: string): Promise<ImageSearchResult[]> {
    try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=image`)
        if (!res.ok) return []
        const data = await res.json()
        return data.items || []
    } catch (e) {
        console.error("Failed to search image:", e)
        return []
    }
}

export async function searchBlog(query: string): Promise<BlogSearchResult[]> {
    try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=blog`)
        if (!res.ok) return []
        const data = await res.json()
        return data.items || []
    } catch (e) {
        console.error("Failed to search blog:", e)
        return []
    }
}
