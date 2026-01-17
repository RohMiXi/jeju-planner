
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Fallback for development without env vars to prevent crash
const isMock = !supabaseUrl || !supabaseAnonKey;

if (isMock) {
    console.warn('Supabase credentials not found. App will run in mock mode or fail database requests.');
}

export const supabase = isMock ? null : createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type Schedule = {
    id: number
    day_number: number
    option_type: 'A' | 'B' | null
    start_time: string
    end_time: string
    location: string
    purpose: string | null
    remarks: string | null
    lat: number | null
    lng: number | null
}

export type Place = {
    id: string
    category: string
    sub_category: string | null
    name: string
    naver_map_url: string | null
    description: string | null
}

export type Message = {
    id: string
    user_name: string
    content: string
    created_at: string
}
