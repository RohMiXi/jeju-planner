
"use client"

import { Drawer } from "vaul"
import { Schedule } from "@/lib/supabase"
import { ScheduleItem } from "@/components/schedule-item"
import { ChevronUp, Minus } from "lucide-react"

interface MapDrawerProps {
    schedules: Schedule[]
    selectedId: number | null
    onItemClick: (id: number) => void
}

export function MapDrawer({ schedules, selectedId, onItemClick }: MapDrawerProps) {
    // Find index of the currently selected item
    const selectedIndex = schedules.findIndex(s => s.id === selectedId);

    return (
        <Drawer.Root shouldScaleBackground>
            <Drawer.Trigger asChild>
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 cursor-pointer">
                    <button className="bg-white text-black px-6 py-3 rounded-full shadow-lg font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors">
                        <ChevronUp className="w-4 h-4" />
                        일정 목록 보기 ({schedules.length})
                    </button>
                </div>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                <Drawer.Content className="bg-[#F7F3F2] flex flex-col rounded-t-[20px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 focus:outline-none">
                    {/* Grabber */}
                    <div className="p-4 bg-white rounded-t-[20px] flex-shrink-0">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-2" />
                        <div className="max-w-md mx-auto">
                            <Drawer.Title className="font-bold text-xl mb-1">
                                여행 일정
                            </Drawer.Title>
                            <Drawer.Description className="text-gray-500 text-sm">
                                총 {schedules.length}개의 일정이 있습니다.
                            </Drawer.Description>
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="p-4 bg-[#F7F3F2] flex-1 overflow-auto">
                        <div className="max-w-md mx-auto space-y-4">
                            {schedules.length > 0 ? (
                                schedules.map((schedule, index) => {
                                    // Logic: highlight if it is the Selected Item OR the Previous Item
                                    const isSelected = index === selectedIndex;
                                    const isPrev = index === selectedIndex - 1;
                                    const isActive = isSelected || isPrev;

                                    return (
                                        <div key={schedule.id} onClick={() => onItemClick(schedule.id)} className="cursor-pointer transition-transform active:scale-[0.98]">
                                            <ScheduleItem
                                                schedule={schedule}
                                                index={index}
                                                isActive={isActive}
                                                isPrimary={isSelected}
                                            />
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-20 text-gray-400">
                                    등록된 일정이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}
