"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase, Message } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, ChevronLeft } from "lucide-react"
import Image from "next/image"

const profiles = [
    { id: 1, name: "권용근", image: "/profiles/1.png" },
    { id: 2, name: "노재열", image: "/profiles/2.png" },
    { id: 3, name: "이재훈", image: "/profiles/3.png" },
    { id: 4, name: "이지환", image: "/profiles/4.png" },
]

export default function ChatPage() {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [userName, setUserName] = useState("")
    const [showSelection, setShowSelection] = useState(true)
    const [isLoading, setIsLoading] = useState(true)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load initial messages and check profile
    useEffect(() => {
        // Load user profile
        const savedProfile = localStorage.getItem("user_profile")
        if (savedProfile) {
            const profile = JSON.parse(savedProfile)
            setUserName(profile.name || "익명")
            setShowSelection(false)
        } else {
            setShowSelection(true)
        }
        setIsLoading(false)

        if (!supabase) return


        // Fetch initial messages
        const fetchMessages = async () => {
            if (!supabase) return

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50)

            if (data) setMessages(data)
        }

        fetchMessages()

        // Subscribe to new messages
        if (!supabase) return

        const channel = supabase
            .channel('chat_room')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, (payload) => {
                setMessages((prev) => [...prev, payload.new as Message])
            })
            .subscribe()

        // Cleanup
        return () => {
            supabase?.removeChannel(channel)
        }
    }, [])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, showSelection])

    const handleSelectProfile = (profile: typeof profiles[0]) => {
        localStorage.setItem("user_profile", JSON.stringify(profile))
        setUserName(profile.name)
        setShowSelection(false)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !supabase) return

        const { error } = await supabase
            .from('messages')
            .insert({ user_name: userName, content: newMessage })

        if (error) {
            console.error('Error sending message:', error)
        } else {
            setNewMessage("")
        }
    }

    if (isLoading) {
        return <div className="min-h-screen bg-[#F5F5F7]" />
    }

    // Profile Selection Screen
    if (showSelection) {
        return (
            <div className="min-h-screen bg-[#F7F3F2] flex flex-col items-center justify-center p-6 relative overflow-hidden pb-24">
                {/* Background Image */}
                {/* Background Image */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] z-0 pointer-events-none">
                    <Image
                        src="/profiles/selection_bg.png"
                        alt="Background"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                <div className="text-center mb-12 relative z-10">
                    <h1 className="text-[24px] font-bold text-[#1D1D1F] leading-tight whitespace-pre-line">
                        채팅에 참여할{"\n"}
                        프로필을 선택하세요
                    </h1>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-[340px] relative z-10">
                    {profiles.map((profile) => (
                        <button
                            key={profile.id}
                            onClick={() => handleSelectProfile(profile)}
                            className="bg-white rounded-[24px] p-6 flex flex-col items-center justify-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-95 aspect-square"
                        >
                            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                                <Image
                                    src={profile.image}
                                    alt={profile.name}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                    priority
                                />
                            </div>
                            <span className="text-[17px] font-bold text-[#1D1D1F]">
                                {profile.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // Chat Interface
    return (
        <div className="flex flex-col h-screen bg-[#F5F5F7]">
            <header className="bg-[#F5F5F7]/95 backdrop-blur px-6 py-4 sticky top-0 z-10 flex items-center justify-between border-b border-gray-100/50">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => router.back()}
                        className="p-1 -ml-2 mr-1 rounded-full hover:bg-gray-200/50 transition-colors text-[#1D1D1F]"
                    >
                        <ChevronLeft className="w-7 h-7" />
                    </button>
                    <div>
                        <h1 className="font-bold text-xl text-[#1D1D1F]">채팅</h1>
                        <p className="text-xs text-gray-400 font-medium">여행에 대해 얘기를 나눠요</p>
                    </div>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-full border shadow-sm text-xs font-semibold text-gray-600 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                    {userName}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                        <span className="text-3xl grayscale opacity-50">👋</span>
                        <p className="text-sm">첫 메시지를 남겨보세요!</p>
                    </div>
                )}
                {messages.map((msg, index) => {
                    const isMe = msg.user_name === userName
                    const showAvatar = index === 0 || messages[index - 1].user_name !== msg.user_name

                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {showAvatar && !isMe && (
                                <span className="text-[11px] font-bold text-gray-500 mb-1 ml-3">{msg.user_name}</span>
                            )}
                            <div
                                className={`px-5 py-3 max-w-[75%] text-[15px] leading-relaxed shadow-sm ${isMe
                                    ? 'bg-[#FFBD2D] text-[#1D1D1F] rounded-[20px] rounded-tr-sm'
                                    : 'bg-white text-[#1D1D1F] rounded-[20px] rounded-tl-sm border border-gray-100'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="fixed bottom-6 left-0 right-0 px-4">
                <form onSubmit={handleSendMessage} className="max-w-md mx-auto relative flex items-center">
                    <Input
                        className="w-full h-14 pl-6 pr-14 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-none text-base placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-primary"
                        placeholder="메시지를 입력하세요..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-2 w-10 h-10 rounded-full bg-primary hover:bg-blue-600 text-white shadow-none transition-transform active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
