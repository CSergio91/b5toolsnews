import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserNavbar } from '../components/UserNavbar';
import { ParticlesBackground } from '../components/ParticlesBackground';
import {
    Clock, MapPin, PlayCircle, Loader2, ArrowLeft,
    Calendar, Trophy, User
} from 'lucide-react';
import { Tournament, TournamentMatch } from '../types/tournament';

export const RefereeDashboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [matches, setMatches] = useState<TournamentMatch[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }
            const email = user.email || user.user_metadata?.email;
            setUserEmail(email);

            // Fetch Tournament
            const { data: tData } = await supabase.from('tournaments').select('*').eq('id', id).single();
            if (tData) setTournament(tData);

            if (email) {
                // Fetch matches where this user is assigned as referee
                // We need to find the record in tournament_referees for this email and tournament
                const { data: refInTournament } = await supabase
                    .from('tournament_referees')
                    .select('id, referee_id')
                    .eq('tournament_id', id)
                    .eq('email', email)
                    .single();

                // Debug to see why matches might be empty
                console.log("Referee Dashboard Debug:", { email, refInTournament });

                if (refInTournament) {
                    const { data: mData } = await supabase
                        .from('tournament_matches')
                        .select('*')
                        .eq('tournament_id', id)
                        .or(`referee_id.eq.${refInTournament.id}${refInTournament.referee_id ? `,referee_id.eq.${refInTournament.referee_id}` : ''}`)
                        .order('start_time', { ascending: true });

                    if (mData) setMatches(mData);
                }
            }

        } catch (err) {
            console.error("Error fetching referee dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0f0f13] text-white flex flex-col relative overflow-hidden">
            <ParticlesBackground />
            <UserNavbar />

            <main className="flex-1 relative z-10 p-6 md:p-12 max-w-5xl mx-auto w-full pt-24 md:pt-32">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Panel de Árbitro</h1>
                            <p className="text-blue-400 text-sm">{tournament?.name || 'Cargando torneo...'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <User size={16} className="text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">{userEmail}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Trophy size={18} className="text-yellow-500" /> Mis Partidos Asignados
                            </h2>

                            {matches.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-white/30 italic">No tienes partidos asignados en este torneo.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {matches.map(match => (
                                        <div key={match.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-blue-500/30">
                                                            {match.status === 'scheduled' ? 'Programado' : match.status === 'live' ? 'En Vivo' : 'Finalizado'}
                                                        </span>
                                                        <span className="text-white/40 text-xs flex items-center gap-1">
                                                            <Calendar size={12} /> {match.date || tournament?.start_date}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold">
                                                        {match.local_team_name || 'Equipo Local'} vs {match.visitor_team_name || 'Equipo Visitante'}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-white/50">
                                                        <span className="flex items-center gap-1"><Clock size={14} /> {match.start_time || '--:--'}</span>
                                                        <span className="flex items-center gap-1"><MapPin size={14} /> {match.location || 'Campo TBD'}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/dashboard/game?tournament=${id}&match=${match.id}`)}
                                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 group"
                                                >
                                                    <PlayCircle size={20} className="group-hover:scale-110 transition-transform" />
                                                    {match.status === 'finished' ? 'Ver Detalles' : 'Iniciar / Continuar'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
