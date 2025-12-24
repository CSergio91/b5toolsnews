
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserNavbar } from '../components/UserNavbar';
import { ParticlesBackground } from '../components/ParticlesBackground';
import { ArrowLeft, Award, Calendar, ChevronDown, Info, MapPin, Play, RefreshCcw, Search, Trophy, Users, BookOpen, Clock, Notebook, Loader2, Layout, CheckCircle, Check, X, Download, Flag, RefreshCw, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tournament, TournamentTeam, TournamentMatch, TournamentSet, TournamentStage } from '../types/tournament';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { OfficialScoreKeeper } from '../components/OfficialScoreKeeper';
import { generateMatchReport } from '../utils/pdfGenerator';

export const TournamentStartDashboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [stages, setStages] = useState<TournamentStage[]>([]);
    const [activeStageId, setActiveStageId] = useState<string | null>(null);
    const [teams, setTeams] = useState<TournamentTeam[]>([]);
    const [matches, setMatches] = useState<TournamentMatch[]>([]);
    const [sets, setSets] = useState<TournamentSet[]>([]);
    const [rosters, setRosters] = useState<any[]>([]);
    const [fields, setFields] = useState<any[]>([]);
    const [referees, setReferees] = useState<any[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'teams'>('matches');
    const [expandedTeams, setExpandedTeams] = useState<string[]>([]);
    const [startMatchModal, setStartMatchModal] = useState<{ isOpen: boolean, match: any, setNumber: number } | null>(null);
    const [isPublicLive, setIsPublicLive] = useState(false);
    const [showPublicModal, setShowPublicModal] = useState(false);
    const [publicPageName, setPublicPageName] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTournamentData();
            // Auto-refresh every 30 seconds
            const interval = setInterval(() => {
                fetchTournamentData(true);
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [id]);

    const fetchTournamentData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Fetch Tournament
            const { data: tData } = await supabase.from('tournaments').select('*').eq('id', id).single();
            if (tData) setTournament(tData);

            // Fetch Phases (NEW Normalized)
            const { data: pData } = await supabase.from('tournament_phases').select('*').eq('tournament_id', id).order('phase_order', { ascending: true });
            let finalStages = pData?.map(p => ({
                id: p.phase_id,
                name: p.name,
                type: p.type,
                order: p.phase_order
            })) || [];


            // Fallback to structure JSON if still nothing
            if (finalStages.length === 0 && tData?.structure?.phases) {
                finalStages = tData.structure.phases;
            } else if (finalStages.length === 0 && tData?.structure?.stages) {
                finalStages = tData.structure.stages;
            }

            setStages(finalStages);
            if (finalStages.length > 0) setActiveStageId(finalStages[0].id);

            // ... (Fetch Teams remains in public) ...
            const { data: tmData } = await supabase.from('tournament_teams').select('*').eq('tournament_id', id);
            let finalTeams = tmData || [];
            if (finalTeams.length === 0 && tData?.structure?.teams) {
                finalTeams = tData.structure.teams.map((t: any) => ({
                    ...t,
                    wins: t.wins || 0,
                    losses: t.losses || 0,
                    runs_scored: t.runs_scored || 0,
                    runs_allowed: t.runs_allowed || 0
                }));
            }
            setTeams(finalTeams);

            // Fetch Fields
            const { data: fData } = await supabase.from('tournament_fields').select('*').eq('tournament_id', id);
            setFields(fData || []);

            // Fetch Referees
            const { data: rData } = await supabase.from('tournament_referees').select('*').eq('tournament_id', id);
            if (rData && rData.length > 0) {
                const refIds = rData.map(r => r.referee_id);
                const { data: profiles } = await supabase.from('referee_profiles').select('*').in('id', refIds);
                const mergedRefs = rData.map(r => {
                    const profile = profiles?.find(p => p.id === r.referee_id);
                    return { ...r, ...profile };
                });
                setReferees(mergedRefs);
            } else {
                setReferees([]);
            }

            // Fetch Matches (NEW Normalized)
            const { data: mRelData } = await supabase.from('tournament_matches').select('*').eq('tournament_id', id);
            let finalMatches = mRelData?.map(m => ({
                id: m.id,
                tournament_id: m.tournament_id,
                stage_id: m.phase_id,
                name: m.name,
                status: m.status,
                start_time: m.start_time,
                field: m.field,
                location: m.location,
                referee_id: m.referee_id,
                // Map source IDs to local team IDs for Dashboard logic if needed
                visitor_team_id: m.source_away_type === 'team' ? m.source_away_id : null,
                local_team_id: m.source_home_type === 'team' ? m.source_home_id : null,
                ...m
            })) || [];

            // Fallback to LEGACY Matches
            if (finalMatches.length === 0) {
                const { data: mData } = await supabase.from('tournament_matches').select('*').eq('tournament_id', id);
                finalMatches = mData || [];
            }

            // Fallback to structure JSON
            if (finalMatches.length === 0 && tData?.structure) {
                const struct = tData.structure;
                if (struct.matches) {
                    finalMatches = struct.matches;
                } else if (struct.phases) {
                    const allMatches: any[] = [];
                    struct.phases.forEach((p: any) => {
                        if (p.matches) allMatches.push(...p.matches);
                        if (p.groups) p.groups.forEach((g: any) => {
                            if (g.matches) allMatches.push(...g.matches);
                        });
                    });
                    finalMatches = allMatches;
                } else if (struct.stages) {
                    const allMatches: any[] = [];
                    struct.stages.forEach((s: any) => {
                        if (s.matches) allMatches.push(...s.matches);
                    });
                    finalMatches = allMatches;
                }
            }

            setMatches(finalMatches);

            // Fetch Sets (NEW Normalized)
            if (finalMatches.length > 0) {
                const matchIds = finalMatches.map(m => (m as any).match_id || m.id);
                // Include state_json for fallback stats
                const { data: stRelData } = await supabase.from('tournament_sets').select('*, state_json').in('match_id', matchIds);

                if (stRelData && stRelData.length > 0) {
                    setSets(stRelData.map(s => ({
                        ...s,
                        visitor_runs: s.away_score,
                        local_runs: s.home_score,
                        state_json: s.state_json // ensure it's passed through
                    })));
                } else {
                    // Fallback to LEGACY Sets
                    const { data: stData } = await supabase.from('tournament_sets').select('*, state_json').in('match_id', matchIds);
                    if (stData) setSets(stData);
                }
            }

            // Fetch Rosters
            const teamIds = finalTeams.map(t => t.id);
            if (teamIds.length > 0) {
                const { data: rData } = await supabase.from('tournament_rosters').select('*').in('team_id', teamIds);
                if (rData) setRosters(rData);
            }

        } catch (error) {
            console.error("Error loading tournament dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;

        const channel = supabase.channel(`tournament_${id} `)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tournament_sets',
            }, () => {
                fetchTournamentData();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tournament_matches',
            }, () => {
                fetchTournamentData();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tournament_sets',
            }, () => {
                fetchTournamentData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const calculateStandings = () => {
        const stageStandings = teams.map(team => ({
            ...team,
            gp: 0,
            wins: 0,
            losses: 0,
            pts: 0,
            runs_scored: 0,
            runs_allowed: 0
        }));

        matches.forEach(match => {
            if (activeStageId && match.stage_id !== activeStageId) return;

            const matchSets = sets.filter(s => s.match_id === match.id && s.status === 'finished');
            if (matchSets.length === 0) return;

            // Calculate runs regardless of match status
            matchSets.forEach(set => {
                const localTeam = stageStandings.find(t => t.id === match.local_team_id);
                const visitorTeam = stageStandings.find(t => t.id === match.visitor_team_id);

                if (localTeam) {
                    localTeam.runs_scored += set.local_runs;
                    localTeam.runs_allowed += set.visitor_runs;
                }
                if (visitorTeam) {
                    visitorTeam.runs_scored += set.visitor_runs;
                    visitorTeam.runs_allowed += set.local_runs;
                }
            });

            // Determine match winner based on sets (Best of 3)
            if (match.status === 'finished') {
                let localSetWins = 0;
                let visitorSetWins = 0;
                matchSets.forEach(set => {
                    if (set.local_runs > set.visitor_runs) localSetWins++;
                    else if (set.visitor_runs > set.local_runs) visitorSetWins++;
                });

                const localTeam = stageStandings.find(t => t.id === match.local_team_id);
                const visitorTeam = stageStandings.find(t => t.id === match.visitor_team_id);

                if (localTeam && visitorTeam) {
                    localTeam.gp++;
                    visitorTeam.gp++;
                    if (localSetWins > visitorSetWins) {
                        localTeam.wins++;
                        visitorTeam.losses++;
                        localTeam.pts += (tournament?.points_for_win || 1);
                        visitorTeam.pts += (tournament?.points_for_loss || 0);
                    } else if (visitorSetWins > localSetWins) {
                        visitorTeam.wins++;
                        localTeam.losses++;
                        visitorTeam.pts += (tournament?.points_for_win || 1);
                        localTeam.pts += (tournament?.points_for_loss || 0);
                    }
                }
            }
        });

        // Sort by Points, then Run Diff
        return stageStandings.sort((a, b) => {
            if ((b.pts || 0) !== (a.pts || 0)) return (b.pts || 0) - (a.pts || 0);
            const diffA = a.runs_scored - a.runs_allowed;
            const diffB = b.runs_scored - b.runs_allowed;
            return diffB - diffA;
        });
    };

    const toggleTeamExpansion = (teamId: string) => {
        setExpandedTeams(prev =>
            prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
        );
    };

    const handleStartSet = (match: TournamentMatch, setNumber: number) => {
        // Direct navigation for finished sets (Read Only)
        const setRec = sets.find(s => s.match_id === match.id && s.set_number === setNumber);
        if (setRec && setRec.status === 'finished') {
            const teamsSlug = `${match.visitor_team?.name || 'Visitante'}-vs-${match.local_team?.name || 'Local'}`.replace(/\s+/g, '-');
            window.open(`/dashboard/torneos/${match.tournament_id}/Start/ScoreRegister/${teamsSlug}/${match.id}/${setNumber}`, '_blank');
            return;
        }
        setStartMatchModal({ isOpen: true, match, setNumber });
    };

    const [showOfficialScoreKeeper, setShowOfficialScoreKeeper] = useState(false);
    const [activeSetForOfficial, setActiveSetForOfficial] = useState<{ matchId: string, setNumber: number } | null>(null);

    const confirmStartSet = () => {
        if (startMatchModal) {
            // New Implementation: Navigate to Official Page (Verbose Route)
            // /dashboard/torneos/:tournamentId/Start/ScoreRegister/:teamNames/:matchId/:setNumber
            // Construct slug "TeamA-vs-TeamB"
            const teamsSlug = `${startMatchModal.match.visitor_team?.name || 'Visitante'}-vs-${startMatchModal.match.local_team?.name || 'Local'}`.replace(/\s+/g, '-');
            const tournamentId = startMatchModal.match.tournament_id;

            // Update Match Status to 'ongoing' if currently 'scheduled'
            if (startMatchModal.match.status === 'scheduled') {
                supabase.from('tournament_matches')
                    .update({ status: 'live' })
                    .eq('id', startMatchModal.match.id)
                    .then(({ error }) => {
                        if (error) console.error("Error updating match status to ongoing:", error);
                        else {
                            // Optimistic Update locally if needed, but page refresh creates new data anyway or we can fetch.
                            // For now, fire and forget (React Query or reload usually handles it, or explicit refresh).
                            // If we had setMatches logic exposed here we could use it.
                            // Assuming the user navigates away (new tab) and comes back or the dashboard auto-refreshes.
                        }
                    });
            }

            window.open(`/dashboard/torneos/${tournamentId}/Start/ScoreRegister/${teamsSlug}/${startMatchModal.match.id}/${startMatchModal.setNumber}`, '_blank');
            setStartMatchModal(null);
        }
    };

    // --- Render Official Score Keeper if Active ---


    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-blue-400 font-bold tracking-widest uppercase text-xs">Cargando Hub Oficial...</p>
                </div>
            </div>
        );
    }

    const filteredMatches = matches.filter(m => m.stage_id === activeStageId);
    const activeStage = stages.find(s => s.id === activeStageId);

    return (
        <div className="min-h-screen w-full bg-[#0a0a0f] text-white flex flex-col relative overflow-x-hidden">
            <ParticlesBackground />
            <UserNavbar />

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            <main className="flex-1 relative z-10 pt-24 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto w-full">

                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl backdrop-blur-md">
                            {tournament?.logo_url ? (
                                <img src={tournament.logo_url} alt={tournament.name} className="w-full h-full object-contain p-2" />
                            ) : (
                                <Trophy size={48} className="text-white/20" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase tracking-widest border border-green-500/30">Oficial</span>
                                <span className="text-white/40 text-xs">• Hub de Control</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                                {tournament?.name}
                            </h1>
                            <div className="flex items-center gap-4 mt-2 text-white/50 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-blue-400" />
                                    <span>{tournament?.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-purple-400" />
                                    <span>{new Date(tournament?.start_date || '').toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={async () => {
                                if (!confirm("¿ESTÁS SEGURO DE FINALIZAR EL TORNEO?\n\nEsto marcará el torneo como completado. Esta acción no se puede deshacer.")) return;
                                try {
                                    const { error } = await supabase.from('tournaments').update({ status: 'finished' }).eq('id', id);
                                    if (error) throw error;
                                    alert("Torneo finalizado con éxito.");
                                    fetchTournamentData();
                                } catch (e) {
                                    console.error("Error ending tournament:", e);
                                    alert("Error al finalizar el torneo.");
                                }
                            }}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold transition-all flex items-center gap-2 mr-2"
                        >
                            <Flag size={16} /> Finalizar Torneo
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/torneos')}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <ArrowLeft size={16} /> Volver
                        </button>
                        <div className="relative z-50 flex flex-col items-center">
                            <span className={`absolute - top - 4 text - [10px] font - black uppercase tracking - widest transition - colors duration - 300 ${isPublicLive ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'text-white/10'} `}>
                                LIVE
                            </span>
                            <B5BallToggle
                                isActive={isPublicLive}
                                onToggle={() => {
                                    if (!isPublicLive) {
                                        setIsPublicLive(true);
                                        setShowPublicModal(true);
                                    } else {
                                        setIsPublicLive(false);
                                        setShowPublicModal(false);
                                    }
                                }}
                            />
                            <AnimatePresence>
                                {showPublicModal && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="fixed top-32 left-1/2 -translate-x-1/2 w-[90vw] max-w-sm md:absolute md:top-full md:right-0 md:left-auto md:translate-x-0 md:translate-y-0 md:mt-4 md:w-72 z-[100] bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-xl p-4 flex flex-col gap-3 backdrop-blur-xl"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-white">Configurar Página Pública</h3>
                                            <button onClick={() => setShowPublicModal(false)} className="text-white/40 hover:text-white"><X size={14} /></button>
                                        </div>
                                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                            <label className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Nombre del enlace</label>
                                            <div className="flex items-center gap-1 text-xs text-white/40 mb-1">b5tools.com/p/</div>
                                            <input
                                                type="text"
                                                value={publicPageName}
                                                onChange={(e) => setPublicPageName(e.target.value)}
                                                placeholder="mi-torneo"
                                                className="w-full bg-transparent border-none outline-none text-white font-bold text-sm placeholder:text-white/20"
                                            />
                                        </div>
                                        <button onClick={() => setShowPublicModal(false)} className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-black text-white uppercase tracking-wider transition-colors">
                                            Guardar y Publicar
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Main Tabs Navigation */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl w-fit mb-8 border border-white/5 backdrop-blur-md">
                    <TabButton active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={Calendar} label="Partidos" />
                    <TabButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={Users} label="Equipos" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Content based on Tab */}
                    <div className="lg:col-span-8 space-y-6">

                        {activeTab === 'matches' && (
                            <>
                                {/* Phase Selector */}
                                <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                                    {stages.map(stage => (
                                        <button
                                            key={stage.id}
                                            onClick={() => setActiveStageId(stage.id)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${activeStageId === stage.id
                                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20'
                                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                }`}
                                        >
                                            {stage.name}
                                        </button>
                                    ))}

                                    {/* Bracket Update Button (Inline) */}
                                    <div className="w-px h-6 bg-white/10 mx-2" />
                                    <button
                                        onClick={async () => {
                                            setIsUpdating(true);
                                            try {
                                                const { updateBracketProgression } = await import('../utils/bracketLogic');
                                                const res = await updateBracketProgression(supabase, id);
                                                if (res.success) {
                                                    alert(`Llaves actualizadas. ${res.updates} partidos modificados.`);
                                                    fetchTournamentData();
                                                } else {
                                                    throw res.error;
                                                }
                                            } catch (e) {
                                                console.error("Bracket update error:", e);
                                                alert("Error al actualizar llaves.");
                                            } finally {
                                                setIsUpdating(false);
                                            }
                                        }}
                                        disabled={isUpdating}
                                        className={`p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition-all flex items-center justify-center ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Actualizar Llaves (Progreso del Torneo)"
                                    >
                                        <GitBranch size={16} className={isUpdating ? 'animate-pulse' : ''} />
                                    </button>
                                </div>

                                {/* Matches Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredMatches.length > 0 ? (
                                        filteredMatches.map(match => (
                                            <MatchCard
                                                key={match.id}
                                                match={match}
                                                teams={teams}
                                                sets={sets.filter(s => s.match_id === match.id)}
                                                onStartSet={handleStartSet}
                                                tournament={tournament}
                                                fields={fields}
                                                referees={referees}
                                                onRefresh={() => fetchTournamentData(true)}
                                            />
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 bg-white/5 border border-white/10 border-dashed rounded-3xl flex flex-col items-center justify-center text-white/30">
                                            <Calendar size={48} className="mb-4 opacity-20" />
                                            <p className="font-bold">No hay partidos programados en esta fase</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === 'teams' && (
                            <div className="space-y-4">
                                {/* Use calculated stats for display */}
                                {(() => {
                                    // Calculate Team Stats on the fly
                                    const teamsWithStats = teams.map(t => {
                                        const stats = { ab: 0, h: 0, r: 0, e: 0 };

                                        // Aggregate from finished sets
                                        sets.filter(s => s.status === 'finished').forEach(s => {
                                            const isVisitor = (matches.find(m => m.id === s.match_id)?.visitor_team_id === t.id);
                                            const isLocal = (matches.find(m => m.id === s.match_id)?.local_team_id === t.id);

                                            if (!isVisitor && !isLocal) return;

                                            // 1. Core Stats from Columns (Preferred)
                                            if (isVisitor) {
                                                stats.r += (s.away_score ?? s.visitor_runs ?? 0);
                                                stats.h += (s.away_hits ?? s.visitor_hits ?? 0);
                                                stats.e += (s.away_errors ?? s.visitor_errors ?? 0);
                                            } else {
                                                stats.r += (s.home_score ?? s.local_runs ?? 0);
                                                stats.h += (s.home_hits ?? s.local_hits ?? 0);
                                                stats.e += (s.home_errors ?? s.local_errors ?? 0);
                                            }

                                            // 2. AB Calculation (From JSON if available)
                                            // Approximation: H + Out + reached_on_error - sacrifices? 
                                            // Simple parser: Look at all non-empty score slots.
                                            // NOTE: This is a rough approximation if exact AB isn't tracked.
                                            // In OfficialScoreSheet, we count AB as appearances minus BB/HBP/SAC.

                                            // Let's try to extract from JSON state
                                            if (s.state_json) {
                                                const teamJson = isVisitor ? s.state_json.visitorTeam : s.state_json.localTeam;
                                                if (teamJson && teamJson.slots) {
                                                    teamJson.slots.forEach((slot: any) => {
                                                        ['starter', 'sub'].forEach(role => {
                                                            const p = slot[role];
                                                            if (p && p.scores) {
                                                                p.scores.flat().forEach((val: string) => {
                                                                    const v = val.toUpperCase();
                                                                    // Valid AB: H, X (Out), E (Error), KC (Strikeout), F (Fly), etc.
                                                                    // Exclude: BB, HP, SAC (if recorded)
                                                                    // Simple check: if it has content and is NOT BB/HP
                                                                    if (v && v.length > 0 && !['BB', 'HP', 'SF', 'SH'].includes(v)) {
                                                                        stats.ab++;
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    });
                                                }
                                            }
                                        });

                                        return { ...t, stats_ab: stats.ab, stats_h: stats.h, stats_r: stats.r, stats_e_def: stats.e };
                                    });

                                    return teamsWithStats.map(team => (
                                        <div key={team.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md transition-all">
                                            <div className="w-full flex flex-col md:flex-row items-center justify-between p-4 hover:bg-white/5 transition-colors gap-4">
                                                {/* Team Info */}
                                                <div
                                                    onClick={() => toggleTeamExpansion(team.id)}
                                                    className="flex flex-1 items-center gap-4 cursor-pointer w-full"
                                                >
                                                    <div className="w-14 h-14 rounded-full bg-black/40 flex items-center justify-center border-2 border-white/10 shadow-lg overflow-hidden group-hover:border-white/20 transition-all">
                                                        {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover" /> : <Users size={24} className="text-white/20" />}
                                                    </div>
                                                    <div className="text-left flex-1">
                                                        <h3 className="font-black text-lg leading-tight">{team.name}</h3>
                                                        <p className="text-xs text-white/40 uppercase tracking-widest mb-2">{rosters.filter(r => r.team_id === team.id).length} Integrantes</p>

                                                        {/* TEAM STATS ROW */}
                                                        <div className="flex items-center gap-3 overflow-x-auto pb-1">
                                                            {[
                                                                { l: 'AB', v: team.stats_ab },
                                                                { l: 'H', v: team.stats_h },
                                                                { l: 'R', v: team.stats_r },
                                                                { l: 'E', v: team.stats_e_def },
                                                                { l: 'AVG', v: (team.stats_h && team.stats_ab) ? (team.stats_h / team.stats_ab).toFixed(3) : '.000', w: 'w-14', c: 'text-yellow-400' }
                                                            ].map((s, idx) => (
                                                                <div key={idx} className={`flex flex - col items - center bg - black / 20 rounded px - 1.5 py - 0.5 border border - white / 5 ${s.w || 'w-10'} `}>
                                                                    <span className="text-[8px] font-bold text-white/30 uppercase">{s.l}</span>
                                                                    <span className={`text - [10px] font - mono font - bold ${s.c || 'text-white/80'} `}>{s.v || 0}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleTeamExpansion(team.id)}
                                                    className={`p - 2 rounded - lg bg - white / 5 border border - white / 10 transition - transform ${expandedTeams.includes(team.id) ? 'rotate-180' : ''} `}
                                                >
                                                    <ChevronDown size={20} />
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {expandedTeams.includes(team.id) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="border-t border-white/5 bg-[#000]/20"
                                                    >
                                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {rosters.filter(r => r.team_id === team.id).map(player => (
                                                                <div key={player.id} className="flex flex-col gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 overflow-hidden flex items-center justify-center">
                                                                            {player.photo_url ? (
                                                                                <img src={player.photo_url} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <span className="text-sm font-black text-white/10">#{player.number || '00'}</span>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-sm leading-tight">{player.first_name} {player.last_name}</p>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase">#{player.number || '00'}</span>
                                                                                <span className="text-[10px] text-white/40 uppercase tracking-widest">{player.role || 'Jugador'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* PLAYER STATS ROW */}
                                                                    <div className="grid grid-cols-6 gap-1 border-t border-white/5 pt-2">
                                                                        {[
                                                                            { l: 'AB', v: player.stats_ab },
                                                                            { l: 'H', v: player.stats_h },
                                                                            { l: 'R', v: player.stats_r },
                                                                            { l: 'E(D)', v: player.stats_e_def },
                                                                            { l: 'E(O)', v: player.stats_e_of },
                                                                            { l: 'AVE', v: player.stats_ab ? (player.stats_h / player.stats_ab).toFixed(3) : '.000', c: 'text-yellow-400 col-span-1' }
                                                                        ].map((s, idx) => (
                                                                            <div key={idx} className={`flex flex - col items - center bg - black / 20 rounded py - 0.5 ${s.c ? '' : ''} `}>
                                                                                <span className="text-[7px] font-bold text-white/30 uppercase">{s.l}</span>
                                                                                <span className={`text - [9px] font - mono font - bold ${s.c ? 'text-yellow-400' : 'text-white/80'} `}>{s.v || 0}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {rosters.filter(r => r.team_id === team.id).length === 0 && (
                                                                <div className="col-span-full py-8 text-center text-white/20 text-xs italic">
                                                                    No hay jugadores registrados en este roster.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                        {activeTab === 'fields' && (
                            <div className="space-y-6">
                                {(Array.isArray(tournament?.fields_config) ? tournament.fields_config : (tournament?.fields_config?.fields || [])).map((field: any) => {
                                    // Try to find matches either by m.field property OR by checking if match exists in field.items
                                    const fieldMatches = matches.filter(m => {
                                        const isMatchInField = m.field === field.name || m.field === field.id;
                                        const isMatchInItems = field.items?.some((item: any) => item.matchId === m.id);
                                        return isMatchInField || isMatchInItems;
                                    });

                                    return (
                                        <div key={field.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
                                            <div className="p-6 border-b border-white/5 bg-white/5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                                                            <MapPin size={18} />
                                                        </div>
                                                        <h2 className="text-xl font-bold">{field.name}</h2>
                                                    </div>
                                                    <span className="text-xs text-white/40 font-bold uppercase tracking-widest">{fieldMatches.length} Partidos</span>
                                                </div>
                                            </div>
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {fieldMatches
                                                    .sort((a, b) => {
                                                        // Priority to field.items order if possible
                                                        if (field.items) {
                                                            const idxA = field.items.findIndex((i: any) => i.matchId === a.id);
                                                            const idxB = field.items.findIndex((i: any) => i.matchId === b.id);
                                                            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                                        }
                                                        return (a.start_time || '').localeCompare(b.start_time || '');
                                                    })
                                                    .map(match => (
                                                        <MatchCard
                                                            key={match.id}
                                                            match={match}
                                                            teams={teams}
                                                            sets={sets.filter(s => s.match_id === match.id)}
                                                            onStartSet={handleStartSet}
                                                        />
                                                    ))}
                                                {fieldMatches.length === 0 && (
                                                    <div className="col-span-full py-10 text-center text-white/20 italic text-sm">
                                                        No hay partidos planificados en esta cancha.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {(Array.isArray(tournament?.fields_config) ? tournament.fields_config : (tournament?.fields_config?.fields || [])).length === 0 && (
                                    <div className="py-20 bg-white/5 border border-white/10 border-dashed rounded-3xl flex flex-col items-center justify-center text-white/30">
                                        <MapPin size={48} className="mb-4 opacity-20" />
                                        <p className="font-bold">No se han configurado canchas aún</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Right Column: Status Summary */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-gradient-to-br from-blue-600/10 via-purple-900/40 to-blue-900/20 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Info size={120} className="text-white transform rotate-12" />
                            </div>

                            <h2 className="text-xl font-black mb-6 flex items-center gap-2 relative z-10">
                                <Info className="text-blue-400" /> Resumen Torneo
                            </h2>

                            <div className="flex flex-col items-center mb-6 relative z-10">
                                {(() => {
                                    // Calculate Sets Progress manually
                                    // Total Sets = Sum of sets_per_match for all matches (or default 1/3)
                                    // Finished Sets = Count of sets with status 'finished'
                                    const totalSetsExpected = matches.reduce((acc, m) => {
                                        const setNum = m.is_single_set ? 1 : (tournament?.sets_per_match || 1);
                                        // If set_number is explicitly providing the "Best Of" count? 
                                        // Usually sets_per_match is 3 (Best of 3) or 1.
                                        // Let's assume max possible sets (3) or 1.
                                        return acc + (m.set_number ? parseInt(m.set_number.split(' ')[0]) || (m.is_single_set ? 1 : 3) : (m.is_single_set ? 1 : 3));
                                    }, 0);

                                    // Actually a better metric for "Sets Completed" is literally just the sets rows in DB that are finished.
                                    // But we need a denominator. 
                                    // Denominator: Matches * (Sets Per Match). 
                                    // If Best of 3, do we count 3? Or 2-3?
                                    // For progress bar, usually we plan for Max Sets. 
                                    // Let's iterate matches. 

                                    let calcTotalSets = 0;
                                    matches.forEach(m => {
                                        calcTotalSets += (m.is_single_set || tournament?.sets_per_match === 1) ? 1 : 3;
                                    });

                                    const finishedSetsCount = sets.filter(s => s.status === 'finished').length;
                                    const progressVal = calcTotalSets > 0 ? (finishedSetsCount / calcTotalSets) * 100 : 0;

                                    return (
                                        <>
                                            <CircularProgress
                                                value={progressVal}
                                                size={160}
                                                color="text-blue-400"
                                            />
                                            {/* Hidden data for layout if needed */}
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                <MiniStatCard icon={Calendar} label="Total Partidos" value={matches.length} color="text-amber-400" />
                                <MiniStatCard icon={CheckCircle} label="Finalizados" value={matches.filter(m => m.status === 'finished').length} color="text-green-400" />
                                <MiniStatCard
                                    icon={Notebook}
                                    label="Sets"
                                    value={`${sets.filter(s => s.status === 'finished').length} / ${matches.reduce((acc, m) => acc + ((m.is_single_set || m.set_number === '1 Set') ? 1 : 3), 0)}`}
                                    color="text-cyan-400"
                                />
                                <MiniStatCard icon={Users} label="Equipos" value={teams.length} color="text-purple-400" />
                            </div >
                        </div >

                        {/* Leaderboard Section (Replaces Recent Activity) */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md sticky top-24 z-30 h-fit">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                                    <Award size={16} className="text-yellow-500" /> Tabla de Clasificación
                                </h2>
                                <span className="text-[10px] text-white/30 uppercase tracking-widest">{activeStage?.name || 'General'}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                                            <th className="px-1 py-3 w-6 text-center">P</th>
                                            <th className="px-2 py-3 w-auto text-left">Equipo</th>
                                            <th className="px-1 py-3 text-center w-8">GP</th>
                                            <th className="px-1 py-3 text-center w-8">W</th>
                                            <th className="px-1 py-3 text-center w-8">L</th>
                                            <th className="px-1 py-3 text-center w-8">PTS</th>
                                            <th className="px-1 py-3 text-center group/header relative cursor-help w-12">
                                                <span className="border-b border-dotted border-white/20">RC/RP</span>
                                                <div className="absolute right-0 top-full mt-1 w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-[9px] text-white/80 normal-case tracking-normal shadow-xl opacity-0 group-hover/header:opacity-100 transition-opacity z-50 pointer-events-none mb-2">
                                                    Carreras Anotadas / Carreras Permitidas (Usado para desempate)
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {calculateStandings().slice(0, 10).map((team, idx) => (
                                            <tr key={team.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-1 py-3 font-black text-white/20 text-sm text-center">{idx + 1}</td>
                                                <td className="px-2 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center border border-white/10 shadow-sm overflow-hidden group-hover:border-blue-500/30 transition-all flex-shrink-0">
                                                            {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover" /> : <Trophy size={10} className="text-white/20" />}
                                                        </div>
                                                        <span className="font-bold text-[10px] md:text-xs group-hover:text-blue-400 transition-colors truncate max-w-[100px] block">{team.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-1 py-3 text-center font-bold text-[10px] text-white/60">{team.gp || 0}</td>
                                                <td className="px-1 py-3 text-center font-bold text-[10px] text-green-400">{team.wins || 0}</td>
                                                <td className="px-1 py-3 text-center font-bold text-[10px] text-red-400">{team.losses || 0}</td>
                                                <td className="px-1 py-3 text-center">
                                                    <span className="bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-600/30">{team.pts || 0}</span>
                                                </td>
                                                <td className="px-1 py-3 text-center">
                                                    <span className="text-[10px] text-white/40 font-mono tracking-tight">{team.runs_scored}/{team.runs_allowed}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {calculateStandings().length === 0 && (
                                    <div className="p-6 text-center text-white/20 italic text-xs">
                                        No hay datos de clasificación aún.
                                    </div>
                                )}
                            </div>
                        </div >
                    </div >
                </div >
            </main >

            <ConfirmationModal
                isOpen={!!startMatchModal}
                onClose={() => setStartMatchModal(null)}
                onConfirm={confirmStartSet}
                title="Iniciar Partido"
                message={`¿Deseas iniciar el Set #${startMatchModal?.setNumber} del partido entre ${teams.find(t => t.id === startMatchModal?.match.local_team_id)?.name} y ${teams.find(t => t.id === startMatchModal?.match.visitor_team_id)?.name}?`}
                confirmText="Empezar Anotación"
                variant="info"
            />
        </div >
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${active ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
            }`}
    >
        <Icon size={14} className={active ? 'text-blue-400' : ''} />
        {label}
    </button>
);

const B5BallToggle = ({ isActive, onToggle }: any) => (
    <div
        onClick={onToggle}
        className={`relative w-20 h-10 rounded-full cursor-pointer transition-colors duration-500 ease-out border shadow-inner ${isActive ? 'bg-green-500/20 border-green-500/50' : 'bg-white/5 border-white/10'}`}
    >
        <motion.div
            layout
            initial={false}
            whileHover={{ scale: 1.15 }}
            animate={{
                x: isActive ? 40 : 0,
                rotate: isActive ? 360 : 0,
                backgroundColor: isActive ? "#FFD700" : "#e4e4e7" // Yellow when active, gray when inactive
            }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={`absolute top-0.5 left-0.5 w-[36px] h-[36px] rounded-full shadow-lg flex items-center justify-center border border-black/10 overflow-hidden z-10`}
        >
            {/* Seams Effect */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60 pointer-events-none">
                <path d="M25,0 Q60,50 25,100" fill="none" stroke="black" strokeWidth="8" strokeLinecap="round" />
                <path d="M75,0 Q40,50 75,100" fill="none" stroke="black" strokeWidth="8" strokeLinecap="round" />
            </svg>

            {/* Logo */}
            <img src="/logo.png" className="w-[18px] h-[18px] object-contain relative z-20 drop-shadow-sm" />
        </motion.div>
    </div>
);

const MiniStatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors group relative overflow-hidden">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${color.replace('text-', 'bg-')}`} />
        <div className={`p-2 rounded-full bg-white/5 ${color} shadow-lg ring-1 ring-white/10`}>
            <Icon size={16} />
        </div>
        <div className="text-center z-10">
            <div className="text-xl font-black text-white leading-none mb-1 shadow-black drop-shadow-md">{value}</div>
            <div className="text-[8px] uppercase font-bold text-white/30 tracking-wider leading-tight">{label}</div>
        </div>
    </div>
);

const CircularProgress = ({ value, size = 120, strokeWidth = 8, color = "text-blue-500" }: any) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center p-4">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background Circle */}
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        className="text-black/20"
                    />
                    {/* Animated Progress Circle */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className={`${color} drop-shadow-[0_0_15px_currentColor]`}
                    />
                </svg>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-3xl font-black text-white"
                    >
                        {Math.round(value)}%
                    </motion.span>
                    <span className="text-[8px] uppercase text-white/40 font-bold tracking-widest mt-1">Completo</span>
                </div>
            </div>
        </div>
    );
};

const SmallTeamInfo = ({ team, align = 'left' }: any) => (
    <div className={`flex items-center gap-2 flex-1 ${align === 'right' ? 'flex-row-reverse' : ''} overflow-hidden`}>
        <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-white/10 shadow-sm flex-shrink-0 overflow-hidden">
            {team?.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover" /> : <Trophy size={10} className="text-white/20" />}
        </div>
        <span className="text-[10px] font-black truncate text-white/80">{team?.name || '???'}</span>
    </div>
);

const MatchCard = ({ match, teams, sets, onStartSet, tournament, fields, referees, onRefresh }: any) => {
    const localTeam = teams.find((t: any) => t.id === match.local_team_id);
    const visitorTeam = teams.find((t: any) => t.id === match.visitor_team_id);

    // Resolve Field Name
    const fieldObj = fields?.find((f: any) => f.id === match.field);
    const fieldName = fieldObj ? fieldObj.name : (match.field || 'Cancha');

    // Resolve Scorer (Referee)
    const scorer = referees?.find((r: any) => r.id === match.referee_id || r.referee_id === match.referee_id);
    const scorerName = scorer ? `${scorer.first_name} ${scorer.last_name}` : 'Oficial de Mesa';

    // Calculate Set Wins for specific score "Local X - Y Visitor"
    let localSetWins = 0;
    let visitorSetWins = 0;
    sets.forEach((s: any) => {
        if (s.status === 'finished') {
            if (s.local_runs > s.visitor_runs) localSetWins++;
            else if (s.visitor_runs > s.local_runs) visitorSetWins++;
        }
    });

    // Check if Single Set mode
    const isSingleSet = match.is_single_set === true || tournament?.sets_per_match === 1;

    // Determine Match Ident
    const matchIdent = match.global_id || match.globalId || match.name || '???';

    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all backdrop-blur-sm group flex flex-col justify-between h-full">
            <div>
                {/* Header info */}
                <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-blue-400">
                            <Clock size={12} />
                            <span className="text-[10px] font-black tracking-widest">{match.start_time?.substring(11, 16) || match.start_time?.substring(0, 5) || 'HH:MM'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onRefresh) onRefresh();
                            }}
                            className="p-1 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-colors"
                            title="Actualizar Marcador"
                        >
                            <RefreshCcw size={12} />
                        </button>
                        <div className="flex items-center gap-1.5 text-white/30 truncate max-w-[150px]">
                            <MapPin size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider truncate">{fieldName}</span>
                        </div>
                        {/* Sets Config Display */}
                        <div className="flex items-center gap-1.5 text-orange-400/80">
                            <Notebook size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{match.set_number || (isSingleSet ? '1 Set' : '3 Sets')}</span>
                        </div>
                        {/* PDF Download Button (Only if all sets finished) */}
                        {/* PDF Download Button (If match is finished or decisive result reached) */}
                        {((sets.length > 0 && sets.every((s: any) => s.status === 'finished')) ||
                            match.status === 'finished' ||
                            (localSetWins >= 2 || visitorSetWins >= 2) ||
                            (isSingleSet && sets[0]?.status === 'finished')
                        ) && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        generateMatchReport(match, sets, {
                                            tournamentName: tournament?.name,
                                            tournamentLogo: tournament?.logo_url,
                                            fieldName: fieldName,
                                            localTeam: localTeam,
                                            visitorTeam: visitorTeam,
                                            scorerName: scorerName
                                        });
                                    }}
                                    className="p-1 hover:bg-white/10 rounded-full text-green-400 hover:text-green-300 transition-colors animate-pulse"
                                    title="Descargar Reporte PDF"
                                >
                                    <Download size={12} />
                                </button>
                            )}
                    </div>
                </div>

                {/* Teams display */}
                <div className="p-6">

                    {/* Redesigned Match Header: Logo - Score - VS - Score - Logo */}
                    <div className="flex items-center justify-between gap-2 md:gap-8 px-4 py-2 relative">

                        {/* LOCAL TEAM */}
                        <div className="flex flex-col items-center gap-2 flex-1 group/team">
                            <div className="w-20 h-20 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center shadow-lg group-hover/team:scale-105 group-hover/team:border-blue-500/50 transition-all duration-300 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 group-hover/team:opacity-100 transition-opacity" />
                                {localTeam?.logo_url ? <img src={localTeam.logo_url} className="w-full h-full object-cover" /> : <Trophy size={32} className="text-white/10" />}
                            </div>
                            <p className="text-sm font-black truncate w-32 text-center uppercase tracking-tight text-white/90">{localTeam?.name || 'Local'}</p>
                        </div>

                        {/* CENTER SECTION: Score - VS - Score */}
                        <div className="flex items-center justify-center gap-4 md:gap-6 z-10">

                            {/* Local Score */}
                            <div className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] font-mono">
                                {localSetWins}
                            </div>

                            {/* VS Badge */}
                            <div className="flex flex-col items-center justify-center gap-1">
                                <span className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-600 drop-shadow-sm scale-110">VS</span>
                                <div className="px-3 py-0.5 bg-white/5 rounded-full border border-white/5 text-[10px] font-black text-white/30">
                                    #{matchIdent}
                                </div>
                            </div>

                            {/* Visitor Score */}
                            <div className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] font-mono">
                                {visitorSetWins}
                            </div>

                        </div>

                        {/* VISITOR TEAM */}
                        <div className="flex flex-col items-center gap-2 flex-1 group/team">
                            <div className="w-20 h-20 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center shadow-lg group-hover/team:scale-105 group-hover/team:border-red-500/50 transition-all duration-300 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-red-500/20 to-transparent opacity-0 group-hover/team:opacity-100 transition-opacity" />
                                {visitorTeam?.logo_url ? <img src={visitorTeam.logo_url} className="w-full h-full object-cover" /> : <Trophy size={32} className="text-white/10" />}
                            </div>
                            <p className="text-sm font-black truncate w-32 text-center uppercase tracking-tight text-white/90">{visitorTeam?.name || 'Visita'}</p>
                        </div>

                    </div>

                    {/* Sets Section */}
                    <div className="mt-8 space-y-4">
                        {/* Render sets based on config and win condition */}
                        {Array.from({ length: isSingleSet ? 1 : 3 }).map((_, i) => {
                            const num = i + 1;
                            // Check if game is already won (Best of 3) - Only hide 3rd set if it was a 2-0 sweep
                            if (!isSingleSet && num === 3 && ((localSetWins === 2 && visitorSetWins === 0) || (visitorSetWins === 2 && localSetWins === 0))) return null;

                            const set = sets.find((s: any) => s.set_number === num);
                            const isFinished = set?.status === 'finished';
                            const isLive = set?.status === 'live';
                            const hasData = set?.state_json;

                            // Extract data for scoreboard
                            // Prioritize DB Columns if available
                            const getRunsFromCols = (prefix: 'vis' | 'loc') => {
                                const arr: string[] = [];
                                // Max 10 columns checked
                                for (let i = 1; i <= 10; i++) {
                                    const key = i <= 5 ? `${prefix}_inn${i}` : `${prefix}_ex${i}`;
                                    const val = (set as any)[key];
                                    if (val !== null && val !== undefined) arr.push(val.toString());
                                }
                                return arr;
                            };

                            let visRuns = getRunsFromCols('vis');
                            let locRuns = getRunsFromCols('loc');

                            let innings = { local: [] as string[], visitor: [] as string[] }; // Default initialization

                            // Trim trailing zeros to avoid showing 10 empty columns by default
                            const trimZeros = (arr: string[]) => {
                                const res = [...arr];
                                while (res.length > 5 && (res[res.length - 1] === '0' || res[res.length - 1] === '')) {
                                    res.pop();
                                }
                                return res;
                            };

                            if (visRuns.length > 0 || locRuns.length > 0) {
                                visRuns = trimZeros(visRuns);
                                locRuns = trimZeros(locRuns);
                                innings = { local: locRuns, visitor: visRuns };
                            } else if (hasData) {
                                innings = (set.state_json.inningScores || { local: [], visitor: [] });
                            }

                            const maxInnings = Math.max(5, innings.local.length, innings.visitor.length); // Min 5 cols

                            return (
                                <div key={num} className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden group/set transition-colors hover:border-white/10">
                                    <div className="p-2 flex items-center justify-between bg-white/5 border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] ${isFinished ? 'bg-green-500/20 text-green-400' : isLive ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/30'}`}>
                                                S{num}
                                            </div>
                                            <span className="text-[10px] font-bold text-white/40 uppercase items-center flex gap-1">
                                                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                                {isLive ? 'En Juego' : isFinished ? 'Finalizado' : 'Pendiente'}
                                            </span>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => {
                                                if (onStartSet) {
                                                    onStartSet(match, num);
                                                }
                                            }}
                                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all"
                                            title={isFinished ? "Ver Anotación" : "Anotar"}
                                        >
                                            <BookOpen size={14} />
                                        </button>
                                    </div>

                                    {/* Mini Scoreboard Table */}
                                    {(isLive || isFinished || hasData) ? (
                                        <div className="text-[10px] w-full overflow-x-auto">
                                            <table className="w-full text-center">
                                                <thead>
                                                    <tr className="bg-white/5 text-white/30">
                                                        <th className="p-1 text-left pl-3 font-normal w-24">Equipo</th>
                                                        {Array.from({ length: maxInnings }).map((_, idx) => (
                                                            <th key={idx} className="p-1 font-normal w-6">{idx + 1}</th>
                                                        ))}
                                                        <th className="p-1 font-bold text-white/60 w-8 border-l border-white/5">R</th>
                                                        <th className="p-1 font-bold text-white/60 w-8">H</th>
                                                        <th className="p-1 font-bold text-white/60 w-8">E</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-white/80 font-mono">
                                                    {(() => {
                                                        const vRun = Number(set.away_score ?? set.visitor_runs ?? set.state_json?.totals?.visitor ?? 0);
                                                        const lRun = Number(set.home_score ?? set.local_runs ?? set.state_json?.totals?.local ?? 0);
                                                        const isFin = set.status === 'finished';
                                                        const vWin = isFin && vRun > lRun;
                                                        const lWin = isFin && lRun > vRun;

                                                        return (
                                                            <>
                                                                {/* Visitor Row */}
                                                                <tr className={`border-b border-white/5 ${vWin ? 'bg-yellow-500/10' : ''}`}>
                                                                    <td className={`p-1 pl-3 text-left truncate max-w-[80px] font-sans font-bold ${vWin ? 'text-yellow-400' : 'text-white/60'}`}>{visitorTeam?.name}</td>
                                                                    {Array.from({ length: maxInnings }).map((_, idx) => (
                                                                        <td key={idx} className={`p-1 ${vWin ? 'text-yellow-200/60' : 'text-white/40'}`}>{innings.visitor[idx] || '-'}</td>
                                                                    ))}
                                                                    <td className={`p-1 font-bold border-l border-white/10 ${vWin ? 'text-yellow-400 bg-yellow-500/20' : 'text-white bg-white/5'}`}>{vRun}</td>
                                                                    <td className="p-1 text-white/60">
                                                                        {set.away_hits || (() => {
                                                                            if (!set.state_json?.visitorTeam?.slots) return 0;
                                                                            let h = 0;
                                                                            set.state_json.visitorTeam.slots.forEach((s: any) => {
                                                                                [s.starter, s.sub].forEach((p: any) => p?.scores?.flat().forEach((v: string) => { if (v?.includes('H')) h++; }));
                                                                            });
                                                                            return h;
                                                                        })()}
                                                                    </td>
                                                                    <td className="p-1 text-white/60">{set.away_errors || set.state_json?.errors?.visitor || 0}</td>
                                                                </tr>
                                                                {/* Local Row */}
                                                                <tr className={lWin ? 'bg-yellow-500/10' : ''}>
                                                                    <td className={`p-1 pl-3 text-left truncate max-w-[80px] font-sans font-bold ${lWin ? 'text-yellow-400' : 'text-white/60'}`}>{localTeam?.name}</td>
                                                                    {Array.from({ length: maxInnings }).map((_, idx) => (
                                                                        <td key={idx} className={`p-1 ${lWin ? 'text-yellow-200/60' : 'text-white/40'}`}>
                                                                            {innings.local[idx] || (set.state_json?.inningScores?.local?.[idx] || '-')}
                                                                        </td>
                                                                    ))}
                                                                    <td className={`p-1 font-bold border-l border-white/10 ${lWin ? 'text-yellow-400 bg-yellow-500/20' : 'text-white bg-white/5'}`}>{lRun}</td>
                                                                    <td className="p-1 text-white/60">
                                                                        {set.home_hits || (() => {
                                                                            if (!set.state_json?.localTeam?.slots) return 0;
                                                                            let h = 0;
                                                                            set.state_json.localTeam.slots.forEach((s: any) => {
                                                                                [s.starter, s.sub].forEach((p: any) => p?.scores?.flat().forEach((v: string) => { if (v?.includes('H')) h++; }));
                                                                            });
                                                                            return h;
                                                                        })()}
                                                                    </td>
                                                                    <td className="p-1 text-white/60">{set.home_errors || set.state_json?.errors?.local || 0}</td>
                                                                </tr>
                                                            </>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        // Empty Placeholder for Pending Sets
                                        <div className="p-4 flex flex-col items-center justify-center opacity-30 gap-1">
                                            <div className="w-full h-1 bg-white/10 rounded-full" />
                                            <div className="w-2/3 h-1 bg-white/10 rounded-full" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Scorer Footer */}
            <div className="px-5 py-2 bg-white/5 border-t border-white/10 flex items-center justify-center gap-2 text-white/30 text-[10px]">
                <Users size={12} />
                <span className="uppercase font-bold tracking-wider">{scorerName}</span>
            </div>
        </div>
    );
};
