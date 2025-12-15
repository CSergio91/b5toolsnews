import React, { useState } from 'react';
import { useBuilder } from '../../../context/BuilderContext';
import { UserCheck, ChevronDown } from 'lucide-react';

interface CalendarRefereeSelectorProps {
    currentRefereeId?: string;
    onSelect: (refereeId: string) => void;
}

export const CalendarRefereeSelector: React.FC<CalendarRefereeSelectorProps> = ({ currentRefereeId, onSelect }) => {
    const { state } = useBuilder();
    // Assuming referees are stored in state.referees, based on task history
    const referees = state.referees || [];

    const [isOpen, setIsOpen] = useState(false);

    const selectedReferee = referees.find(r => r.id === currentRefereeId);

    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent drag/open card
                    setIsOpen(!isOpen);
                }}
                className={`p-1.5 rounded transition-colors flex items-center gap-1 ${selectedReferee
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'text-white/20 hover:text-white hover:bg-white/10'
                    }`}
                title={selectedReferee ? `Árbitro: ${selectedReferee.first_name} ${selectedReferee.last_name}` : "Asignar Árbitro"}
            >
                <UserCheck size={14} />
                {selectedReferee && <span className="text-[10px] font-bold max-w-[60px] truncate">{selectedReferee.first_name} {selectedReferee.last_name}</span>}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a20] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                        <div className="p-2 text-[10px] text-white/50 uppercase font-bold border-b border-white/5 bg-black/20">
                            Seleccionar Árbitro
                        </div>
                        {referees.length === 0 ? (
                            <div className="p-3 text-xs text-white/30 text-center">
                                No hay árbitros registrados
                            </div>
                        ) : (
                            <div className="py-1">
                                {referees.map(ref => (
                                    <button
                                        key={ref.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(ref.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 ${ref.id === currentRefereeId ? 'text-green-400 font-bold' : 'text-white/70'
                                            }`}
                                    >
                                        <span>{ref.first_name} {ref.last_name}</span>
                                        {ref.id === currentRefereeId && <UserCheck size={12} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
