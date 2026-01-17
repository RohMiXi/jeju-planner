
"use client"

import { useState, useEffect, useRef } from "react"
import { supabase, Message } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, User } from "lucide-react"

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [userName, setUserName] = useState("")
    const [isNameSet, setIsNameSet] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load initial messages and set up subscription
    useEffect(() => {
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
        // Ensure supabase is not null before channel
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
    }, [messages])

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

    // Name Setting UI
    if (!isNameSet) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-50">
                <Card className="w-full max-w-sm p-6 space-y-4">
                    <div className="text-center">
                        <h2 className="text-xl font-bold mb-2">여행 톡 참여하기 💬</h2>
                        <p className="text-sm text-gray-500">대화에 사용할 이름을 입력해주세요.</p>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        if (userName.trim()) setIsNameSet(true)
                    }}>
                        <Input
                            placeholder="이름 (예: 길동)"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="mb-4"
                            autoFocus
                        />
                        <Button type="submit" className="w-full bg-[#0077B6] hover:bg-blue-700">입장하기</Button>
                    </form>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen pb-16 bg-blue-50">
            <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 shadow-sm flex items-center justify-between">
                <h1 className="font-bold text-lg">실시간 여행 톡</h1>
                <span className="text-xs text-gray-400">참여자: {userName}</span>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-10">
                        첫 메시지를 남겨보세요!
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.user_name === userName
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-gray-500 mb-1 px-1">{msg.user_name}</span>
                            <div
                                className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm ${isMe
                                    ? 'bg-[#0077B6] text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-2">
                <Input
                    className="flex-1"
                    placeholder="메시지 입력..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" size="icon" className="shrink-0 bg-[#0077B6] hover:bg-blue-700">
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    )
}
