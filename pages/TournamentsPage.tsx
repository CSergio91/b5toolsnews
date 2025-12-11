import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserNavbar } from '../components/UserNavbar';
import { ParticlesBackground } from '../components/ParticlesBackground';
import { Trophy, Plus, HelpCircle, ChevronRight, ChevronDown, Check, Calendar as CalendarIcon, Loader2, Search, Book } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tournament } from '../types/tournament';
import { CreateTournamentModal } from '../components/CreateTournamentModal';
import { TournamentCard } from '../components/TournamentCard';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { TournamentsOnboardingModal } from '../components/TournamentsOnboardingModal';

export const TournamentsPage: React.FC = () => {
    const navigate = useNavigate();
    const [isAnimated, setIsAnimated] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [tournamentToDelete, setTournamentToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsAnimated(true), 500);
        checkSubscription();
        return () => clearTimeout(timer);
    }, []);

    const checkSubscription = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check Subscription
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();

            const tier = profile?.subscription_tier || 'basic';
            if (tier !== 'pro' && tier !== 'ultra') {
                navigate('/dashboard');
                return;
            }

            // If allowed, fetch data
            fetchTournaments();
        } catch (error) {
            console.error('Error checking subscription:', error);
            setLoading(false);
        }
    };

    const fetchTournaments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('user_id', user.id)
                .order('start_date', { ascending: true });

            if (data) {
                const years = new Set(data.map(t => new Date(t.start_date).getFullYear().toString()));
                const initialExpanded = Array.from(years).reduce((acc, year) => ({ ...acc, [year]: true }), {});
                setExpandedYears(initialExpanded);
            }

            if (error) throw error;
            setTournaments(data || []);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTournament(null);
        setShowCreateModal(true);
    };

    const handleEdit = (tournament: Tournament) => {
        setEditingTournament(tournament);
        setShowCreateModal(true);
    };

    // Open Delete Modal instead of verify directly
    const handleDeleteClick = (id: string, name: string) => {
        setTournamentToDelete({ id, name });
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!tournamentToDelete) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('tournaments')
                .delete()
                .eq('id', tournamentToDelete.id);

            if (error) throw error;

            await fetchTournaments();
            setDeleteModalOpen(false);
            setTournamentToDelete(null);
        } catch (error) {
            console.error('Error deleting tournament:', error);
            alert('Hubo un error al eliminar el torneo. Por favor intenta de nuevo.');
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleYear = (year: string) => {
        setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
    };

    const scrollToDate = (elementId: string) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Filter Logic
    const filteredTournaments = tournaments.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping Logic for Main View (Group by Date)
    const groupedTournaments = filteredTournaments.reduce((groups, tournament) => {
        const date = tournament.start_date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(tournament);
        return groups;
    }, {} as Record<string, Tournament[]>);

    const sortedDates = Object.keys(groupedTournaments).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Index Grouping Logic: Year -> Month -> Tournaments
    const sourceForIndex = searchQuery ? filteredTournaments : tournaments;

    const indexTree = sourceForIndex.reduce((tree, tournament) => {
        const date = new Date(tournament.start_date);
        const year = date.getFullYear().toString();
        const monthNum = date.getMonth();
        const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
        const monthKey = `${monthNum.toString().padStart(2, '0')}-${monthName}`;

        if (!tree[year]) {
            tree[year] = {};
        }
        if (!tree[year][monthKey]) {
            tree[year][monthKey] = [];
        }
        tree[year][monthKey].push(tournament);
        return tree;
    }, {} as Record<string, Record<string, Tournament[]>>);

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black text-white selection:bg-purple-500 selection:text-white flex flex-col relative overflow-hidden">
            <ParticlesBackground />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            <UserNavbar showGameControls={true} />

            <div className="flex-1 relative z-10 w-full h-screen flex flex-col md:flex-row overflow-hidden pt-20">

                {/* Sidebar Index */}
                <aside className={`
                    hidden md:flex w-64 flex-col bg-slate-900/50 backdrop-blur-md border-r border-white/5 h-full transition-all duration-700
                    ${isAnimated ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
                    pt-6
                `}>
                    <div className="p-4 border-b border-white/5 pt-8">
                        <div className="flex items-center gap-2 mb-3 text-slate-400">
                            <Book size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Índice & Búsqueda</span>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {Object.keys(indexTree).length === 0 && (
                            <div className="text-center text-slate-600 text-xs py-4">
                                Sin resultados.
                            </div>
                        )}

                        {Object.keys(indexTree).sort().reverse().map(year => (
                            <div key={year} className="mb-1">
                                <button
                                    onClick={() => toggleYear(year)}
                                    className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 text-slate-300 transition-colors group"
                                >
                                    <span className="font-bold text-xs">{year}</span>
                                    <ChevronDown size={12} className={`transition-transform duration-200 text-slate-500 group-hover:text-white ${expandedYears[year] ? 'rotate-180' : ''}`} />
                                </button>

                                {expandedYears[year] && (
                                    <div className="ml-1.5 pl-1.5 border-l border-white/10 mt-0.5 space-y-1">
                                        {Object.keys(indexTree[year]).sort().map(monthKey => {
                                            const [num, name] = monthKey.split('-');
                                            const tournamentsInMonth = indexTree[year][monthKey];

                                            return (
                                                <div key={monthKey} className="group/month">
                                                    {/* Month Header */}
                                                    <button
                                                        onClick={() => {
                                                            const firstT = tournamentsInMonth[0];
                                                            if (firstT) scrollToDate(firstT.start_date);
                                                        }}
                                                        className="w-full text-left px-2 py-1 rounded text-[11px] font-semibold text-slate-500 hover:text-blue-300 hover:bg-white/5 transition-colors capitalize truncate flex items-center gap-1.5"
                                                    >
                                                        {name}
                                                    </button>

                                                    {/* Tournament List inside Month */}
                                                    <div className="pl-2 space-y-0.5 mt-0.5">
                                                        {tournamentsInMonth.map(t => (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => {
                                                                    scrollToDate(t.start_date);
                                                                }}
                                                                className="w-full text-left px-2 py-0.5 rounded text-[10px] text-slate-500 hover:text-white hover:bg-white/5 transition-colors truncate block"
                                                                title={t.name}
                                                            >
                                                                • {t.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar relative bg-black/20">
                    <div className="flex-1 relative flex flex-col min-h-full pb-20 p-4 md:p-8 md:pl-10">

                        {/* Header Area */}
                        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-4 md:mt-0 transition-all duration-700 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                                    <Trophy size={18} />
                                </div>
                                <h1 className="font-bold text-white text-lg md:text-2xl">
                                    Mis Torneos
                                </h1>
                            </div>

                            <div className="flex gap-2 text-sm">
                                <button
                                    onClick={handleCreate}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all group"
                                >
                                    <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                                    Crear
                                </button>
                                <button
                                    onClick={() => setShowOnboarding(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                                >
                                    <HelpCircle size={14} className="text-blue-400" />
                                    Ayuda
                                </button>
                            </div>
                        </div>

                        {/* Search (Mobile Only) */}
                        <div className="md:hidden mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className={`transition-opacity duration-1000 delay-300 ${isAnimated ? 'opacity-100' : 'opacity-0'}`}>
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="animate-spin text-blue-500" size={24} />
                                </div>
                            ) : filteredTournaments.length === 0 ? (
                                <div className="p-8 border border-white/5 rounded-2xl bg-white/[0.02] text-center max-w-lg mx-auto mt-10">
                                    <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500">
                                        <Trophy size={24} />
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-1">
                                        {searchQuery ? 'Sin resultados' : 'Sin torneos'}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {searchQuery ? 'Prueba otra búsqueda.' : 'Crea tu primer torneo.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6 pb-10 max-w-4xl mx-auto w-full">
                                    {sortedDates.map(date => {
                                        const dateObj = new Date(date);
                                        const day = dateObj.toLocaleDateString('es-ES', { day: 'numeric' });
                                        const month = dateObj.toLocaleDateString('es-ES', { month: 'long' });
                                        const year = dateObj.getFullYear();
                                        const isToday = new Date().toDateString() === dateObj.toDateString();

                                        return (
                                            <div key={date} id={date} className="relative scroll-mt-24">
                                                {/* Date Header */}
                                                <div className="flex items-baseline gap-2 mb-3 z-10 py-1 w-full border-b border-white/5 pb-1">
                                                    <div className={`text-xl font-bold ${isToday ? 'text-blue-400' : 'text-white'}`}>{day}</div>
                                                    <div className="text-sm font-medium text-slate-400 capitalize">{month} {year}</div>
                                                    {isToday && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase tracking-wider">Hoy</span>}
                                                </div>

                                                {/* Grid of Cards */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                    {groupedTournaments[date].map(tournament => (
                                                        <TournamentCard
                                                            key={tournament.id}
                                                            tournament={tournament}
                                                            onEdit={handleEdit}
                                                            onDelete={handleDeleteClick}
                                                        />
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
            </div>

            <CreateTournamentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onTournamentSaved={fetchTournaments}
                initialData={editingTournament}
            />

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                tournamentName={tournamentToDelete?.name || ''}
                isDeleting={isDeleting}
            />

            <TournamentsOnboardingModal
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
            />
        </div>
    );
};
