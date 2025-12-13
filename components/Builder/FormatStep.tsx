import React, { useState } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { Trophy, Users, GitBranch, ArrowRight, Shield, LayoutGrid, CheckCircle } from 'lucide-react';

export const FormatStep: React.FC = () => {
    const { state, updateConfig } = useBuilder();

    // Initialize state from Context to ensure persistence
    const [selectedFormat, setSelectedFormat] = useState<'groups' | 'knockout' | 'double_elimination' | null>(() => {
        const type = state.config.tournament_type;
        if (type === 'group_stage') return 'groups';
        if (type === 'knockout') return 'knockout';
        if (type === 'double_elimination') return 'double_elimination';
        return null;
    });

    const [groupsCount, setGroupsCount] = useState(state.config.number_of_groups || 4);

    const handleSelect = (format: 'groups' | 'knockout' | 'double_elimination') => {
        setSelectedFormat(format);
        // Map to DB schema types roughly, or store as metadata
        updateConfig('tournament_type', format === 'groups' ? 'group_stage' : format);
        // Since schema has 'open' | 'invitational', we might need to store format config in a JSON column or new field. 
        // For now, let's assume 'tournament_type' in our UI logic maps to this.

        // Pass extra config for groups
        if (format === 'groups') {
            updateConfig('number_of_groups', groupsCount);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Formato de Competición
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Option 1: Groups + Playoff */}
                <button
                    onClick={() => handleSelect('groups')}
                    className={`group relative overflow-hidden p-6 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] ${selectedFormat === 'groups'
                        ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-blue-600/5 shadow-[0_0_40px_rgba(59,130,246,0.3)]'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                        }`}
                >
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                            <LayoutGrid size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Grupos + Playoff</h3>
                        <p className="text-sm text-white/50 leading-relaxed">
                            Fase de grupos (Round Robin) seguida de una llave de eliminación.
                        </p>
                    </div>
                </button>

                {/* Option 2: Single Elimination */}
                <button
                    onClick={() => handleSelect('knockout')}
                    className={`group relative overflow-hidden p-6 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] ${selectedFormat === 'knockout'
                        ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-purple-600/5 shadow-[0_0_40px_rgba(168,85,247,0.3)]'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                        }`}
                >
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                            <GitBranch size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Eliminación Directa</h3>
                        <p className="text-sm text-white/50 leading-relaxed">
                            Formato de llave clásica (Bracket). Quien pierde queda fuera.
                        </p>
                    </div>
                </button>

                {/* Option 3: Double Elimination */}
                <button
                    onClick={() => handleSelect('double_elimination')}
                    className={`group relative overflow-hidden p-6 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] ${selectedFormat === 'double_elimination'
                        ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-orange-600/5 shadow-[0_0_40px_rgba(249,115,22,0.3)]'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                        }`}
                >
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Doble Eliminación</h3>
                        <p className="text-sm text-white/50 leading-relaxed">
                            Los perdedores van a un "Losers Bracket" y tienen una segunda oportunidad.
                        </p>
                    </div>
                </button>
            </div>

            {/* Config Panel for Groups */}
            {selectedFormat === 'groups' && (
                <div className="mb-6 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl animate-in slide-in-from-top-2">
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

            <div className="p-6 rounded-2xl border border-white/10 bg-black/20 mt-auto">
                <h4 className="font-bold text-white mb-3">Resumen de Generación</h4>
                <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                        <Users size={16} /> {state.teams.length} Equipos
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>
                    <div className="flex items-center gap-2">
                        <Trophy size={16} />
                        {selectedFormat === 'groups' ? `Fase de Grupos (${groupsCount}) + Playoff` :
                            selectedFormat === 'knockout' ? 'Eliminación Directa' :
                                selectedFormat === 'double_elimination' ? 'Doble Eliminación' : 'Selecciona un formato'}
                    </div>
                </div>
            </div>
        </div>
    );
};
