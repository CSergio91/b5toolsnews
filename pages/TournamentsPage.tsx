import React, { useState, useEffect } from 'react';
import { UserNavbar } from '../components/UserNavbar';
import { ParticlesBackground } from '../components/ParticlesBackground';
import { Trophy, Plus, HelpCircle, ChevronRight, ChevronLeft, Check, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tournament } from '../types/tournament';
import { CreateTournamentModal } from '../components/CreateTournamentModal';
import { TournamentCard } from '../components/TournamentCard';

export const TournamentsPage: React.FC = () => {
    const [isAnimated, setIsAnimated] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Trigger animation after mount
        const timer = setTimeout(() => setIsAnimated(true), 500);
        fetchTournaments();
        return () => clearTimeout(timer);
    }, []);

    const fetchTournaments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('user_id', user.id)
                .order('start_date', { ascending: true });

            if (error) throw error;
            setTournaments(data || []);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    // Grouping Logic
    const groupedTournaments = tournaments.reduce((groups, tournament) => {
        const date = tournament.start_date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(tournament);
        return groups;
    }, {} as Record<string, Tournament[]>);

    const sortedDates = Object.keys(groupedTournaments).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black text-white selection:bg-purple-500 selection:text-white flex flex-col relative overflow-hidden">
            <ParticlesBackground />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            <UserNavbar showGameControls={true} />

            <main className="flex-1 relative z-10 w-full h-[calc(100vh-80px)] flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex-1 relative flex flex-col min-h-full pb-20">

                    {/* Title Section - Static Position with simple fade in */}
                    <div
                        className={`absolute top-8 left-4 md:left-12 flex items-center gap-3 pl-4 md:pl-0 animate-in fade-in duration-700 z-20`}
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                            <Trophy size={20} />
                        </div>
                        <h1 className="font-bold text-white text-xl md:text-2xl">
                            Mis Torneos
                        </h1>
                    </div>

                    {/* Action Buttons */}
                    <div
                        className={`absolute top-20 left-4 md:left-12 flex gap-3 transition-all duration-700 delay-300 pl-4 md:pl-0 z-20
                            ${isAnimated ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all group"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                            Crear Torneo
                        </button>
                        <button
                            onClick={() => setShowOnboarding(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors"
                        >
                            <HelpCircle size={16} className="text-blue-400" />
                            Cómo funciona
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className={`container mx-auto px-4 mt-40 transition-opacity duration-1000 delay-500 ${isAnimated ? 'opacity-100' : 'opacity-0'}`}>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                            </div>
                        ) : tournaments.length === 0 ? (
                            /* Empty State */
                            <div className="p-8 border border-white/5 rounded-2xl bg-white/[0.02] text-center max-w-lg mx-auto mt-10">
                                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                                    <Trophy size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">No hay torneos activos</h3>
                                <p className="text-sm text-slate-400">Comienza creando tu primera competición para gestionar equipos y calendarios.</p>
                            </div>
                        ) : (
                            /* Tournaments List - Grouped by Date */
                            <div className="space-y-8 pb-10 max-w-4xl mx-auto">
                                {sortedDates.map(date => {
                                    const dateObj = new Date(date);
                                    // Use explicit locale formatting to avoid hydration mismatch if using SSR, though this is SPA.
                                    // Just simpler formatting for now.
                                    const day = dateObj.toLocaleDateString('es-ES', { day: 'numeric' });
                                    const month = dateObj.toLocaleDateString('es-ES', { month: 'long' });
                                    const year = dateObj.getFullYear();
                                    const isToday = new Date().toDateString() === dateObj.toDateString();

                                    return (
                                        <div key={date} className="relative pl-8 md:pl-0">
                                            {/* Date Header */}
                                            <div className="flex items-baseline gap-3 mb-4 sticky top-0 md:relative z-10 bg-slate-900/80 backdrop-blur-sm md:bg-transparent py-2 md:py-0 w-full">
                                                <div className={`text-2xl font-bold ${isToday ? 'text-blue-400' : 'text-white'}`}>{day}</div>
                                                <div className="text-lg font-medium text-slate-400 capitalize">{month} {year}</div>
                                                {isToday && <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase tracking-wider">Hoy</span>}
                                                <div className="flex-1 h-px bg-white/10 ml-4"></div>
                                            </div>

                                            {/* Grid of Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {groupedTournaments[date].map(tournament => (
                                                    <TournamentCard key={tournament.id} tournament={tournament} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <CreateTournamentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onTournamentCreated={fetchTournaments}
            />

            <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
        </div>
    );
};

// Internal Onboarding Component
const OnboardingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Bienvenido al Gestor de Torneos",
            description: "La herramienta definitiva para organizar tus competiciones de Béisbol 5.",
            icon: Trophy,
            color: "text-yellow-400",
            bg: "bg-yellow-400/20"
        },
        {
            title: "Crea tu Competición",
            description: "Define el formato (Liga, Copa, Round Robin), número de equipos y reglas específicas.",
            icon: Plus,
            color: "text-blue-400",
            bg: "bg-blue-400/20"
        },
        {
            title: "Gestiona Equipos",
            description: "Añade equipos, logotipos y rosters de jugadores para un seguimiento detallado.",
            icon: HelperIcons.Users,
            color: "text-green-400",
            bg: "bg-green-400/20"
        },
        {
            title: "Calendario Automático",
            description: "Genera jornadas y cruces automáticamente. Registra resultados y la tabla se actualiza sola.",
            icon: HelperIcons.Calendar,
            color: "text-purple-400",
            bg: "bg-purple-400/20"
        },
        {
            title: "Estadísticas en Vivo",
            description: "Cada partido anotado con la app alimenta las estadísticas globales del torneo en tiempo real.",
            icon: HelperIcons.BarChart,
            color: "text-pink-400",
            bg: "bg-pink-400/20"
        }
    ];

    if (!isOpen) return null;

    const currentStep = steps[step];
    const Icon = currentStep.icon;

    const handleNext = () => {
        if (step < steps.length - 1) setStep(step + 1);
        else onClose();
    };

    const handlePrev = () => {
        if (step > 0) setStep(step - 1);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col min-h-[400px]">

                {/* Background Decor */}
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500`}></div>
                <div className={`absolute -top-20 -right-20 w-64 h-64 ${currentStep.bg} rounded-full blur-[80px] transition-all duration-500`}></div>

                <div className="flex-1 p-8 flex flex-col items-center text-center relative z-10 pt-12">
                    <div className={`w-20 h-20 rounded-2xl ${currentStep.bg} ${currentStep.color} flex items-center justify-center mb-6 shadow-lg transform transition-all duration-300 hover:scale-110`}>
                        <Icon size={40} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 transition-all">{currentStep.title}</h2>
                    <p className="text-slate-300 text-lg leading-relaxed">{currentStep.description}</p>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-between">
                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-white' : 'bg-white/20'}`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        {step > 0 && (
                            <button onClick={handlePrev} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                                Anterior
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                        >
                            {step === steps.length - 1 ? '¡Empezar!' : 'Siguiente'}
                            {step === steps.length - 1 ? <Check size={18} /> : <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper icons specifically for this file to avoid cluttering imports if they aren't standard
const HelperIcons = {
    Users: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    Calendar: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>,
    BarChart: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
};
