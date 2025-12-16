import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BuilderProvider, useBuilder } from '../../../context/BuilderContext';
import { ToastProvider } from '../../../context/ToastContext';
import { ParticleBackground } from '../../ParticleBackground';
import { TournamentInfoCard } from './component/new/TournamentInfoCard';
import { LeaderboardCard } from './component/new/LeaderboardCard';
import { TimelineSchedule } from './component/new/TimelineSchedule';
import { LiveMatchesWidget } from './component/new/LiveMatchesWidget';
import { PhasesBracketWidget } from './component/new/PhasesBracketWidget';

// Shell Component
const PreviewContentNew = () => {
    const { state } = useBuilder();
    const [activeTab, setActiveTab] = useState<'info' | 'leaderboard' | 'calendar' | 'live' | 'bracket'>('info');

    // Mobile Navigation Component
    const MobileNav = () => (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card-dark border-t border-gray-200 dark:border-gray-700 p-2 z-50 flex justify-around safe-area-bottom">
            {[
                { id: 'info', icon: 'info', label: 'Info' },
                { id: 'leaderboard', icon: 'leaderboard', label: 'Tabla' },
                { id: 'calendar', icon: 'calendar_today', label: 'Calendario' },
                { id: 'live', icon: 'live_tv', label: 'En Vivo' },
                { id: 'bracket', icon: 'emoji_events', label: 'Fases' },
            ].map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === item.id ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <span className="material-icons-round text-2xl mb-0.5">{item.icon}</span>
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f0f13] font-sans text-gray-900 pb-20 lg:pb-0 overflow-y-auto lg:overflow-hidden relative">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <ParticleBackground />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f13]/80 via-[#0f0f13]/85 to-[#0b0b0e]/95"></div>
            </div>

            <div className="relative z-10 w-full h-full p-4 md:p-6 lg:h-screen lg:p-8 box-border">
                {/* Desktop Grid Layout (Bento / Puzzle) */}
                <div className="hidden lg:grid grid-cols-12 grid-rows-12 gap-6 h-full w-full max-w-[1920px] mx-auto">

                    {/* Column 1: Widgets Stack (Info, Live, Bracket) - Cols 1-4 */}
                    <div className="col-span-4 row-span-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden relative group">
                        <TournamentInfoCard />
                    </div>
                    <div className="col-span-4 row-span-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                        <LiveMatchesWidget />
                    </div>
                    <div className="col-span-4 row-span-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                        <PhasesBracketWidget />
                    </div>

                    {/* Column 2: Leaderboard - Cols 5-8 (Full Height) */}
                    <div className="col-span-4 row-span-12 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                        <LeaderboardCard />
                    </div>

                    {/* Column 3: Timeline - Cols 9-12 (Full Height) */}
                    <div className="col-span-4 row-span-12 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                        <TimelineSchedule />
                    </div>
                </div>

                {/* Mobile/Tablet View (Stacked or Tabbed) */}
                <div className="lg:hidden space-y-4">
                    {activeTab === 'info' && <TournamentInfoCard mode="mobile" />}
                    {activeTab === 'leaderboard' && <LeaderboardCard mode="mobile" />}
                    {activeTab === 'calendar' && <div className="h-[70vh]"><TimelineSchedule mode="mobile" /></div>}
                    {activeTab === 'live' && <LiveMatchesWidget mode="mobile" />}
                    {activeTab === 'bracket' && <PhasesBracketWidget mode="mobile" />}
                </div>
            </div>

            <MobileNav />
        </div>
    );
};

export const TournamentPreviewNewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [initialState, setInitialState] = useState<any>(null);

    useEffect(() => {
        const savedState = localStorage.getItem('b5_builder_state');
        if (savedState) {
            try {
                setInitialState(JSON.parse(savedState));
            } catch (e) {
                console.error("Failed to parse local builder state", e);
            }
        }
    }, []);

    if (!initialState) {
        return (
            <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <BuilderProvider initialId={id} initialState={initialState}>
            <ToastProvider>
                <PreviewContentNew />
            </ToastProvider>
        </BuilderProvider>
    );
};
