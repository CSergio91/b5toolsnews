import React from 'react';
import { X, AlertTriangle, ListOrdered, Users } from 'lucide-react';
import { TieBreakerRule, TournamentTeam } from '../types/tournament';

interface TiebreakerModalProps {
    isOpen: boolean;
    onClose: () => void;
    tiedGroups: { points: number; teams: TournamentTeam[] }[];
    rules: TieBreakerRule[];
}

export const TiebreakerModal: React.FC<TiebreakerModalProps> = ({ isOpen, onClose, tiedGroups, rules }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal Panel */}
            <div className="relative w-full max-w-2xl bg-[#1e1e24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                Resolución de Desempates
                            </h3>
                            <p className="text-sm text-white/50">
                                Se han detectado empates en la clasificación.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Section 1: Tied Teams */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Users size={16} /> Equipos Empatados
                        </h4>

                        <div className="space-y-3">
                            {tiedGroups.map((group, idx) => (
                                <div key={idx} className="bg-black/20 rounded-lg p-3 border border-white/5">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                        <span className="text-xs font-bold text-yellow-500">GRUPO DE EMPATE #{idx + 1}</span>
                                        <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white/70">{group.points} PTS</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.teams.map(team => (
                                            <div key={team.id} className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                {team.logo_url && <img src={team.logo_url} className="w-4 h-4 rounded-full object-cover" />}
                                                <span className="text-sm font-medium text-white/90">{team.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Rules */}
                    <div className="bg-blue-900/10 rounded-xl p-4 border border-blue-500/20">
                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ListOrdered size={16} /> Reglas Aplicables
                        </h4>

                        {rules && rules.length > 0 ? (
                            <ul className="space-y-2">
                                {rules.sort((a, b) => a.order - b.order).map((rule, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-sm text-white/80 p-2 hover:bg-white/5 rounded transition-colors">
                                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded-full font-bold text-xs">
                                            {rule.order}
                                        </span>
                                        <span className="capitalize">
                                            {rule.type === 'direct_match' && 'Resultado Directo (Head-to-Head)'}
                                            {rule.type === 'runs_scored' && 'Carreras Anotadas'}
                                            {rule.type === 'run_diff' && 'Diferencia de Carreras'}
                                            {rule.type === 'random' && 'Sorteo / Azar'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-white/40 italic text-center py-4">
                                No hay reglas de desempate configuradas para este torneo.
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
