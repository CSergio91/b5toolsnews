import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface MatchDropZoneProps {
    matchId: string;
    side: 'home' | 'away';
    children: React.ReactNode;
    isOverStyle?: boolean;
}

export const MatchDropZone: React.FC<MatchDropZoneProps> = ({ matchId, side, children, isOverStyle }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `match-slot:${matchId}:${side}`,
        data: {
            matchId,
            side
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`relative transition-colors rounded ${isOver ? 'bg-blue-500/20 ring-2 ring-blue-500' : ''}`}
        >
            {children}
        </div>
    );
};
