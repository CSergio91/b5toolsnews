import React, { useState } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { Users, Plus, Trash2, Upload, Shield } from 'lucide-react';
import { TournamentTeam } from '../../types/tournament';
import { GlobalImageUploader } from '../GlobalImageUploader';

export const TeamManagementStep: React.FC = () => {
    const { state, teams, addTeam, removeTeam, updateTeam } = useBuilder(); // Note: We need a way to update 'teams' specifically. 
    // Since 'updateConfig' only targets 'config' object in my previous context implementation, 
    // I should probably have updated the context to expose a generic 'updateState' or specific 'updateTeams'.
    // LIMITATION: The current Context only exposes `updateConfig`. I need to fix the Context first or use a hack.
    // FIX: I will use a local state for the UI and assume the Context will be updated to support specific collection updates.
    // For now, let's assume I fix the Context in the next step. I'll write the consuming code correctly.

    // RE-READING CONTEXT: `updateConfig` updates `state.config`. 
    // I need to add `addTeam`, `removeTeam`, `updateTeam` to the Context.

    // TEMPORARY LOCAL MOCK (until Context is patched in next tool call)
    // In reality, I will patch the Context

    const [teamName, setTeamName] = useState('');
    const [shortName, setShortName] = useState('');
    const [logoUrl, setLogoUrl] = useState(''); // State for new team logo

    const handleAdd = () => {
        if (!teamName.trim()) return;
        addTeam({
            id: crypto.randomUUID(), // Temp ID for draft
            name: teamName,
            short_name: shortName || teamName.substring(0, 3).toUpperCase(),
            logo_url: logoUrl,
            wins: 0,
            losses: 0,
            runs_scored: 0,
            runs_allowed: 0
        });
        setTeamName('');
        setShortName('');
        setLogoUrl('');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="text-blue-400" /> Gestión de Equipos
                    </h2>
                    <p className="text-white/50 text-sm mt-1">Añade los equipos que participarán en el torneo.</p>
                </div>
                <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm font-mono">
                    Total: <span className="font-bold text-white">{teams?.length || 0}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-0">

                {/* 1. Add Team Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg">
                        <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Añadir Nuevo Equipo</h3>

                        <div className="flex justify-center mb-4">
                            <GlobalImageUploader
                                currentUrl={logoUrl}
                                onUpload={setLogoUrl}
                                bucketName="team-logos"
                                label="Logo"
                                rounded={true}
                                className="w-20 h-20"
                                localMode={true} // Use local preview
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-white/50 mb-1 ml-1">Nombre del Equipo</label>
                                <input
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="Ej. Los Bravos"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1 ml-1">Abreviatura (Opcional)</label>
                                <input
                                    value={shortName}
                                    onChange={(e) => setShortName(e.target.value.toUpperCase().slice(0, 3))}
                                    placeholder="Ej. BRV"
                                    maxLength={3}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors font-mono uppercase"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAdd}
                            disabled={!teamName.trim()}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
                        >
                            <Plus size={18} /> Añadir Equipo
                        </button>

                        <div className="border-t border-white/10 my-4"></div>

                        <button className="w-full py-3 border border-dashed border-white/20 hover:border-white/40 text-white/50 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                            <Upload size={16} /> Importar CSV / Excel
                        </button>
                    </div>
                </div>

                {/* 2. Team List */}
                <div className="lg:col-span-2 bg-black/20 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
                    <div className="p-4 bg-white/5 border-b border-white/5 grid grid-cols-12 gap-4 text-xs font-bold text-white/40 uppercase">
                        <div className="col-span-1 hidden md:block">No.</div>
                        <div className="col-span-1">Logo</div>
                        <div className="col-span-5">Equipo</div>
                        <div className="col-span-2">Abr</div>
                        <div className="col-span-3 text-right">Acciones</div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {teams?.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-white/20">
                                <Shield size={40} className="mb-2 opacity-20" />
                                <p className="text-sm">No hay equipos registrados</p>
                            </div>
                        )}
                        {teams?.map((team: TournamentTeam, idx: number) => (
                            <div key={team.id || idx} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                <div className="col-span-1 text-white/30 font-mono text-xs hidden md:block">{(idx + 1).toString().padStart(2, '0')}</div>
                                <div className="col-span-1">
                                    <GlobalImageUploader
                                        currentUrl={team.logo_url}
                                        onUpload={(url) => updateTeam(team.id, { logo_url: url })}
                                        bucketName="team-logos"
                                        label="Logo"
                                        rounded={true}
                                        className="w-10 h-10"
                                        localMode={true}
                                    />
                                </div>
                                <div className="col-span-5 font-bold text-white truncate pl-4">{team.name}</div>
                                <div className="col-span-2 text-xs font-mono text-white/60 bg-white/5 px-2 py-1 rounded w-fit">{team.short_name}</div>
                                <div className="col-span-3 flex justify-end">
                                    <button
                                        onClick={() => removeTeam(team.id)}
                                        className="p-2 text-white/20 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>

    );
};
