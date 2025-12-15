import React from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { MapPin, Calendar, AlignLeft, Flag, DollarSign, Info } from 'lucide-react';

export const ConfigStep: React.FC = () => {
    const { state, updateConfig } = useBuilder();
    const config = state.config;
    // Local state for the new rule input
    const [newRule, setNewRule] = React.useState('');

    const handleAddRule = () => {
        if (!newRule.trim()) return;
        const currentRules = config.custom_rules || [];
        updateConfig('custom_rules', [...currentRules, newRule]);
        setNewRule('');
    };

    const handleRemoveRule = (index: number) => {
        const currentRules = config.custom_rules || [];
        updateConfig('custom_rules', currentRules.filter((_, i) => i !== index));
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">

            {/* 1. General Info */}
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Flag className="text-blue-500" /> Información General
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/50 uppercase">Nombre del Torneo</label>
                        <input
                            value={config.name || ''}
                            onChange={e => updateConfig('name', e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                            placeholder="Ej. Copa Navidad B5"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/50 uppercase">Ubicación / Sede</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                value={config.location || ''}
                                onChange={e => updateConfig('location', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-9 text-white focus:border-blue-500 outline-none"
                                placeholder="Ej. Estadio Latinoamericano"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-white/50 uppercase">Organizador</label>
                        <input
                            value={config.organizer_name || ''}
                            onChange={e => updateConfig('organizer_name', e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="Nombre de la Organización"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase">Fecha Inicio</label>
                            <input
                                type="date"
                                value={config.start_date || ''}
                                onChange={e => updateConfig('start_date', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase">Fecha Fin</label>
                            <input
                                type="date"
                                value={config.end_date || ''}
                                onChange={e => updateConfig('end_date', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Rules Engine */}
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <AlignLeft className="text-purple-500" /> Reglas de Competición
                </h2>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">

                    {/* Sets Format */}
                    <div>
                        <label className="text-sm font-bold text-white mb-3 block">Formato de Sets</label>
                        <div className="flex gap-4">
                            {[1, 3].map(sets => (
                                <button
                                    key={sets}
                                    onClick={() => updateConfig('sets_per_match', sets)}
                                    className={`flex-1 py-4 rounded-xl border-2 transition-all font-bold text-lg ${(config.sets_per_match || 3) === sets
                                        ? 'border-purple-500 bg-purple-500/10 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                                        : 'border-white/5 bg-black/20 text-white/30 hover:border-white/20'
                                        }`}
                                >
                                    {sets === 1 ? 'Partido Único' : `Al Mejor de ${sets}`}
                                    <div className="text-[10px] font-normal opacity-60 mt-1">
                                        {sets === 1 ? '1 Set Ganador' : `Gana ${Math.ceil(sets / 2)} Sets`}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full"></div>

                    {/* Points System */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase">Pts por Victoria</label>
                            <input
                                type="number"
                                value={config.points_for_win || 3}
                                onChange={e => updateConfig('points_for_win', parseInt(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-center text-xl font-mono focus:border-green-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase">Pts por Derrota</label>
                            <input
                                type="number"
                                value={config.points_for_loss || 0}
                                onChange={e => updateConfig('points_for_loss', parseInt(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-center text-xl font-mono focus:border-red-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase">Costo Inscripción</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="number"
                                    value={config.cost_per_team || 0}
                                    onChange={e => updateConfig('cost_per_team', parseInt(e.target.value))}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pl-8 text-white focus:border-yellow-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full"></div>

                    {/* Custom Rules Config */}
                    <div>
                        <label className="text-sm font-bold text-white mb-3 block">Reglas Personalizadas</label>
                        <div className="flex gap-2 mb-4">
                            <input
                                value={newRule}
                                onChange={(e) => setNewRule(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                className="flex-1 bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none placeholder:text-white/20"
                                placeholder="Escribe una regla y pulsa enter..."
                            />
                            <button
                                onClick={handleAddRule}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition-colors"
                            >
                                Añadir
                            </button>
                        </div>

                        <div className="space-y-2">
                            {(!config.custom_rules || config.custom_rules.length === 0) && (
                                <div className="text-center py-4 text-white/20 text-xs italic border border-dashed border-white/10 rounded-lg">
                                    No hay reglas personalizadas definidas.
                                </div>
                            )}
                            {config.custom_rules?.map((rule, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 group">
                                    <span className="text-sm text-white/80">• {rule}</span>
                                    <button
                                        onClick={() => handleRemoveRule(idx)}
                                        className="text-white/20 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all font-bold"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* 3. Tie Breaker Rules */}
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <AlignLeft className="text-yellow-500" /> Reglas de Desempate
                </h2>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                    <p className="text-white/50 text-sm mb-4">
                        Define el orden de prioridad para desempatar equipos en la Clasificación.
                    </p>

                    {/* Rule List */}
                    <div className="space-y-2">
                        {(() => {
                            const defaultRules = [
                                { type: 'direct_match', label: 'Resultado Directo', desc: 'Si solo hay dos equipos empatados, el que haya ganado en su enfrentamiento directo clasifica primero.' },
                                { type: 'run_diff', label: 'Diferencia de Carreras', desc: '(Carreras anotadas) - (Carreras recibidas). El equipo con mayor diferencia de carreras se clasifica primero.' },
                                { type: 'runs_scored', label: 'Carreras Anotadas', desc: 'Si la diferencia de carreras es igual, gana el equipo que haya anotado más carreras totales.' },
                                { type: 'random', label: 'Sorteo Aleatorio', desc: 'Ideal para simulaciones. Si persiste el empate, se elegirá aleatoriamente quién pasa a la siguiente fase.' }
                            ];

                            // Merge with existing config or default
                            const currentRules = config.tiebreaker_rules && config.tiebreaker_rules.length > 0
                                ? config.tiebreaker_rules
                                : defaultRules.map((r, i) => ({ type: r.type as any, order: i, active: true }));

                            // Sort by order
                            const sortedRules = [...currentRules].sort((a, b) => a.order - b.order);

                            const toggleRule = (index: number) => {
                                const newRules = [...sortedRules];
                                newRules[index].active = !newRules[index].active;
                                updateConfig('tiebreaker_rules', newRules);
                            };

                            const moveRule = (index: number, direction: 'up' | 'down') => {
                                if (direction === 'up' && index === 0) return;
                                if (direction === 'down' && index === sortedRules.length - 1) return;

                                const newRules = [...sortedRules];
                                const targetIndex = direction === 'up' ? index - 1 : index + 1;

                                // Swap orders
                                const tempOrder = newRules[index].order;
                                newRules[index].order = newRules[targetIndex].order;
                                newRules[targetIndex].order = tempOrder;

                                updateConfig('tiebreaker_rules', newRules);
                            };

                            const getRuleInfo = (type: string) => {
                                return defaultRules.find(r => r.type === type) || { label: type, desc: '' };
                            };

                            return sortedRules.map((rule, idx) => {
                                const info = getRuleInfo(rule.type);
                                return (
                                    <div key={rule.type} className={`flex items-start justify-between p-3 rounded-lg border transition-all ${rule.active ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 opacity-50'}`}>
                                        <div className="flex items-start gap-3">
                                            <span className="text-white/30 font-mono text-xs w-6 mt-1">{idx + 1}.</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${rule.active ? 'text-white' : 'text-white/40'}`}>{info.label}</span>
                                                    <div className="group/info relative">
                                                        <Info size={12} className="text-white/30 cursor-help" />
                                                        <div className="absolute left-0 bottom-full mb-2 w-64 bg-black/90 border border-white/10 p-2 rounded text-xs text-white/80 opacity-0 pointer-events-none group-hover/info:opacity-100 transition-opacity z-10 shadow-xl">
                                                            {info.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                                {rule.active && <p className="text-[10px] text-white/40 mt-1 max-w-[300px] leading-tight">{info.desc}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col gap-0.5">
                                                <button onClick={() => moveRule(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white disabled:opacity-30">▲</button>
                                                <button onClick={() => moveRule(idx, 'down')} disabled={idx === sortedRules.length - 1} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white disabled:opacity-30">▼</button>
                                            </div>
                                            <div
                                                onClick={() => toggleRule(idx)}
                                                className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${rule.active ? 'bg-green-500' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${rule.active ? 'left-6' : 'left-1'}`} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>

        </div>
    );
};
