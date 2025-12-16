import React, { useState } from 'react';
import { useBuilder, BuilderProvider } from '../../../context/BuilderContext';
import { useParams } from 'react-router-dom';
import { ParticleBackground } from '../../ParticleBackground';
import { TournamentInfoCard } from './component/new/TournamentInfoCard';
import { LiveMatchesWidget } from './component/new/LiveMatchesWidget';
import { LeaderboardWidget } from './component/new/LeaderboardCard';
import { PhasesBracketWidget } from './component/new/PhasesBracketWidget';
import { TimelineSchedule } from './component/new/TimelineSchedule';
import { Trophy, Calendar, Activity, LayoutDashboard, Radio } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Inner Component that uses Context
const DashboardContent: React.FC = () => {
    const { state, teams } = useBuilder();

    // Construct matchesData from state
    const matchesData = {
        matches: state.matches || [],
        fields: (state.config as any)?.fields || []
    };

    console.log('DashboardContent Rendered', { state, teams, matchesData });

    if (!state || !state.config) {
        return (
            <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando datos del torneo...</span>
                </div>
            </div>
        );
    }

    const config = state.config;
    // Default to 'dashboard' to show the Bento Grid
    const [activeTab, setActiveTab] = useState<'dashboard' | 'bracket' | 'calendar' | 'leaderboard'>('dashboard');

    // Derived Data for Widgets
    const tournamentTitle = config?.tournament_name || 'Mi Torneo B5Tools';

    // Mobile Navigation Component
    const MobileNav = () => (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-[#1a1a20]/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl z-50 flex justify-around shadow-2xl safe-area-bottom">
            {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Inicio' },
                { id: 'leaderboard', icon: Trophy, label: 'Tabla' },
                { id: 'calendar', icon: Calendar, label: 'Agenda' },
                { id: 'bracket', icon: Activity, label: 'Fases' },
            ].map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-purple-600 text-white shadow-lg scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                    <item.icon size={20} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
                </button>
            ))}
        </div>
    );

    // Simple Error Boundary
    class ErrorBoundary extends React.Component<{ children: React.ReactNode, name: string }, { hasError: boolean }> {
        constructor(props: any) { super(props); this.state = { hasError: false }; }
        static getDerivedStateFromError() { return { hasError: true }; }
        render() {
            if (this.state.hasError) return <div className="text-red-500 text-xs p-2 border border-red-500/20 rounded bg-red-500/10">Error in {this.props.name}</div>;
            return this.props.children;
        }
    }

    return (
        <div className="min-h-screen bg-[#09090b] font-sans text-gray-100 pb-24 lg:pb-0 overflow-y-auto lg:overflow-hidden relative selection:bg-purple-500/30">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <ParticleBackground />
                <div className="absolute inset-0 bg-gradient-to-br from-[#09090b]/80 via-[#0f0f13]/60 to-purple-900/10"></div>
            </div>

            <div className="relative z-10 w-full h-full p-4 md:p-6 lg:h-screen lg:p-8 box-border flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-purple-900/20">
                            <span className="font-black text-2xl tracking-tighter text-white">B5</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse">
                                    <Radio size={10} className="animate-pulse" />
                                    En Vivo
                                </span>
                                <span className="text-xs text-white/30 font-mono hidden sm:inline-block uppercase tracking-widest">
                                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                            <h1 className="text-2xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
                                {tournamentTitle}
                            </h1>
                        </div>
                    </div>
                    {/* Settings Cog or actions could go here */}
                </div>

                {/* Dashboard Key Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className={`
                            w-full max-w-[1920px] mx-auto
                            ${activeTab === 'dashboard'
                                ? 'lg:flex-1 lg:grid lg:grid-cols-12 lg:grid-rows-12 gap-4 lg:gap-6 lg:min-h-0'
                                : 'flex-1 flex flex-col min-h-0'}
                        `}
                    >

                        {/* --- WIDGET: CLASSIFICATION / LEADERBOARD --- 
                           Occupies Top Full Row in the grid concept provided in user image (under header).
                           Row 1-3 (3 rows high out of 12)
                        */}
                        <div className={`
                            lg:col-span-12 lg:row-span-3
                            ${activeTab !== 'dashboard' && activeTab !== 'leaderboard' ? 'hidden lg:block' : ''}
                            ${activeTab === 'leaderboard' ? 'flex-1' : ''}
                        `}>
                            {/* We wrap in a container that provides the glassmorphism */}
                            <ErrorBoundary name="Leaderboard">
                                <LeaderboardWidget teams={teams} config={config} matches={matchesData.matches} isFullPage={activeTab === 'leaderboard'} />
                            </ErrorBoundary>
                        </div>

                        {/* --- WIDGET: LIVE MATCHES HERO --- 
                           Occupies Left Large Area.
                           Row 4-12 (9 rows high), Col 1-8 (8 cols wide)
                        */}
                        <div className={`
                            lg:col-span-8 lg:row-span-9
                            bg-[#121217]/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden relative group hover:border-white/10 transition-all
                            ${activeTab !== 'dashboard' && activeTab !== 'dashboard' ? 'hidden lg:block' : ''} 
                            /* Note: This widget is only primary in dashboard. In other mobile tabs it's hidden */
                             ${activeTab === 'dashboard' ? 'block' : 'hidden lg:block'}
                        `}>
                            <ErrorBoundary name="LiveMatches">
                                <LiveMatchesWidget matches={matchesData.matches} teams={teams} />
                            </ErrorBoundary>
                        </div>

                        {/* --- WIDGET: INFO / STATUS --- 
                           Occupies Right Top of remaining.
                           Row 4-7 (4 rows high), Col 9-12 (4 cols wide)
                        */}
                        <div className={`
                            lg:col-span-4 lg:row-span-4
                            bg-[#121217]/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden relative group hover:border-white/10 transition-all
                            ${activeTab !== 'dashboard' ? 'hidden lg:block' : ''}
                        `}>
                            <ErrorBoundary name="Info">
                                <TournamentInfoCard config={config} teamCount={teams.length} matches={matchesData.matches} />
                            </ErrorBoundary>
                        </div>

                        {/* --- WIDGET: UPCOMING / SCHEDULE --- 
                           Occupies Right Bottom of remaining.
                           Row 8-12 (5 rows high), Col 9-12 (4 cols wide)
                        */}
                        <div className={`
                            lg:col-span-4 lg:row-span-5
                            bg-[#121217]/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden relative group hover:border-white/10 transition-all
                            ${activeTab !== 'dashboard' && activeTab !== 'calendar' ? 'hidden lg:block' : ''}
                             ${activeTab === 'calendar' ? 'flex-1 block' : ''}
                        `}>
                            <ErrorBoundary name="Timeline">
                                <TimelineSchedule matches={matchesData.matches} teams={teams} isCompact={activeTab === 'dashboard'} />
                            </ErrorBoundary>
                        </div>

                        {/* --- MOBILE ONLY: BRACKET VIEW --- */}
                        <div className={`${activeTab === 'bracket' ? 'block flex-1' : 'hidden'}`}>
                            <PhasesBracketWidget structure={matchesData.structure} />
                        </div>

                    </motion.div>
                </AnimatePresence>
            </div>

            <MobileNav />
        </div>
    );
};

// Wrapper to provide Context
export const TournamentPreviewNewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    console.log('TournamentPreviewNewPage Wrapper Rendered', { id });

    // Load state from local storage (dumped by handlePreview)
    const [initialState, setInitialState] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        try {
            const saved = localStorage.getItem('b5_builder_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('Loaded initial state from LS', parsed);
                setInitialState(parsed);
            }
        } catch (e) {
            console.error('Failed to load local state for preview', e);
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) return <div className="bg-black h-screen w-full"></div>;

    return (
        <BuilderProvider initialId={id} initialState={initialState}>
            <DashboardContent />
        </BuilderProvider>
    );
};

export default TournamentPreviewNewPage;
