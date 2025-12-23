import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';

interface TeamDragSourceProps {
    id: string; // The Team ID
    name: string;
    logo_url?: string;
    short_name?: string;
}

export const TeamDragSource: React.FC<TeamDragSourceProps> = ({ id, name, logo_url, short_name }) => {
    // We treat the team ID as the draggable ID's payload
    // Prefix might be needed to distinguish? "team:SOME_ID"
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `team-source:${id}`,
        data: {
            type: 'team',
            teamId: id,
            name: name
        }
    });

    // Simple transform style (optional, mostly for drag overlay)
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: isDragging ? 0.5 : 1
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="flex items-center gap-2 p-2 bg-[#2a2a2a] hover:bg-[#333] border border-white/5 rounded-md cursor-grab active:cursor-grabbing mb-2 select-none group transition-colors"
        >
            <GripVertical size={16} className="text-white/20 group-hover:text-white/50" />
            <div className="w-8 h-8 bg-black/50 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border border-white/10">
                {logo_url ? <img src={logo_url} className="w-full h-full object-cover" /> : null}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-white">{short_name || name}</p>
            </div>
        </div>
    );
};
