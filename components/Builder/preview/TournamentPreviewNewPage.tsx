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
                <div className="flex items-center justify-between shrink-0 h-[60px]">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 shrink-0">
                            <img src="/logo.png" alt="B5Tools Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-0.5">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500 uppercase tracking-wider animate-pulse">
                                    <Radio size={10} className="animate-pulse" />
                                    En Vivo
                                </span>
                                <span className="text-[10px] text-white/30 font-mono hidden sm:inline-block uppercase tracking-widest">
                                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                            <h1 className="text-xl lg:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 leading-none">
                                {tournamentTitle}
                            </h1>
                        </div>
                    </div>
                    {/* B5 Branding */}
                    <div className="hidden lg:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">Powered by</span>
                        <span className="text-lg font-black tracking-tighter text-white/80">
                            B5<span className="text-purple-500">Tools</span>
                        </span>
                    </div>
                </div>

                {/* Main Content Grid - Full Height - 3 Columns */}
                <div
                    className={`
                        w-full max-w-[2000px] mx-auto
                        ${activeTab === 'dashboard'
                            ? 'lg:flex-1 lg:grid lg:grid-cols-12 lg:gap-6 lg:min-h-0'
                            : 'flex-1 flex flex-col min-h-0'}
                    `}
                >

                    {/* COL 1: Leaderboard (Vertical) - 3/12 cols */}
                    <div className={`
                        lg:col-span-3 lg:h-full lg:overflow-hidden
                        bg-[#121217]/80 backdrop-blur-md rounded-3xl border border-white/5 relative group hover:border-white/10 transition-all flex flex-col
                        ${activeTab !== 'dashboard' && activeTab !== 'leaderboard' ? 'hidden lg:flex' : ''}
                        ${activeTab === 'leaderboard' ? 'flex-1' : ''}
                    `}>
                        <ErrorBoundary name="Leaderboard">
                            <LeaderboardWidget teams={teams} config={config} matches={matchesData.matches} isFullPage={true} />
                        </ErrorBoundary>
                    </div>

                    {/* COL 2: Center Stage (Live + Upcoming) - 6/12 cols */}
                    <div className={`
                        lg:col-span-6 lg:h-full lg:flex lg:flex-col lg:gap-6 lg:overflow-hidden
                        ${activeTab !== 'dashboard' && activeTab !== 'calendar' ? 'hidden lg:flex' : ''}
                        ${activeTab === 'calendar' ? 'flex-1' : ''}
                    `}>
                        {/* Hero Live Match (60% H) */}
                        <div className={`
                            flex-grow-[1.5]
                            bg-[#121217]/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden relative group hover:border-white/10 transition-all
                            ${activeTab === 'calendar' ? 'hidden lg:block' : ''}
                        `}>
                            <ErrorBoundary name="LiveMatches">
                                <LiveMatchesWidget matches={matchesData.matches} teams={teams} />
                            </ErrorBoundary>
                        </div>

                        {/* Upcoming Matches (40% H) or Full if Calendar Tab */}
                        <div className={`
                            flex-grow-[1] 
                            bg-[#121217]/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden relative group hover:border-white/10 transition-all
                            ${activeTab === 'calendar' ? 'flex-grow h-full' : ''}
                        `}>
                            <ErrorBoundary name="Timeline">
                                <TimelineSchedule matches={matchesData.matches} teams={teams} mode={activeTab === 'calendar' ? 'mobile' : 'desktop'} />
                            </ErrorBoundary>
                        </div>
                    </div>

                    {/* COL 3: Info & Extra - 3/12 cols */}
                    <div className={`
                         lg:col-span-3 lg:h-full lg:flex lg:flex-col lg:gap-6 lg:overflow-hidden
                         ${activeTab !== 'dashboard' && activeTab !== 'bracket' ? 'hidden lg:flex' : ''}
                         ${activeTab === 'bracket' ? 'flex-1' : ''}
                    `}>
                        {/* Info Card */}
                        <div className="flex-1 bg-[#121217]/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden relative group hover:border-white/10 transition-all">
                            <ErrorBoundary name="Info">
                                <TournamentInfoCard config={config} teamCount={teams.length} matches={matchesData.matches} />
                            </ErrorBoundary>
                        </div>

                        {/* Ad / Bracket Placeholder */}
                        <div className={`
                            h-1/3 bg-[#121217]/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden relative group hover:border-white/10 transition-all
                            ${activeTab === 'bracket' ? 'flex-grow h-full' : ''}
                        `}>
                            <ErrorBoundary name="Bracket">
                                <PhasesBracketWidget structure={state.structure} />
                            </ErrorBoundary>
                        </div>

                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence mode="wait">
                    {/* Only show on mobile when content needs scrolling or tabbing */}
                    <div className="lg:hidden">
                        {/* Tab Content Rendering handled by CSS visibility classes above for now, 
                            but for true mobile view we usually just swap the visible div. 
                            The grid logic above handles 'hidden lg:block' based on tab.
                         */}
                    </div>
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
