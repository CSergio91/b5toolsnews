import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserNavbar } from '../components/UserNavbar';
import { ParticlesBackground } from '../components/ParticlesBackground';
import { Trophy, Calendar, MapPin, ArrowLeft, Download, Users, List, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateTournamentSummaryReport } from '../utils/pdfGenerator';

export const ArchivedTournamentViewer: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchArchivedData = async () => {
            try {
                const { data: tournament, error } = await supabase
                    .from('tournaments')
                    .select('*, archive_json')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!tournament.archive_json) {
                    alert("Este torneo no tiene un snapshot de archivo válido.");
                    navigate('/dashboard/torneos');
                    return;
                }

                setData(tournament.archive_json);
            } catch (e) {
                console.error("Error fetching archived data:", e);
                navigate('/dashboard/torneos');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchArchivedData();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-purple-400 font-bold tracking-widest uppercase text-xs">Cargando Archivo Histórico...</p>
                </div>
            </div>
        );
    }

    const { tournament_config, teams, matches, sets, standings, archived_at } = data;

    return (
        <div className="min-h-screen w-full bg-[#0a0a0f] text-white flex flex-col relative overflow-x-hidden">
            <ParticlesBackground />
            <UserNavbar />

            <main className="flex-1 relative z-10 pt-24 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto w-full">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/dashboard/torneos')}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded uppercase tracking-widest border border-purple-500/30">Archivado</span>
                                <span className="text-white/40 text-xs">• Registro del {new Date(archived_at).toLocaleDateString()}</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent italic">
                                {tournament_config.name}
                            </h1>
                        </div>
                    </div>

                    <button
                        onClick={() => generateTournamentSummaryReport(tournament_config, teams, matches, sets, standings)}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
                    >
                        <Download size={20} />
                        Descargar Reporte Final
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Standings & Info */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                            <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
                                <Award className="text-yellow-400" size={20} />
                                Clasificación Final
                            </h2>
                            <div className="space-y-3">
                                {standings.map((team: any, idx: number) => (
                                    <div key={team.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 text-center font-black ${idx === 0 ? 'text-yellow-400' : 'text-white/20'}`}>{idx + 1}</span>
                                            <span className="font-bold text-sm">{team.name}</span>
                                        </div>
                                        <div className="flex gap-4 text-xs font-bold">
                                            <span className="text-green-400">{team.wins}W</span>
                                            <span className="text-red-400">{team.losses}L</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                            <h2 className="text-lg font-black mb-4 flex items-center gap-2 uppercase tracking-tight">
                                <List className="text-blue-400" size={20} />
                                Detalles
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-white/60">
                                    <MapPin size={16} className="text-blue-400" />
                                    <span>{tournament_config.location}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-white/60">
                                    <Clock size={16} className="text-purple-400" />
                                    <span>Archivado: {new Date(archived_at).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-white/60">
                                    <Users size={16} className="text-green-400" />
                                    <span>{teams.length} Equipos Participantes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Historical Matches */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tight">
                            <Clock className="text-purple-400" size={24} />
                            Resultados del Torneo
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                            {matches.sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()).map((match: any) => {
                                const vTeam = teams.find((t: any) => t.id === match.visitor_team_id);
                                const lTeam = teams.find((t: any) => t.id === match.local_team_id);
                                const matchSets = sets.filter((s: any) => s.match_id === match.id);

                                const vScore = matchSets.reduce((acc: number, s: any) => acc + ((s.away_score || s.visitor_runs) > (s.home_score || s.local_runs) ? 1 : 0), 0);
                                const lScore = matchSets.reduce((acc: number, s: any) => acc + ((s.home_score || s.local_runs) > (s.away_score || s.visitor_runs) ? 1 : 0), 0);

                                return (
                                    <div key={match.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{match.name || 'Partido'}</span>
                                            <span className="text-[10px] text-white/30">{new Date(match.start_time).toLocaleString()}</span>
                                        </div>

                                        <div className="flex items-center justify-between px-4">
                                            <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                                                <div className="w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {vTeam?.logo_url ? <img src={vTeam.logo_url} className="w-full h-full object-cover" /> : <Trophy size={16} className="text-white/10" />}
                                                </div>
                                                <span className="font-bold text-sm truncate w-full">{vTeam?.name}</span>
                                                <span className={`text-2xl font-black ${vScore > lScore ? 'text-blue-400' : 'text-white/20'}`}>{vScore}</span>
                                            </div>

                                            <div className="text-white/10 font-black text-xl italic uppercase">VS</div>

                                            <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                                                <div className="w-12 h-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {lTeam?.logo_url ? <img src={lTeam.logo_url} className="w-full h-full object-cover" /> : <Trophy size={16} className="text-white/10" />}
                                                </div>
                                                <span className="font-bold text-sm truncate w-full">{lTeam?.name}</span>
                                                <span className={`text-2xl font-black ${lScore > vScore ? 'text-blue-400' : 'text-white/20'}`}>{lScore}</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-white/5 flex gap-2 justify-center">
                                            {matchSets.map((s: any) => (
                                                <div key={s.id} className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-bold text-white/40">
                                                    Set {s.set_number}: {s.away_score ?? s.visitor_runs}-{s.home_score ?? s.local_runs}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
