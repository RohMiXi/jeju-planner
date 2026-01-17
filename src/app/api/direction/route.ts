
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const goal = searchParams.get("goal");
    const waypoints = searchParams.get("waypoints");

    if (!start || !goal) {
        return NextResponse.json(
            { error: "Missing start or goal parameters" },
            { status: 400 }
        );
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("Missing Naver Credentials", { clientId: !!clientId, clientSecret: !!clientSecret });
        return NextResponse.json(
            { error: "Server misconfigured: Missing map credentials" },
            { status: 500 }
        );
    }

    // Naver Application Maps Direction 15 API Reference
    // CONFIRMED WORKING ENDPOINT for New Application Maps Key:
    const baseUrl = "https://maps.apigw.ntruss.com/map-direction-15/v1/driving";

    const params = new URLSearchParams({
        start: start,
        goal: goal,
        option: "traoptimal"
    });

    if (waypoints) {
        params.append("waypoints", waypoints);
    }

    const url = `${baseUrl}?${params.toString()}`;

    console.log("[API] Requesting Direction:", url);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                // Headers are case-insensitive standard, but docs use lowercase often.
                // Using exact keys from documentation.
                "x-ncp-apigw-api-key-id": clientId,
                "x-ncp-apigw-api-key": clientSecret,
                "Accept": "application/json"
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[API] Naver Error Response:", response.status, errorText);

            // Try to parse JSON error if possible
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: response.status });
            } catch {
                return NextResponse.json(
                    { error: "Naver API Error", details: errorText },
                    { status: response.status }
                );
            }
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[API] Internal Server Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
