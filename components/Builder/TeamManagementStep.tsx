import React, { useState } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { Users, Plus, Trash2, Upload, Shield, Image as ImageIcon } from 'lucide-react';
import { TournamentTeam } from '../../types/tournament';
import { GlobalImageUploader } from '../GlobalImageUploader';

export const TeamManagementStep: React.FC = () => {
    const { state, teams, addTeam, removeTeam, updateTeam } = useBuilder();

    const [teamName, setTeamName] = useState('');
    const [shortName, setShortName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    const handleAdd = () => {
        if (!teamName.trim()) return;
        addTeam({
            id: crypto.randomUUID(),
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-2">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <Users className="text-blue-400" /> Gestión de Equipos
                    </h2>
                    <p className="text-white/50 text-xs md:text-sm mt-1">Añade los equipos que participarán en el torneo.</p>
                </div>
                <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm font-mono w-full md:w-auto text-center md:text-left">
                    Total: <span className="font-bold text-white">{teams?.length || 0}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full min-h-0 overflow-y-auto lg:overflow-visible pb-20 lg:pb-0">

                {/* 1. Add Team Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/5 p-4 md:p-6 rounded-2xl border border-white/10 shadow-lg">
                        <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Añadir Nuevo Equipo</h3>

                        <div className="flex justify-center mb-4">
                            <GlobalImageUploader
                                currentUrl={logoUrl}
                                onUpload={setLogoUrl}
                                bucketName="team-logos"
                                label="Logo"
                                rounded={true}
                                className="w-20 h-20"
                                localMode={true}
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
                <div className="lg:col-span-2 bg-black/20 rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[500px] lg:h-auto">
                    {/* Desktop Header - Hidden on Mobile */}
                    <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-white/5 border-b border-white/5 text-xs font-bold text-white/40 uppercase">
                        <div className="col-span-1">No.</div>
                        <div className="col-span-1">Logo</div>
                        <div className="col-span-5">Equipo</div>
                        <div className="col-span-2">Abr</div>
                        <div className="col-span-3 text-right">Acciones</div>
                    </div>

                    {/* Header for Mobile only */}
                    <div className="md:hidden p-4 bg-white/5 border-b border-white/5 text-xs font-bold text-white/40 uppercase">
                        Lista de Equipos
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 lg:space-y-1 custom-scrollbar">
                        {teams?.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-white/20">
                                <Shield size={40} className="mb-2 opacity-20" />
                                <p className="text-sm">No hay equipos registrados</p>
                            </div>
                        )}
                        {teams?.map((team: TournamentTeam, idx: number) => (
                            <div key={team.id || idx} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-white/5 transition-colors group bg-white/[0.02] md:bg-transparent border border-white/5 md:border-transparent">

                                {/* Mobile Layout: Logo + Name takes up everything */}
                                {/* Desktop Layout: Respects the columns */}

                                <div className="hidden md:block col-span-1 text-white/30 font-mono text-xs">{(idx + 1).toString().padStart(2, '0')}</div>

                                {/* Logo: Always visible, but formatting differs */}
                                <div className="col-span-3 md:col-span-1 flex justify-center md:justify-start">
                                    <GlobalImageUploader
                                        currentUrl={team.logo_url}
                                        onUpload={(url) => updateTeam(team.id, { logo_url: url })}
                                        bucketName="team-logos"
                                        label=""
                                        rounded={true}
                                        className="w-12 h-12 md:w-10 md:h-10"
                                        localMode={true}
                                    />
                                </div>

                                {/* Team Name: Stacked on mobile */}
                                <div className="col-span-7 md:col-span-5 flex flex-col md:flex-row md:items-center pl-0 md:pl-4">
                                    <span className="font-bold text-white truncate text-sm md:text-base">{team.name}</span>
                                    {/* Short Name shown below name on mobile */}
                                    <span className="md:hidden text-xs font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded w-fit mt-1">{team.short_name}</span>
                                </div>

                                {/* Short Name: Hidden on mobile (moved to above), visible on desktop */}
                                <div className="hidden md:block col-span-2 text-xs font-mono text-white/60 bg-white/5 px-2 py-1 rounded w-fit">{team.short_name}</div>

                                {/* Actions */}
                                <div className="col-span-2 md:col-span-3 flex justify-end">
                                    <button
                                        onClick={() => removeTeam(team.id)}
                                        className="p-2 text-white/20 hover:text-red-400 transition-colors bg-white/5 md:bg-transparent rounded-lg md:rounded-none"
                                    >
                                        <Trash2 size={18} />
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
