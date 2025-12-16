import React, { useEffect, useState } from 'react';
import { X, Copy, Check, RefreshCw, Database, Users, Calendar, Trophy, Settings } from 'lucide-react';

interface DraftDebugModalProps {
    open: boolean;
    onClose: () => void;
}

type StorageKey = 'b5_builder_state' | 'b5_builder_info' | 'b5_builder_teams' | 'b5_builder_matches' | 'b5_builder_participants';

export const DraftDebugModal: React.FC<DraftDebugModalProps> = ({ open, onClose }) => {
    const [activeTab, setActiveTab] = useState<StorageKey>('b5_builder_state');
    const [data, setData] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const keys: { id: StorageKey; label: string; icon: React.ReactNode }[] = [
        { id: 'b5_builder_state', label: 'Estado Maestro', icon: <Database size={14} /> },
        { id: 'b5_builder_info', label: 'Info', icon: <Settings size={14} /> },
        { id: 'b5_builder_teams', label: 'Equipos', icon: <Users size={14} /> },
        { id: 'b5_builder_matches', label: 'Bracket/Partidos', icon: <Trophy size={14} /> },
        { id: 'b5_builder_participants', label: 'Participantes', icon: <Calendar size={14} /> },
    ];

    const loadData = () => {
        try {
            const stored = localStorage.getItem(activeTab);
            setData(stored ? JSON.parse(stored) : null);
        } catch (e) {
            setData({ error: 'Error parsing JSON', raw: localStorage.getItem(activeTab) });
        }
    };

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open, activeTab]);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- Human View Renderers ---

    const renderHumanViewConfig = (config: any) => (
        <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-icons-round text-yellow-500">emoji_events</span>
                    {config.name || 'Sin Nombre'}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <span className="text-white/40 uppercase text-[10px] font-bold tracking-wider">Fechas</span>
                        <span className="text-white font-mono">{config.start_date || '--'} / {config.end_date || '--'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-white/40 uppercase text-[10px] font-bold tracking-wider">Ubicación</span>
                        <span className="text-white">{config.location || 'Sin Ubicación'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-white/40 uppercase text-[10px] font-bold tracking-wider">Tipo</span>
                        <span className="text-white capitalize">{config.tournament_type || 'Open'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-white/40 uppercase text-[10px] font-bold tracking-wider">Sets</span>
                        <span className="text-white text-xl font-bold">{config.sets_per_match || 3}</span>
                    </div>
                </div>
            </div>
            {/* Fields List */}
            {config.fields && config.fields.length > 0 && (
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h4 className="border-b border-white/10 pb-2 mb-4 text-sm font-bold text-white/50 uppercase tracking-widest">Campos de Juego</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {config.fields.map((f: any, i: number) => (
                            <div key={i} className="p-2 bg-black/20 rounded border border-white/5 text-xs text-white flex items-center gap-2">
                                <span className="material-icons-round text-green-500 text-sm">stadium</span>
                                {f.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderHumanViewTeams = (teams: any) => {
        if (!Array.isArray(teams)) {
            return (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs">
                    <p className="font-bold mb-2">Error de Formato</p>
                    <p>Se esperaba un Array de equipos, pero se recibió: {typeof teams}</p>
                    <pre className="mt-2 bg-black/20 p-2 rounded">{JSON.stringify(teams, null, 2)}</pre>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 gap-3">
                {teams.map((team: any, i: number) => (
                    <div key={team.id || i} className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-xl border border-white/5 flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center overflow-hidden border border-white/10 shrink-0"
                            style={{ borderColor: team.color }}
                        >
                            {team.logo_url ? (
                                <img src={team.logo_url} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-white/30">{team.name?.substring(0, 2)}</span>
                            )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-white truncate">{team.name || 'Sin Nombre'}</span>
                            <span className="text-[10px] font-mono text-white/40 truncate">{(team.id || '').substring(0, 8)}...</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderHumanViewMatches = (data: any) => {
        const matches = Array.isArray(data) ? data : data.matches || [];
        const structure = !Array.isArray(data) ? data.structure : null;
        const fields = !Array.isArray(data) ? data.fields : null;

        return (
            <div className="space-y-6">
                {fields && (
                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3">
                        <span className="material-icons-round text-blue-400">info</span>
                        <span className="text-sm text-blue-200 font-medium">Incluye Configuración de {fields.length} Campos</span>
                    </div>
                )}

                {matches.length > 0 ? (
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest sticky top-0 bg-[#1a1a20] py-2">Lista de Partidos ({matches.length})</h4>
                        {matches.map((m: any, i: number) => (
                            <div key={i} className="flex flex-col bg-white/5 p-3 rounded border border-white/5">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-white/50 font-mono">{m.start_time || 'TBD'} | {m.date || 'TBD'}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">{m.court || m.location || 'Sin Campo'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-white">
                                    <span>{m.team1_id ? 'Equipo 1' : 'TBD'}</span>
                                    <span className="text-white/20 text-xs px-2">VS</span>
                                    <span>{m.team2_id ? 'Equipo 2' : 'TBD'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 text-white/30 text-sm">No hay partidos generados aún.</div>
                )}
            </div>
        );
    };

    const renderHumanViewParticipants = (data: any) => (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-2xl font-bold text-white">{data.rosters?.length || 0}</span>
                    <span className="text-[10px] uppercase text-purple-300">Jugadores</span>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-2xl font-bold text-white">{data.referees?.length || 0}</span>
                    <span className="text-[10px] uppercase text-orange-300">Árbitros</span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex flex-col items-center">
                    <span className="text-2xl font-bold text-white">{data.admins?.length || 0}</span>
                    <span className="text-[10px] uppercase text-blue-300">Admins</span>
                </div>
            </div>

            {data.referees?.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Lista de Árbitros</h4>
                    {data.referees.map((r: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded border border-white/5">
                            <span className="text-sm text-white">{r.name}</span>
                            <span className="text-[10px] text-white/40">{r.email}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderHumanViewState = (state: any) => {
        if (!state) return null;

        // --- Data Enrichment & Processing ---
        const config = state.config || {};
        const rawTeams = state.teams || [];
        const rawMatches = state.matches || [];
        const rosters = state.rosters || [];

        // 1. Enrich Teams with Rosters
        const teams = rawTeams.map((t: any) => ({
            ...t,
            players: rosters.filter((r: any) => r.team_id === t.id)
        }));

        // 2. Split Matches by Phase (Group vs Elimination)
        // Heuristic: If stage_id is 'group' or undefined, count as group. Else elimination.
        const groupMatches = rawMatches.filter((m: any) => !m.stage_id || m.stage_id.includes('group'));
        const playoffMatches = rawMatches.filter((m: any) => m.stage_id && !m.stage_id.includes('group'));

        // 3. Stats Calculation
        const totalDurationMinutes = rawMatches.reduce((acc: number, m: any) => acc + (m.duration || 60), 0);
        const avgDuration = rawMatches.length ? Math.round(totalDurationMinutes / rawMatches.length) : 0;

        // 4. Fields Extraction (Robust)
        // Combine configured fields AND any field found in matches to ensure nothing is hidden
        const configFields = (config.fields || []).map((f: any) => f.name);
        const matchFields = rawMatches.map((m: any) => m.field).filter((f: any) => f);
        // Unique union of all fields
        const allFields = Array.from(new Set([...configFields, ...matchFields])).sort();

        // Helper: Team Name Lookup
        const getTeamName = (id: string) => {
            const t = teams.find((team: any) => team.id === id);
            return t ? t.name : (id ? 'TBD' : 'Bye');
        };

        // Helper: Team Abbr Lookup
        const getTeamAbbr = (id: string) => {
            const t = teams.find((team: any) => team.id === id);
            return t?.short_name || t?.name?.substring(0, 3).toUpperCase() || 'TBD';
        }

        // Group matches by Field
        const matchesByField: Record<string, any[]> = {};
        allFields.forEach((f: string) => { matchesByField[f] = [] });

        // Also track unassigned
        const unassignedMatches: any[] = [];

        rawMatches.forEach((m: any) => {
            const fieldName = m.field;
            if (fieldName && matchesByField[fieldName]) {
                matchesByField[fieldName].push(m);
            } else {
                unassignedMatches.push(m);
            }
        });

        // Add 'Sin Asignar' if we have unassigned matches
        if (unassignedMatches.length > 0) {
            allFields.push('Sin Asignar');
            matchesByField['Sin Asignar'] = unassignedMatches;
        }

        return (
            <div className="h-full flex flex-col gap-8 pb-12">

                {/* --- 1. HERO HEADER --- */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40 opacity-50" />
                    <div className="relative p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-500 border border-yellow-500/20">
                                    {config.tournament_type || 'Open'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/20">
                                    {config.sets_per_match || 3} Sets
                                </span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white leading-none tracking-tight mb-2">
                                {config.name || 'Torneo Sin Nombre'}
                            </h2>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    <span>{config.start_date || 'TBD'} - {config.end_date || 'TBD'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="material-icons-round text-sm">place</span>
                                    <span>{config.location || 'Sin Ubicación'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Stats */}
                        <div className="flex gap-4">
                            <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                                <span className="block text-2xl font-bold text-white">{teams.length}</span>
                                <span className="text-[10px] uppercase text-white/40 font-bold">Equipos</span>
                            </div>
                            <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                                <span className="block text-2xl font-bold text-white">{rawMatches.length}</span>
                                <span className="text-[10px] uppercase text-white/40 font-bold">Partidos</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 2. STATS & CONFIG SUMMARY --- */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-24 relative overflow-hidden group hover:bg-white/10 transition-colors">
                        <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest z-10">Fase de Grupos</span>
                        <span className="text-3xl font-bold text-white z-10">{groupMatches.length} <span className="text-sm font-normal text-white/30">partidos</span></span>
                        <Database className="absolute bottom-[-10px] right-[-10px] text-white/5 group-hover:text-white/10 transition-colors" size={64} />
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4 rounded-xl border border-yellow-500/20 flex flex-col justify-between h-24 relative overflow-hidden">
                        <span className="text-[10px] uppercase font-bold text-yellow-500/70 tracking-widest z-10">Playoffs</span>
                        <span className="text-3xl font-bold text-white z-10">{playoffMatches.length} <span className="text-sm font-normal text-white/30">partidos</span></span>
                        <Trophy className="absolute bottom-[-10px] right-[-10px] text-yellow-500/10" size={64} />
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-24">
                        <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Sets Config</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-white">{config.sets_per_match || 3}</span>
                            <span className="text-xs text-white/30 mb-1">sets max</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-24">
                        <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Puntos</span>
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-green-400">+{config.points_for_win || 3}</span>
                                <span className="text-[8px] text-white/30 uppercase">Victoria</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-xl font-bold text-red-400">{config.points_for_loss || 0}</span>
                                <span className="text-[8px] text-white/30 uppercase">Derrota</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 2.5 FIELD SCHEDULE (RESTORED) --- */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-icons-round text-sm text-green-400">stadium</span>
                            Distribución por Canchas
                        </h3>
                        <span className="text-xs text-white/40">{allFields.length} Canchas Detectadas</span>
                    </div>

                    {allFields.length === 0 ? (
                        <div className="p-4 border border-dashed border-white/10 rounded-xl text-center text-white/30 text-xs">
                            Sin información de canchas.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {allFields.map((field: string) => (
                                <div key={field} className="bg-[#15151a] border border-white/5 rounded-xl overflow-hidden flex flex-col">
                                    <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                                        <span className="font-bold text-white text-sm flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                            {field}
                                        </span>
                                        <span className="text-[10px] text-white/40 font-mono bg-black/20 px-2 py-0.5 rounded">
                                            {matchesByField[field]?.length || 0} Partidos
                                        </span>
                                    </div>
                                    <div className="p-2 space-y-2 min-h-[50px]">
                                        {matchesByField[field]?.length > 0 ? (
                                            matchesByField[field]?.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')).map((m: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3 p-2 rounded bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group">
                                                    <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-white/5 pr-3">
                                                        <span className="text-xs font-bold text-white font-mono">{m.start_time || '--:--'}</span>
                                                    </div>
                                                    <div className="flex-1 flex flex-col gap-1">
                                                        <div className="flex justify-between items-center text-xs text-white/90">
                                                            <span className={!m.team1_id ? 'text-white/40 italic' : ''}>{getTeamAbbr(m.team1_id)}</span>
                                                            <span className="text-[10px] text-white/30">vs</span>
                                                            <span className={!m.team2_id ? 'text-white/40 italic' : ''}>{getTeamAbbr(m.team2_id)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center justify-center text-white/10 text-xs italic py-2">
                                                Libre
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- 3. TIMELINE / CALENDAR --- */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2">
                        <Calendar size={16} className="text-green-400" /> Calendario Oficial
                    </h3>

                    {rawMatches.length === 0 ? (
                        <div className="p-8 text-center text-white/30 text-sm border-2 border-dashed border-white/5 rounded-xl">
                            Aún no se han generado partidos.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {/* Group Stage Section */}
                            {groupMatches.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Fase de Grupos</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {groupMatches.sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || '')).map((m: any, idx: number) => (
                                            <div key={idx} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-3 flex flex-col gap-2 group transition-all">
                                                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white font-mono">{m.start_time || 'TBD'}</span>
                                                        <span className="text-[10px] text-white/30 font-mono">{m.date || 'Sin Fecha'}</span>
                                                    </div>
                                                    <div className="bg-black/30 px-2 py-0.5 rounded text-[10px] text-white/50 font-mono text-right flex flex-col items-end">
                                                        <span>{m.field || 'Cancha TBD'}</span>
                                                        <span className="text-[8px] text-white/20">Grupo {m.stage_id ? m.stage_id.split('_').pop() : 'A'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1.5 pt-1">
                                                    <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-1 h-4 bg-blue-500/50 rounded-full"></span>
                                                            <span className="text-xs font-bold text-white">{getTeamName(m.team1_id)}</span>
                                                        </div>
                                                        {m.score_text && <span className="font-mono text-sm font-bold text-yellow-400">{m.score_text.split('-')[0]}</span>}
                                                    </div>
                                                    <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-1 h-4 bg-red-500/50 rounded-full"></span>
                                                            <span className="text-xs font-bold text-white">{getTeamName(m.team2_id)}</span>
                                                        </div>
                                                        {m.score_text && <span className="font-mono text-sm font-bold text-yellow-400">{m.score_text.split('-')[1]}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Playoffs Section */}
                            {playoffMatches.length > 0 && (
                                <div className="space-y-3 mt-4">
                                    <div className="flex items-center gap-2 px-2 border-t border-white/10 pt-6">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                        <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Fase Final (Playoffs)</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {playoffMatches.map((m: any, idx: number) => (
                                            <div key={idx} className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-1 bg-yellow-500/20 rounded-bl-lg text-[8px] font-bold text-yellow-200 uppercase tracking-widest">
                                                    {m.stage_id || 'Eliminatoria'}
                                                </div>

                                                <div className="flex flex-col items-center min-w-[60px] border-r border-yellow-500/20 pr-4">
                                                    <span className="text-lg font-black text-white font-mono">{m.start_time || 'TBD'}</span>
                                                    <span className="text-[10px] text-yellow-200/60 uppercase">{m.field || 'Central'}</span>
                                                </div>

                                                <div className="flex-1 px-4 flex flex-col gap-2">
                                                    <div className="flex justify-between items-center text-sm font-bold text-white">
                                                        <span>{getTeamName(m.team1_id)}</span>
                                                        <span className="text-white/20 italic text-xs">vs</span>
                                                        <span>{getTeamName(m.team2_id)}</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-yellow-500 w-1/2 opacity-50"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* --- 4. TEAMS & ROSTERS --- */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2">
                        <Users size={16} className="text-blue-400" /> Equipos Registrados
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {teams.map((t: any, i: number) => (
                            <div key={i} className="bg-[#15151a] border border-white/5 rounded-xl overflow-hidden flex flex-col group hover:border-white/20 transition-all">
                                <div className="p-3 bg-white/5 border-b border-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center overflow-hidden border border-white/10 shadow-sm shrink-0"
                                        style={{ borderColor: t.color || '#333' }}>
                                        {t.logo_url ? <img src={t.logo_url} className="w-full h-full object-cover" /> : <span className="font-bold text-white/40 text-xs">{t.short_name || '??'}</span>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white text-sm">{t.name}</span>
                                        <span className="text-[10px] text-white/40 uppercase tracking-widest">{t.players?.length || 0} Jugadores</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-black/20 flex-1">
                                    {t.players && t.players.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {t.players.map((p: any, idx: number) => (
                                                <span key={idx} className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-white/70 flex items-center gap-1">
                                                    <span className="text-white/30 font-bold">#{p.number || '-'}</span> {p.first_name} {p.last_name?.charAt(0)}.
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-[10px] text-white/20 italic py-2">Sin jugadores registrados</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        );
    };

    const renderHumanView = () => {
        if (!data) return <div className="text-white/30 text-sm p-8 text-center">Sin datos para visualizar</div>;

        switch (activeTab) {
            case 'b5_builder_info': return renderHumanViewConfig(data);
            case 'b5_builder_teams': return renderHumanViewTeams(data);
            case 'b5_builder_matches': return renderHumanViewMatches(data);
            case 'b5_builder_participants': return renderHumanViewParticipants(data);
            case 'b5_builder_state': return renderHumanViewState(data);
            default: return <div className="text-white/30 text-sm p-8">Vista humana no disponible para esta clave.</div>;
        }
    };


    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a20] border border-white/10 rounded-2xl w-[95vw] h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">

                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#111] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <span className="material-icons-round text-yellow-500 text-lg">bug_report</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Inspector de Borrador</h3>
                            <div className="text-[10px] text-white/40 uppercase tracking-widest">Local Storage Debugger</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 p-2 bg-[#0f0f13] border-b border-white/5 overflow-x-auto shrink-0">
                    {keys.map((k) => (
                        <button
                            key={k.id}
                            onClick={() => setActiveTab(k.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === k.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {k.icon}
                            {k.label}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button
                        onClick={loadData}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg"
                        title="Recargar Datos"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>

                {/* Main Split Content */}
                <div className="flex-1 overflow-hidden flex flex-row">

                    {/* Left: Raw JSON Source (40%) */}
                    <div className="w-[40%] bg-[#0f0f13] border-r border-white/5 flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-white/5 bg-[#0a0a0a] flex justify-between items-center">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-mono">JSON Source</span>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 hover:text-white transition-colors"
                            >
                                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                {copied ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                            {data ? (
                                <pre className="text-[10px] font-mono text-green-400 leading-relaxed whitespace-pre-wrap break-all">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-white/20">
                                    <span className="material-icons-round text-4xl mb-4">data_object</span>
                                    <p className="text-xs">No Data</p>
                                </div>
                            )}
                        </div>
                        {/* Footer Stats */}
                        <div className="h-8 bg-[#0a0a0a] border-t border-white/5 flex items-center px-4 text-[10px] text-white/20 font-mono">
                            <span>Key: {activeTab}</span>
                            <span className="ml-auto">Size: {data ? new Blob([JSON.stringify(data)]).size : 0} bytes</span>
                        </div>
                    </div>

                    {/* Right: Human Readable View (60%) */}
                    <div className="flex-1 bg-gradient-to-br from-[#1a1a20] to-[#111] flex flex-col overflow-hidden relative">
                        <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <span className="material-icons-round text-white/40 text-sm">visibility</span>
                                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest font-mono">Human View</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                            {renderHumanView()}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
