import { useState } from 'react'
import {
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    sortableKeyboardCoordinates,
    arrayMove,
} from '@dnd-kit/sortable'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function useCampaignDnd(initialItems: any[], role: string) {
    const [items, setItems] = useState(initialItems)
    const supabase = createClient()
    const router = useRouter()

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    async function handleDragEnd(event: DragEndEvent) {

        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id)
            const newIndex = items.findIndex((item) => item.id === over.id)

            const newItems = arrayMove(items, oldIndex, newIndex)
            setItems(newItems)

            const { error } = await supabase.from('campaigns').upsert(
                newItems.map((item, index) => ({
                    id: item.id,
                    title: item.title,
                    priority: index + 1,
                }))
            )

            if (error) {
                console.error('Error updating priorities:', error)
                router.refresh()
            }
        }
    }

    return {
        items,
        setItems,
        sensors,
        handleDragEnd
    }
}
