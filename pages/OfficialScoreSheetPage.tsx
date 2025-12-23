import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Clock, ArrowRightLeft, Square, X, Plus, Printer, RotateCcw,
    Trophy, CheckCircle2, AlertCircle, AlertTriangle, Trash2,
    Circle, Pencil, Share2, Download, Users, Save, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';

// --- Types ---

interface PlayerStats {
    name: string;
    gender: string;
    number: string;
    pos: string;
    scores: string[][];
    defError?: number;
}

interface RosterSlot {
    starter: PlayerStats;
    sub: PlayerStats;
}

interface TeamData {
    slots: RosterSlot[];
}

interface PlayEvent {
    id: number;
    timestamp: string;
    inning: number;
    teamName: string;
    playerNum: string;
    playerName: string;
    actionCode: string;
    description: string;
}

interface ScoreCardState {
    gameInfo: {
        competition: string; place: string; date: string; gameNum: string; setNum: string;
        visitor: string; home: string;
    };
    visitorTeam: TeamData;
    localTeam: TeamData;
    inningScores: { visitor: string[]; local: string[]; };
    totals: { visitor: string; local: string; };
    errors: { visitor: string; local: string; };
    timeouts: { visitor: [boolean, boolean]; local: [boolean, boolean]; };
    scoreAdjustments: { visitor: number; local: number; };
    winner: { name: string; score: string; isVisitor: boolean } | null;
    history: PlayEvent[];
}

// --- Initial Helpers ---

const createEmptyPlayer = (): PlayerStats => ({
    name: '', gender: '', number: '', pos: '', scores: [['']], defError: 0
});

const createEmptyTeam = (): TeamData => ({
    slots: Array(12).fill(null).map(() => ({ // Start with 12 slots for roster flexibility
        starter: createEmptyPlayer(),
        sub: createEmptyPlayer(),
    }))
});

const initialState: ScoreCardState = {
    gameInfo: {
        competition: '', place: '', date: new Date().toISOString().split('T')[0], gameNum: '', setNum: '',
        visitor: 'Visitante', home: 'Local',
    },
    visitorTeam: createEmptyTeam(),
    localTeam: createEmptyTeam(),
    inningScores: { visitor: [], local: [] },
    totals: { visitor: '0', local: '0' },
    errors: { visitor: '0', local: '0' },
    timeouts: { visitor: [false, false], local: [false, false] },
    scoreAdjustments: { visitor: 0, local: 0 },
    winner: null,
    history: []
};

// --- Components ---

const ModalBackdrop: React.FC<{ children: React.ReactNode, zIndex?: string }> = ({ children, zIndex = 'z-[200]' }) => (
    createPortal(
        <div className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4`}>
            {children}
        </div>,
        document.body
    )
);

// --- Roster Selector Modal ---

interface RosterItem {
    id: string;
    first_name: string;
    last_name: string;
    number: number;
    position: string;
}

const RosterSelectorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teamName: string; // For display
    roster: RosterItem[];
    onSelect: (player: RosterItem) => void;
}> = ({ isOpen, onClose, teamName, roster, onSelect }) => {
    if (!isOpen) return null;

    return (
        <ModalBackdrop zIndex="z-[300]">
            <div className="bg-[#1e1e24] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Roster: {teamName}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X size={20} className="text-white/50" /></button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {roster.length === 0 ? (
                        <p className="text-white/40 italic text-center py-8">No hay jugadores registrados en este roster.</p>
                    ) : (
                        roster.map(p => (
                            <button
                                key={p.id}
                                onClick={() => { onSelect(p); onClose(); }}
                                className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-between group transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center font-black text-blue-400 border border-white/10">
                                        {p.number || '#'}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white group-hover:text-blue-200">{p.first_name} {p.last_name}</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest">{p.position || 'Jugador'}</p>
                                    </div>
                                </div>
                                <Users size={16} className="text-white/20 group-hover:text-white/60" />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </ModalBackdrop>
    );
};


// --- Original Score Cell & Grid Components (Simplified for Official Use) ---

const EditOverlay: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => (
    <div
        className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] cursor-pointer z-20 group transition-all duration-200 opacity-0 hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); onClick(e); }}
    >
        <div className="bg-white/90 p-1.5 rounded-full shadow-lg">
            <Pencil size={14} className="text-black" />
        </div>
    </div>
);

const ScoreCell: React.FC<{
    value: string;
    onChange: (val: string) => void; // Kept for type compatibility but unused directly if locked
    isEx?: boolean;
    onOpenModal: (e: React.MouseEvent) => void;
    isLocked?: boolean;
}> = ({ value, isEx, onOpenModal, isLocked }) => {
    const [tempUnlocked, setTempUnlocked] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => setTempUnlocked(false), [isLocked]);

    const safeValue = value || '';
    const hasRun = safeValue.includes('●');
    const baseValue = safeValue.replace(/[●■⇄]/g, '').trim();

    const getStyle = (val: string) => {
        const v = val.toUpperCase();
        if (v.includes('X')) return 'text-red-500 font-bold';
        if (v.includes('H')) return 'text-green-400 font-bold';
        if (v.includes('BB')) return 'text-blue-400 font-bold';
        if (v.includes('S')) return 'text-white font-bold';
        if (v.includes('E')) return 'text-yellow-400 font-bold';
        if (v.includes('K')) return 'text-red-400';
        return 'text-white/70';
    };

    const effectivelyLocked = isLocked && !tempUnlocked;

    return (
        <div
            ref={containerRef}
            onClick={(e) => { if (!effectivelyLocked) onOpenModal(e); }}
            className={`relative w-full h-full min-h-[40px] flex items-center justify-center outline-none cursor-pointer ${isEx ? 'bg-indigo-900/10' : ''}`}
        >
            {effectivelyLocked && <EditOverlay onClick={() => setTempUnlocked(true)} />}

            <span className={`text-center text-sm font-bold uppercase ${getStyle(value)} ${effectivelyLocked ? 'opacity-50 blur-[0.5px]' : ''}`}>
                {baseValue}
            </span>

            <div className={`absolute inset-0 pointer-events-none flex items-center justify-center ${effectivelyLocked ? 'opacity-40' : 'opacity-100'}`}>
                {value.includes('⇄') && <span className="absolute top-0.5 right-0.5 text-purple-400 z-20"><ArrowRightLeft size={10} /></span>}
                {value.includes('■') && <span className="absolute top-0.5 left-0.5 text-amber-500 z-20"><Square size={8} fill="currentColor" /></span>}
                {value === '●' ? (
                    <span className="text-rose-500 text-2xl flex items-center justify-center leading-none">●</span>
                ) : hasRun && (
                    <span className="absolute text-rose-500 text-[10px] bottom-0.5 right-0.5 flex items-center justify-center z-20"><Circle size={10} fill="currentColor" /></span>
                )}
            </div>
        </div>
    );
};

// --- Scoring Modal (Simplified from ScoreCard) ---
const ScoringModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (val: string) => void;
    position: { x: number, y: number } | null;
}> = ({ isOpen, onClose, onSelect, position }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen || !position) return null;

    // Actions matching the image layout (Grid 3x3 approx)
    // Row 1: OUT, HIT, S
    // Row 2: ERR, CARRERA, SUB
    // Row 3: FIN INN (Empty) (Empty)
    const mainActions = [
        { label: 'OUT', val: 'X', icon: <X size={24} />, color: 'bg-[#2A1818] text-[#FF5555] border-[#FF5555]/30 hover:bg-[#FF5555]/20' },
        { label: 'HIT', val: 'H', icon: <CheckCircle2 size={24} />, color: 'bg-[#0F281D] text-[#4ADE80] border-[#4ADE80]/30 hover:bg-[#4ADE80]/20' },
        { label: 'S', val: 'S', icon: <span className="font-black text-xl">S</span>, color: 'bg-[#1E1E24] text-white border-white/20 hover:bg-white/10' },
        { label: 'ERR', val: 'E', icon: <AlertCircle size={24} />, color: 'bg-[#2A2410] text-[#FACC15] border-[#FACC15]/30 hover:bg-[#FACC15]/20' },
        { label: 'CARRERA', val: '●', icon: <Circle size={24} fill="currentColor" />, color: 'bg-[#BE123C] text-white border-[#F43F5E]/50 hover:bg-[#E11D48] shadow-[0_0_15px_rgba(225,29,72,0.4)]' }, // Glowing red
        { label: 'SUB', val: '⇄', icon: <ArrowRightLeft size={24} />, color: 'bg-[#1E1B2E] text-[#A78BFA] border-[#A78BFA]/30 hover:bg-[#A78BFA]/20' },
        { label: 'FIN INN', val: '■', icon: <Square size={24} fill="currentColor" />, color: 'bg-[#271A0C] text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/20' },
    ];

    return createPortal(
        <div className="fixed z-[9999]" style={{ top: position.y, left: position.x - 140 }} ref={modalRef}>
            <div className="bg-[#0f0f13] border border-white/10 p-4 rounded-3xl shadow-2xl w-[300px] flex flex-col gap-4 ring-1 ring-white/5">

                {/* Main Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {mainActions.map((a) => (
                        <button
                            key={a.label}
                            onClick={() => { onSelect(a.val); onClose(); }}
                            className={`flex flex-col items-center justify-center aspect-square rounded-2xl border transition-all active:scale-95 ${a.color}`}
                        >
                            <div className="mb-1">{a.icon}</div>
                            <span className="text-[10px] font-black uppercase tracking-wider">{a.label}</span>
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-white/10 my-1"></div>

                {/* Extra Bases Row */}
                <div className="grid grid-cols-3 gap-3">
                    {['Ex1B', 'Ex2B', 'Ex3B'].map((val) => (
                        <button
                            key={val}
                            onClick={() => { onSelect(val); onClose(); }} // Simplified for now, just sets value. Original logic might trigger special handling.
                            className="py-2.5 bg-[#172554] border border-[#3B82F6]/30 rounded-xl text-[#60A5FA] font-black text-xs uppercase hover:bg-[#1E3A8A] transition-colors"
                        >
                            {val}
                        </button>
                    ))}
                </div>

                {/* Borrar */}
                <button
                    onClick={() => { onSelect(''); onClose(); }}
                    className="w-full py-3 bg-[#2A1215] hover:bg-[#45151A] border border-[#EF4444]/20 rounded-xl text-[#F87171] font-black text-sm uppercase flex items-center justify-center gap-2 transition-colors"
                >
                    <Trash2 size={18} /> BORRAR
                </button>

            </div>
        </div>, document.body
    );
};


// --- Main Component ---

export const OfficialScoreSheetPage: React.FC = () => {
    const { matchId, setNumber } = useParams<{ matchId: string, setNumber: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // State
    const [gameState, setGameState] = useState<ScoreCardState | null>(null);
    const [rosters, setRosters] = useState<{ visitor: RosterItem[], local: RosterItem[] }>({ visitor: [], local: [] });

    // UI State
    const [rosterModalOpen, setRosterModalOpen] = useState<{ isOpen: boolean, team: 'visitor' | 'local', slotIdx: number, type: 'starter' | 'sub' } | null>(null);
    const [scoringModal, setScoringModal] = useState<{ isOpen: boolean, pos: { x: number, y: number } | null, slotIdx: number, type: 'starter' | 'sub', inningIdx: number, scoreIdx: number, team: 'visitor' | 'local' } | null>(null);

    // Load Data
    useEffect(() => {
        if (!matchId || !setNumber) return;

        const load = async () => {
            try {
                // 1. Fetch Match
                const { data: match } = await supabase.from('tournament_matches').select(`*, local_team:tournament_teams!local_team_id (*), visitor_team:tournament_teams!visitor_team_id (*)`).eq('id', matchId).single();

                // 2. Fetch Rosters
                const { data: vRoster } = await supabase.from('tournament_rosters').select('*').eq('team_id', match.visitor_team_id);
                const { data: lRoster } = await supabase.from('tournament_rosters').select('*').eq('team_id', match.local_team_id);
                setRosters({ visitor: vRoster || [], local: lRoster || [] });

                // 3. Fetch Set Data (State)
                const { data: setRec } = await supabase.from('tournament_sets').select('state_json').eq('match_id', matchId).eq('set_number', setNumber).single();

                if (setRec?.state_json) {
                    setGameState(setRec.state_json);
                } else {
                    // Initialize New State
                    const newState = { ...initialState }; // Clone default
                    newState.gameInfo = {
                        ...newState.gameInfo,
                        visitor: match.visitor_team?.name || 'Visitante',
                        home: match.local_team?.name || 'Local',
                        gameNum: match.id,
                        setNum: setNumber
                    };
                    setGameState(newState);
                }
            } catch (e) {
                console.error("Error loading official game:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [matchId, setNumber]);

    // Save Logic
    const saveToDB = async (newState: ScoreCardState) => {
        if (!matchId || !setNumber) return;
        setSaving(true);
        try {
            // Calculate Stats for columns
            const calcStats = (team: TeamData, manualRuns: string[]) => {
                let hits = 0, errors = 0, runs = 0;
                // Sum grid runs + manual adjustments? No, strict grid for official usually, or hybrid.
                // Let's stick to the verified logic: Max(manual, grid)
                // Actually for this new tool, let's trust the GRID primarily if populated, but we need to sum specific valid markers.

                team.slots.forEach(slot => {
                    [slot.starter, slot.sub].forEach(p => {
                        p.scores.flat().forEach(val => {
                            if (val?.includes('H')) hits++;
                            if (val?.includes('E')) errors++;
                            if (val?.includes('●')) runs++;
                        });
                    });
                });
                return { hits, errors, runs };
            };

            const vStats = calcStats(newState.visitorTeam, newState.inningScores.visitor);
            const lStats = calcStats(newState.localTeam, newState.inningScores.local);

            // Per Inning Run Totals (Count '●' per inning col)
            const countInningRuns = (team: TeamData, innIdx: number) => {
                let r = 0;
                team.slots.forEach(slot => {
                    [slot.starter, slot.sub].forEach(p => {
                        const cell = p.scores[innIdx]?.flat(); // array of strings
                        cell?.forEach(val => { if (val?.includes('●')) r++; });
                    });
                });
                return r;
            };

            const visInns: any = {}, locInns: any = {};
            for (let i = 1; i <= 10; i++) {
                visInns[`vis_${i <= 5 ? 'inn' : 'ex'}${i}`] = countInningRuns(newState.visitorTeam, i - 1);
                locInns[`loc_${i <= 5 ? 'inn' : 'ex'}${i}`] = countInningRuns(newState.localTeam, i - 1);
            }

            // Sync Totals to State as well for UI consistency
            newState.totals.visitor = vStats.runs.toString();
            newState.totals.local = lStats.runs.toString();
            newState.errors.visitor = vStats.errors.toString(); // Wait, errors are usually OPPOSING team errors? 
            // In the "Simple" Scorecard, errors col is typically defensive errors committed BY that team.
            // Let's stick to: home_errors = errors made by home team.

            const payload = {
                state_json: newState,
                away_score: vStats.runs,
                home_score: lStats.runs,
                away_hits: vStats.hits,
                home_hits: lStats.hits,
                away_errors: vStats.errors,
                home_errors: lStats.errors,
                ...visInns,
                ...locInns
            };

            await supabase.from('tournament_sets').update(payload).eq('match_id', matchId).eq('set_number', setNumber);
            setLastSaved(new Date());
        } catch (e) {
            console.error("Save error:", e);
        } finally {
            setSaving(false);
        }
    };

    const updateState = (updater: (prev: ScoreCardState) => ScoreCardState) => {
        setGameState(prev => {
            if (!prev) return null;
            const next = updater({ ...prev }); // shallow clone top level
            // Deep clone logic ideally needed here if mutating deep props, but for now we rely on explicit spread in updaters
            saveToDB(next);
            return next;
        });
    };

    // Handlers
    const handleRosterSelect = (player: RosterItem) => {
        if (!rosterModalOpen || !gameState) return;
        const { team, slotIdx, type } = rosterModalOpen;

        updateState(prev => {
            const newTeam = team === 'visitor' ? { ...prev.visitorTeam } : { ...prev.localTeam };
            const slot = newTeam.slots[slotIdx];
            slot[type] = {
                ...slot[type],
                name: `${player.first_name} ${player.last_name}`,
                number: player.number.toString(),
                pos: player.position
            };
            return { ...prev, [team === 'visitor' ? 'visitorTeam' : 'localTeam']: newTeam };
        });
    };

    const handleScoreUpdate = (val: string) => {
        if (!scoringModal || !gameState) return;
        const { team, slotIdx, type, inningIdx, scoreIdx } = scoringModal;

        updateState(prev => {
            const newTeam = team === 'visitor' ? { ...prev.visitorTeam } : { ...prev.localTeam };
            const slot = newTeam.slots[slotIdx];
            if (!slot[type].scores[inningIdx]) slot[type].scores[inningIdx] = [''];
            slot[type].scores[inningIdx][scoreIdx] = val;
            return { ...prev, [team === 'visitor' ? 'visitorTeam' : 'localTeam']: newTeam };
        });
    };

    if (loading || !gameState) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white">
            <Loader2 className="animate-spin mb-4" />
            <p>Cargando Planilla Oficial...</p>
        </div>
    );

    // --- RENDER HELPERS ---
    const renderTeamGrid = (teamKey: 'visitor' | 'local', teamData: TeamData, roster: RosterItem[], color: string) => (
        <div className="bg-[#1e1e24] rounded-xl overflow-hidden border border-white/5 mb-8">
            <div className={`p-3 ${color} text-black font-bold flex justify-between`}>
                <span>{gameState.gameInfo[teamKey === 'visitor' ? 'visitor' : 'home']}</span>
                <span>{teamKey === 'visitor' ? 'VISITANTE' : 'LOCAL'}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr className="bg-black/40 text-[10px] text-white/50 uppercase">
                            <th className="p-2 text-left min-w-[150px]">Bateador</th>
                            <th className="p-2 w-10">Pos</th>
                            {Array.from({ length: 9 }).map((_, i) => <th key={i} className="p-2 min-w-[50px] border-l border-white/5">{i + 1}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {teamData.slots.map((slot, idx) => {
                            const p = slot.starter; // Simplified: Showing starter only for grid initially (sub logic complex)
                            return (
                                <tr key={idx} className="border-b border-white/5 text-sm">
                                    <td className="p-2 text-left cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() => setRosterModalOpen({ isOpen: true, team: teamKey, slotIdx: idx, type: 'starter' })}
                                    >
                                        {p.name ? (
                                            <div>
                                                <span className="font-bold text-white block">{p.name}</span>
                                                <span className="text-[10px] text-white/40">#{p.number}</span>
                                            </div>
                                        ) : (
                                            <span className="text-white/20 italic">Seleccionar Jugador...</span>
                                        )}
                                    </td>
                                    <td className="p-2 text-white/60 font-mono">{p.pos}</td>
                                    {Array.from({ length: 9 }).map((_, innIdx) => {
                                        const scoreVal = p.scores[innIdx]?.[0] || '';
                                        return (
                                            <td key={innIdx} className="p-0 border-l border-white/10 h-12 relative w-12">
                                                <ScoreCell
                                                    value={scoreVal}
                                                    onOpenModal={(e) => setScoringModal({
                                                        isOpen: true,
                                                        pos: { x: e.clientX, y: e.clientY },
                                                        team: teamKey, slotIdx: idx, type: 'starter', inningIdx: innIdx, scoreIdx: 0
                                                    })}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#1e1e24]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white">
                    <ArrowRightLeft size={16} /> Volver
                </button>
                <div className="flex items-center gap-4">
                    {saving ? <span className="text-yellow-400 text-xs flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Guardando...</span> :
                        <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 size={12} /> Guardado {lastSaved?.toLocaleTimeString()}</span>}
                    <div className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg">SET {setNumber}</div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4">
                {renderTeamGrid('visitor', gameState.visitorTeam, rosters.visitor, 'bg-purple-400')}
                {renderTeamGrid('local', gameState.localTeam, rosters.local, 'bg-amber-400')}
            </div>

            {/* Modals */}
            <RosterSelectorModal
                isOpen={!!rosterModalOpen} // Ensure boolean
                onClose={() => setRosterModalOpen(null)}
                teamName={rosterModalOpen?.team === 'visitor' ? gameState.gameInfo.visitor : gameState.gameInfo.home}
                roster={rosterModalOpen?.team === 'visitor' ? rosters.visitor : rosters.local}
                onSelect={handleRosterSelect}
            />

            <ScoringModal
                isOpen={!!scoringModal}
                onClose={() => setScoringModal(null)}
                onSelect={handleScoreUpdate}
                position={scoringModal?.pos || null}
            />
        </div>
    );
};
