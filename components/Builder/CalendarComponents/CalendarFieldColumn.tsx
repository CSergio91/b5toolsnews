import React, { useRef } from 'react';
import { Field, ScheduleItem, RoundMatch } from '../../../types/structure';
import { CalendarMatchCard } from './CalendarMatchCard';
import { Clock, Edit2, Coffee, Trash2, LayoutGrid } from 'lucide-react';

interface CalendarFieldColumnProps {
    field: Field;
    dateItems: ScheduleItem[];
    matchesSource: RoundMatch[]; // To resolve match details
    getTeamName: (id?: string) => string;
    calculateTime: (start: string, offset: number) => string;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, fieldId: string, index: number) => void;
    onDragStart: (e: React.DragEvent, item: ScheduleItem, fieldId: string) => void;

    // Actions
    onEditField: (field: Field) => void;
    onRemoveField: (id: string) => void;
    onAddEvent: (fieldId: string) => void;

    // Item Actions
    onRefereeSelect: (matchId: string, refereeId: string) => void;
    onDeleteEvent: (itemId: string) => void;
}

export const CalendarFieldColumn: React.FC<CalendarFieldColumnProps> = ({
    field,
    dateItems,
    matchesSource,
    getTeamName,
    calculateTime,
    onDragOver,
    onDrop,
    onDragStart,
    onEditField,
    onRemoveField,
    onAddEvent,
    onRefereeSelect,
    onDeleteEvent
}) => {
    let currentTimeAccumulator = 0;

    return (
        <div
            className="min-w-[340px] w-[340px] bg-[#1a1a20] border border-white/10 rounded-xl flex flex-col h-full shadow-xl transition-all hover:border-white/20"
            onDragOver={onDragOver}
            onDrop={(e) => {
                if (e.target === e.currentTarget) {
                    onDrop(e, field.id, -1);
                }
            }}
        >
            {/* Field Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center group">
                <div className="overflow-hidden">
                    <div className="font-bold text-white truncate flex items-center gap-2">
                        {field.name}
                        <button
                            onClick={() => onEditField(field)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                            title="Editar Nombre y Horario" // Updated Title
                        >
                            <Edit2 size={12} className="text-white/50" />
                        </button>
                    </div>
                    <div className="text-xs text-white/50 flex items-center gap-1">
                        <Clock size={10} /> Inicio: {field.startTime} | {field.items.length} Totales
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => onAddEvent(field.id)} title="Agregar Tiempo Extra" className="p-1.5 text-white/20 hover:text-green-400 rounded hover:bg-green-500/10 transition-colors">
                        <Coffee size={14} />
                    </button>
                    <button onClick={() => onRemoveField(field.id)} className="p-1.5 text-white/20 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div
                className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-black/20 text-sm"
                onDragOver={onDragOver}
                onDrop={(e) => {
                    // Drop on empty space appends to end
                    if (e.target === e.currentTarget) onDrop(e, field.id, -1);
                }}
            >
                {dateItems.map((item, idx) => {
                    const timeStr = calculateTime(field.startTime, currentTimeAccumulator);
                    currentTimeAccumulator += item.durationMinutes;

                    let matchData: RoundMatch | undefined;
                    let teamNames;

                    if (item.type === 'match') {
                        matchData = matchesSource.find(m => m.id === item.matchId);
                        if (matchData) {
                            teamNames = {
                                home: matchData.sourceHome?.type === 'team' ? getTeamName(matchData.sourceHome.id) : 'TBD',
                                away: matchData.sourceAway?.type === 'team' ? getTeamName(matchData.sourceAway.id) : 'TBD'
                            };
                        }
                    }

                    return (
                        <CalendarMatchCard
                            key={item.id}
                            item={item}
                            match={matchData}
                            timeStr={timeStr}
                            teamNames={teamNames}
                            onDragStart={(e) => onDragStart(e, item, field.id)}
                            onDrop={(e) => onDrop(e, field.id, idx)}
                            onRefereeSelect={matchData ? (refId) => onRefereeSelect(matchData!.id, refId) : undefined}
                            onDeleteEvent={item.type === 'event' ? () => onDeleteEvent(item.id) : undefined}
                        />
                    );
                })}

                {dateItems.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-white/10 text-xs border-2 border-dashed border-white/5 rounded m-2 pointer-events-none">
                        <p>Arrastra partidos aquí</p>
                    </div>
                )}
            </div>
        </div>
    );
};
