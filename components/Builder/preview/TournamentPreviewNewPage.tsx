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

interface PreviewData {
    config: any;
    teams: any[];
    matchesData: { matches: any[], fields: any[], structure: any };
    participants: any;
}

// ... imports

// Simple Error Boundary for Debugging
class ErrorBoundary extends React.Component<{ children: React.ReactNode, name: string }, { hasError: boolean, error?: Error }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: any) {
        console.error(`Error in ${this.props.name}:`, error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-xl text-white text-xs">
                    <p className="font-bold mb-1">Error en {this.props.name}</p>
                    <pre className="overflow-auto max-h-20">{this.state.error?.message}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

// Shell Component - Receives Data as Props
const PreviewContentNew: React.FC<{ data: PreviewData }> = ({ data }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'leaderboard' | 'calendar' | 'live' | 'bracket'>('info');

    // Destructure for easier access
    const { config, teams, matchesData } = data;

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
                <ErrorBoundary name="Background">
                    <ParticleBackground />
                </ErrorBoundary>
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f13]/80 via-[#0f0f13]/85 to-[#0b0b0e]/95"></div>
            </div>

            <div className="relative z-10 w-full h-full p-4 md:p-6 lg:h-screen lg:p-8 box-border">
                {/* Desktop Grid Layout (Bento / Puzzle) */}
                <div className="hidden lg:grid grid-cols-12 grid-rows-12 gap-6 h-full w-full max-w-[1920px] mx-auto">

                    {/* Column 1: Widgets Stack (Info, Live, Bracket) - Cols 1-4 */}
                    <div className="col-span-4 row-span-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden relative group">
                        <ErrorBoundary name="InfoCard">
                            <TournamentInfoCard
                                config={config}
                                teamCount={teams.length}
                                matches={matchesData.matches}
                            />
                        </ErrorBoundary>
                    </div>
                    <div className="col-span-4 row-span-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                        <ErrorBoundary name="LiveMatches">
                            <LiveMatchesWidget
                                matches={matchesData.matches}
                                teams={teams}
                            />
                        </ErrorBoundary>
                    </div>
                    <div className="col-span-4 row-span-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                        <ErrorBoundary name="Bracket">
                            <PhasesBracketWidget structure={matchesData.structure} />
                        </ErrorBoundary>
                    </div>

                    {/* Column 2: Leaderboard - Cols 5-8 (Full Height) */}
                    <div className="col-span-4 row-span-12 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                        <ErrorBoundary name="Leaderboard">
                            <LeaderboardCard teams={teams} />
                        </ErrorBoundary>
                    </div>

                    {/* Column 3: Timeline - Cols 9-12 (Full Height) */}
                    <div className="col-span-4 row-span-12 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">
                        <ErrorBoundary name="Timeline">
                            <TimelineSchedule
                                matchesData={matchesData}
                                teams={teams}
                            />
                        </ErrorBoundary>
                    </div>
                </div>

                {/* Mobile/Tablet View (Stacked or Tabbed) */}
                <div className="lg:hidden space-y-4">
                    {activeTab === 'info' && <ErrorBoundary name="InfoMobile"><TournamentInfoCard mode="mobile" config={config} teamCount={teams.length} matches={matchesData.matches} /></ErrorBoundary>}
                    {activeTab === 'leaderboard' && <ErrorBoundary name="LeaderboardMobile"><LeaderboardCard mode="mobile" teams={teams} /></ErrorBoundary>}
                    {activeTab === 'calendar' && <div className="h-[70vh]"><ErrorBoundary name="TimelineMobile"><TimelineSchedule mode="mobile" matchesData={matchesData} teams={teams} /></ErrorBoundary></div>}
                    {activeTab === 'live' && <ErrorBoundary name="LiveMobile"><LiveMatchesWidget mode="mobile" matches={matchesData.matches} teams={teams} /></ErrorBoundary>}
                    {activeTab === 'bracket' && <ErrorBoundary name="BracketMobile"><PhasesBracketWidget mode="mobile" structure={matchesData.structure} /></ErrorBoundary>}
                </div>
            </div>

            <MobileNav />
        </div>
    );
};

export const TournamentPreviewNewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);

    useEffect(() => {
        // Load data from separate Section JSONs strictly as requested
        const infoStr = localStorage.getItem('b5_builder_info');
        const teamsStr = localStorage.getItem('b5_builder_teams');
        const matchesStr = localStorage.getItem('b5_builder_matches');
        const participantsStr = localStorage.getItem('b5_builder_participants');

        try {
            if (infoStr && teamsStr) {
                const info = JSON.parse(infoStr);
                const rawTeams = JSON.parse(teamsStr);
                const matchesData = matchesStr ? JSON.parse(matchesStr) : { matches: [], fields: [], structure: null };
                const participants = participantsStr ? JSON.parse(participantsStr) : { rosters: [], referees: [], admins: [] };

                // Validate Teams is Array
                const teams = Array.isArray(rawTeams) ? rawTeams : [];

                // Keep backward compatibility for matches JSON format (array vs object)
                let finalMatches = [];
                let finalFields = [];
                let finalStructure = null;

                if (Array.isArray(matchesData)) {
                    finalMatches = matchesData;
                } else if (matchesData) {
                    finalMatches = Array.isArray(matchesData.matches) ? matchesData.matches : [];
                    finalFields = Array.isArray(matchesData.fields) ? matchesData.fields : [];
                    finalStructure = matchesData.structure || null;
                };

                // Validate Participants
                const safeParticipants = {
                    rosters: Array.isArray(participants?.rosters) ? participants.rosters : [],
                    referees: Array.isArray(participants?.referees) ? participants.referees : [],
                    admins: Array.isArray(participants?.admins) ? participants.admins : []
                };

                setPreviewData({
                    config: info || {},
                    teams: teams,
                    matchesData: {
                        matches: finalMatches,
                        fields: finalFields,
                        structure: finalStructure
                    },
                    participants: safeParticipants
                });
            }
        } catch (e) {
            console.error("Failed to parse local builder data", e);
        }
    }, [id]);

    if (!previewData) {
        return (
            <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // We still wrap in BuilderProvider just in case some legacy sub-component deep down needs it,
    // but the main UI is now driven by `previewData` props.
    // Ideally we would remove BuilderProvider if all components are refactored.
    // For now we pass a constructed state to it to satisfy context requirements without errors.
    const dummyState: any = {
        config: previewData.config,
        teams: previewData.teams,
        matches: previewData.matchesData.matches,
        structure: previewData.matchesData.structure,
        rosters: previewData.participants.rosters,
        referees: previewData.participants.referees,
        admins: previewData.participants.admins,
        currentStep: 0,
        isDirty: false
    };

    return (
        <BuilderProvider initialId={id} initialState={dummyState}>
            <ToastProvider>
                <ErrorBoundary name="Shell">
                    <PreviewContentNew data={previewData} />
                </ErrorBoundary>
            </ToastProvider>
        </BuilderProvider>
    );
};
