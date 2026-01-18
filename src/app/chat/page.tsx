"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase, Message } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, ChevronLeft } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"

const profiles = [
    { id: 1, name: "권용근", image: "/profiles/1.png" },
    { id: 2, name: "노재열", image: "/profiles/2.png" },
    { id: 3, name: "이재훈", image: "/profiles/3.png" },
    { id: 4, name: "이지환", image: "/profiles/4.png" },
]

export default function ChatPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Redirect if not logged in is handled by AuthContext, but double check
    useEffect(() => {
        if (!user) return // AuthProvider will redirect
    }, [user])

    // Load initial messages
    useEffect(() => {
        if (!supabase) return

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

        return () => {
            supabase?.removeChannel(channel)
        }
    }, [])

    // Auto-scroll logic
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !supabase || !user) return

        const { error } = await supabase
            .from('messages')
            .insert({
                user_name: user.name,
                content: newMessage,
                profile_id: user.id
            })

        if (error) {
            console.error('Error sending message:', error)
        } else {
            setNewMessage("")
        }
    }

    if (!user) return <div className="min-h-screen bg-[#F5F5F7]" />

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
                <div className="bg-white px-3 py-1.5 rounded-full border shadow-sm text-xs font-semibold text-gray-600 flex items-center gap-2">
                    <div className="relative w-5 h-5 rounded-full overflow-hidden bg-gray-100">
                        <Image src={user.image_url} alt={user.name} fill className="object-cover" />
                    </div>
                    {user.name}
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
                    const isMe = msg.profile_id === user.id || msg.user_name === user.name
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
                <form onSubmit={handleSendMessage} className="max-w-md mx-auto flex items-center gap-2">
                    <Input
                        className="flex-1 h-12 pl-5 pr-5 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] border-none text-[15px] placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#FF8D28]"
                        placeholder="메시지를 입력하세요..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="w-12 h-12 rounded-full bg-[#FF8D28] hover:bg-[#E67819] text-white shadow-sm flex-shrink-0 transition-transform active:scale-95"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
