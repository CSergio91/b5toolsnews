import React from 'react';
import { ScheduleItem, RoundMatch } from '../../../types/structure';
import { Coffee, Trash2, GripHorizontal } from 'lucide-react';
import { CalendarRefereeSelector } from './CalendarRefereeSelector';

interface CalendarMatchCardProps {
    item: ScheduleItem;
    match?: RoundMatch; // If item.type === 'match'
    timeStr: string;
    teamNames?: { home: string, away: string };
    onDragStart: (e: React.DragEvent, item: ScheduleItem) => void;
    onDrop: (e: React.DragEvent) => void;
    onRefereeSelect?: (refereeId: string) => void;
    onDeleteEvent?: () => void;
}

export const CalendarMatchCard: React.FC<CalendarMatchCardProps> = ({
    item,
    match,
    timeStr,
    teamNames,
    onDragStart,
    onDrop,
    onRefereeSelect,
    onDeleteEvent
}) => {
    // Event Card
    if (item.type === 'event') {
        const handleDelete = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (onDeleteEvent) onDeleteEvent();
        };

        return (
            <div
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                onDrop={(e) => {
                    e.stopPropagation();
                    onDrop(e);
                }}
                className="bg-yellow-500/5 border border-yellow-500/20 p-2 rounded flex items-center gap-3 select-none hover:bg-yellow-500/10 cursor-move group relative"
            >
                <div className="text-xs font-mono text-yellow-600/70 w-10">{timeStr}</div>
                <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-bold text-yellow-500 truncate">{item.name}</div>
                    <div className="text-[10px] text-white/30">{item.durationMinutes} min</div>
                </div>
                <div className="flex items-center gap-1">
                    <Coffee size={14} className="text-yellow-500/50" />
                    {onDeleteEvent && (
                        <button
                            onClick={handleDelete}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                            title="Eliminar Descanso"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Match Card
    if (!match) return null;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onDrop={(e) => {
                e.stopPropagation();
                onDrop(e);
            }}
            className="bg-[#2a2a30] p-3 rounded border border-white/5 relative group hover:border-blue-500/30 transition-all select-none cursor-move hover:bg-[#333]"
        >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l"></div>
            <div className="pl-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono text-blue-300 bg-blue-900/20 px-1.5 rounded">{timeStr}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/20">#{match.globalId}</span>
                        {/* Referee Selector */}
                        {onRefereeSelect && (
                            <CalendarRefereeSelector
                                currentRefereeId={match.refereeId}
                                onSelect={onRefereeSelect}
                            />
                        )}
                    </div>
                </div>
                <div className="text-xs text-white mb-1">
                    <span className="font-bold truncate max-w-[45%] inline-block align-bottom">{teamNames?.home || 'TBD'}</span>
                    <span className="text-white/30 mx-1">vs</span>
                    <span className="font-bold truncate max-w-[45%] inline-block align-bottom">{teamNames?.away || 'TBD'}</span>
                </div>
                <div className="text-[10px] text-white/30 truncate">{match.name}</div>
            </div>
        </div>
    );
};
