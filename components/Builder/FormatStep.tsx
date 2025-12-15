import React, { useState } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { Trophy, LayoutGrid, Clock, Users, CheckCircle } from 'lucide-react';

export const FormatStep: React.FC = () => {
    const { state, updateConfig } = useBuilder();
    const config = state.config;

    const [groupsCount, setGroupsCount] = useState(config.number_of_groups || 4);

    const types = [
        { id: 'groups', label: 'Grupos + Playoff', icon: <LayoutGrid size={24} />, desc: 'Fase de grupos (Round Robin) seguida de una llave de eliminación.' },
    ];

    const handleSelectType = (id: string) => {
        updateConfig('tournament_type', id);
        // If 'groups' is selected, ensure number_of_groups is set
        if (id === 'groups') {
            updateConfig('number_of_groups', groupsCount);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Formato de Competición
            </h2>

            {/* Active Formats */}
            <div className="grid grid-cols-1 gap-6 mb-8">
                {types.map(t => (
                    <button
                        key={t.id}
                        onClick={() => handleSelectType(t.id)}
                        className={`group relative overflow-hidden p-6 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.01] ${config.tournament_type === t.id
                            ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-yellow-500/50'
                            }`}
                    >
                        <div className="flex items-start gap-4 reltative z-10">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${config.tournament_type === t.id
                                ? 'bg-yellow-500 text-black'
                                : 'bg-white/10 text-white/50'
                                }`}>
                                {t.icon}
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold mb-1 ${config.tournament_type === t.id ? 'text-white' : 'text-white/80'}`}>
                                    {t.label}
                                </h3>
                                <p className="text-sm text-white/50 leading-relaxed max-w-2xl">
                                    {t.desc}
                                </p>
                            </div>
                        </div>
                        {config.tournament_type === t.id && (
                            <div className="absolute top-4 right-4 text-yellow-500">
                                <CheckCircle size={20} />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Config Panel for Groups (Moved Up) */}
            {config.tournament_type === 'groups' && (
                <div className="mb-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl animate-in slide-in-from-top-2">
                    <h4 className="font-bold text-white mb-4">Configuración de Fase de Grupos</h4>
                    <div className="flex items-center gap-6">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Número de Grupos</label>
                            <input
                                type="range"
                                min="1" max="8"
                                value={groupsCount}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setGroupsCount(val);
                                    updateConfig('number_of_groups', val);
                                }}
                                className="w-full h-2 bg-blue-500/20 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="w-16 h-16 bg-black/40 rounded-xl flex items-center justify-center text-2xl font-bold text-white border border-white/10">
                            {groupsCount}
                        </div>
                        <div className="text-sm text-white/40 max-w-[200px]">
                            {state.teams.length > 0 ? (
                                <>
                                    ~{Math.ceil(state.teams.length / groupsCount)} equipos por grupo.
                                </>
                            ) : "Añade equipos para ver distribución."}
                        </div>
                    </div>
                </div>
            )}

            {/* Marketplace / Templates Section */}
            <div>
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LayoutGrid size={14} /> Plantillas Disponibles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            label: 'Eliminación Directa',
                            icon: <Trophy size={20} />,
                            desc: 'Formato clásico de llaves (Bracket). El que pierde queda fuera.',
                            color: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400',
                            iconBg: 'bg-purple-500/20'
                        },
                        {
                            label: 'Doble Eliminación',
                            icon: <Trophy size={20} />,
                            desc: 'Incluye llave de perdedores (Losers Bracket) para una segunda oportunidad.',
                            color: 'from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400',
                            iconBg: 'bg-orange-500/20'
                        },
                        {
                            label: 'Fase de Grupos Avanzada',
                            icon: <LayoutGrid size={20} />,
                            desc: 'Dos rondas de grupos consecutivas antes de las finales.',
                            color: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400',
                            iconBg: 'bg-cyan-500/20'
                        },
                    ].map((template, idx) => (
                        <div key={idx} className={`p-5 rounded-xl border bg-gradient-to-br transition-all relative overflow-hidden group hover:opacity-100 opacity-70 grayscale hover:grayscale-0 ${template.color}`}>
                            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-[10px] uppercase font-bold px-2 py-1 rounded border border-white/10 text-white/70 group-hover:bg-white/10 group-hover:text-white transition-colors cursor-help">
                                Próximamente
                            </div>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${template.iconBg} ${template.color.split(' ').pop()}`}>
                                {template.icon}
                            </div>
                            <h4 className="font-bold text-white mb-1">{template.label}</h4>
                            <p className="text-xs text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">
                                {template.desc}
                            </p>
                        </div>
                    ))}

                    {/* General specific Coming Soon placeholder */}
                    <div className="p-5 rounded-xl border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-center gap-2 opacity-50 hover:opacity-80 transition-opacity cursor-not-allowed">
                        <Clock size={20} className="text-white/20" />
                        <span className="text-xs text-white/30 font-medium">Más plantillas en camino...</span>
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-black/20 mt-auto">
                <h4 className="font-bold text-white mb-3">Resumen de Generación</h4>
                <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                        <Users size={16} /> {state.teams.length} Equipos
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>
                    <div className="flex items-center gap-2">
                        <Trophy size={16} />
                        {config.tournament_type === 'groups' ? `Fase de Grupos (${groupsCount}) + Playoff` :
                            config.tournament_type === 'free' ? 'Manual / Libre' :
                                'Selecciona un formato'}
                    </div>
                </div>
            </div>
        </div>
    );
};
