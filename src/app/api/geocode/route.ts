import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
        return NextResponse.json(
            { error: "Missing query parameter" },
            { status: 400 }
        );
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("Missing Naver Credentials");
        return NextResponse.json(
            { error: "Server misconfigured: Missing map credentials" },
            { status: 500 }
        );
    }

    // Naver Maps Geocoding API
    // Using 'maps.apigw.ntruss.com' as it is the confirmed working host for this user's keys.
    const baseUrl = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode";

    const params = new URLSearchParams({
        query: query,
    });

    const url = `${baseUrl}?${params.toString()}`;

    console.log("[API/Geocode] Requesting:", url);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-ncp-apigw-api-key-id": clientId,
                "x-ncp-apigw-api-key": clientSecret,
                "Accept": "application/json"
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[API/Geocode] Error:", response.status, errorText);
            return NextResponse.json(
                { error: "Naver API Error", details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[API/Geocode] Internal Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
