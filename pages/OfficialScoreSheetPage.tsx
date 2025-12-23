import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Clock, ArrowRightLeft, Square, X, Plus, Printer, RotateCcw,
    Trophy, CheckCircle2, AlertCircle, AlertTriangle, Trash2,
    Circle, Pencil, Share2, Download, Users, Save, Loader2,
    UserCircle2, Camera, User, ClipboardList, Flag
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { supabase } from '../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { logTournamentActivity } from '../utils/logger';

// --- Types ---
interface PlayerStats {
    name: string;
    gender: string;
    number: string;
    pos: string;
    scores: string[][]; // 9 innings + ex
    defError?: number;
}
interface RosterSlot {
    starter: PlayerStats;
    sub: PlayerStats;
}
interface TeamData {
    slots: RosterSlot[];
}
interface ScoreCardState {
    gameInfo: {
        competition: string; place: string; date: string; gameNum: string; setNum: string;
        visitor: string; home: string;
        visitorLogo?: string; homeLogo?: string;
        startTime?: string; endTime?: string;
    };
    visitorTeam: TeamData;
    localTeam: TeamData;
    inningScores: { visitor: string[]; local: string[]; };
    totals: { visitor: string; local: string; };
    errors: { visitor: string; local: string; };
    timeouts: { visitor: [boolean, boolean]; local: [boolean, boolean]; };
    scoreAdjustments: { visitor: 0, local: 0 };
    winner: { name: string; score: string; isVisitor: boolean } | null;
    history: any[];
    inningLayout?: number[]; // Columns count per inning (default 1)
}

interface OfficialsData {
    plate: string;
    field1: string;
    field2: string;
    field3: string;
    table: string;
}

interface RosterItem {
    id: string;
    first_name: string;
    last_name: string;
    number: number;
    position: string;
}

const createEmptyPlayer = (): PlayerStats => ({ name: '', gender: '', number: '', pos: '', scores: [['']], defError: 0 });
const createEmptyTeam = (): TeamData => ({
    slots: Array(5).fill(null).map(() => ({ // Reduced to 5 slots as requested
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
    history: [],
    inningLayout: Array(9).fill(1)
};

// --- Helper Components ---

const ModalBackdrop: React.FC<{ children: React.ReactNode, zIndex?: string }> = ({ children, zIndex = 'z-[200]' }) => (
    createPortal(
        <div className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4`}>
            {children}
        </div>,
        document.body
    )
);

// --- 1. Officials Modal ---
const OfficialsModal: React.FC<{
    isOpen: boolean; onClose: () => void;
    data: OfficialsData; onChange: (key: keyof OfficialsData, val: string) => void;
    onSave: () => void;
}> = ({ isOpen, onClose, data, onChange, onSave }) => {
    if (!isOpen) return null;
    return (
        <ModalBackdrop>
            <div className="bg-[#1e1e24] border border-purple-500/30 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
                <h3 className="text-xl font-bold text-white mb-1 uppercase">Oficiales</h3>
                <div className="h-px w-full bg-white/10 mb-4"></div>

                <div className="space-y-3">
                    {['plate', 'field1', 'field2', 'field3', 'table'].map((role) => (
                        <div key={role} className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-white/50">
                                {role === 'plate' ? 'Oficial del Plato' :
                                    role === 'table' ? 'Oficial de Mesa' :
                                        role.replace('field', '') + 'er Oficial del Campo'}
                            </label>
                            <input
                                type="text"
                                value={data[role as keyof OfficialsData]}
                                onChange={(e) => onChange(role as keyof OfficialsData, e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-purple-500 outline-none transition-colors"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 py-2 bg-white/5 text-white/60 hover:text-white rounded-lg text-sm font-bold">Cancelar</button>
                    <button onClick={() => { onSave(); onClose(); }} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-purple-900/20">Guardar</button>
                </div>
            </div>
        </ModalBackdrop>
    );
};

// --- 2. Roster Selector Modal ---
const RosterSelectorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teamName: string;
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

// --- 3. Grid Components ---
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
    onOpenModal: (e: React.MouseEvent) => void;
    isLocked?: boolean;
}> = ({ value, onOpenModal, isLocked }) => {
    const [tempUnlocked, setTempUnlocked] = useState(false);
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
            onClick={(e) => { if (!effectivelyLocked) onOpenModal(e); }}
            className={`relative w-full h-full min-h-[40px] flex items-center justify-center outline-none cursor-pointer`}
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

// --- 4. Scoring Modal ---
const ScoringModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (val: string) => void;
    position: { x: number, y: number } | null;
}> = ({ isOpen, onClose, onSelect, position }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isOpen || !position || isMobile) return;

        // Desktop Clamping Logic
        const width = 300;
        const height = 350; // Approx height
        const padding = 20;

        let left = position.x - (width / 2);
        let top = position.y + 20; // Default below

        // Clamp Horizontal
        if (left < padding) left = padding;
        if (left + width > window.innerWidth - padding) left = window.innerWidth - width - padding;

        // Clamp Vertical (flip if too low)
        if (top + height > window.innerHeight - padding) {
            top = position.y - height - 10;
        }

        setStyle({ top, left });
    }, [isOpen, position, isMobile]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const mainActions = [
        { label: 'OUT', val: 'X', icon: <X size={20} />, color: 'bg-[#2A1818] text-[#FF5555] border-[#FF5555]/30 hover:bg-[#FF5555]/20' },
        { label: 'HIT', val: 'H', icon: <CheckCircle2 size={20} />, color: 'bg-[#0F281D] text-[#4ADE80] border-[#4ADE80]/30 hover:bg-[#4ADE80]/20' },
        { label: 'S', val: 'S', icon: <span className="font-black text-lg">S</span>, color: 'bg-[#1E1E24] text-white border-white/20 hover:bg-white/10' },
        { label: 'ERR', val: 'E', icon: <AlertCircle size={20} />, color: 'bg-[#2A2410] text-[#FACC15] border-[#FACC15]/30 hover:bg-[#FACC15]/20' },
        { label: 'CARRERA', val: '●', icon: <Circle size={20} fill="currentColor" />, color: 'bg-[#BE123C] text-white border-[#F43F5E]/50 hover:bg-[#E11D48] shadow-[0_0_15px_rgba(225,29,72,0.4)]' },
        { label: 'SUB', val: '⇄', icon: <ArrowRightLeft size={20} />, color: 'bg-[#1E1B2E] text-[#A78BFA] border-[#A78BFA]/30 hover:bg-[#A78BFA]/20' },
        { label: 'FIN INN', val: '■', icon: <Square size={20} fill="currentColor" />, color: 'bg-[#271A0C] text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/20' },
    ];

    const content = (
        <div
            ref={modalRef}
            className={`bg-[#0f0f13] border border-white/10 p-4 rounded-3xl shadow-2xl flex flex-col gap-3 ring-1 ring-white/5 ${isMobile ? 'w-auto max-w-[95vw]' : 'w-[280px]'}`}
        >
            <div className="grid grid-cols-3 gap-2">
                {mainActions.map((a) => (
                    <button
                        key={a.label}
                        onClick={() => { onSelect(a.val); onClose(); }}
                        className={`flex flex-col items-center justify-center aspect-square rounded-xl border transition-all active:scale-95 ${a.color}`}
                    >
                        <div className="mb-1">{a.icon}</div>
                        <span className="text-[10px] font-black uppercase tracking-wider">{a.label}</span>
                    </button>
                ))}
            </div>
            <div className="h-px w-full bg-white/10 my-1"></div>
            <div className="grid grid-cols-3 gap-2">
                {['Ex1B', 'Ex2B', 'Ex3B'].map((val) => (
                    <button
                        key={val}
                        onClick={() => { onSelect(val); onClose(); }}
                        className="py-2 bg-[#172554] border border-[#3B82F6]/30 rounded-lg text-[#60A5FA] font-black text-[10px] uppercase hover:bg-[#1E3A8A] transition-colors"
                    >
                        {val}
                    </button>
                ))}
            </div>
            <button
                onClick={() => { onSelect(''); onClose(); }}
                className="w-full py-3 bg-[#2A1215] hover:bg-[#45151A] border border-[#EF4444]/20 rounded-xl text-[#F87171] font-black text-xs uppercase flex items-center justify-center gap-2 transition-colors"
            >
                <Trash2 size={16} /> BORRAR
            </button>
        </div>
    );

    return createPortal(
        isMobile ? (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                {content}
            </div>
        ) : (
            <div className="fixed z-[9999]" style={style}>
                {content}
            </div>
        ),
        document.body
    );
};

// --- Main Page Component ---
export const OfficialScoreSheetPage: React.FC = () => {
    const { matchId, setNumber, tournamentId } = useParams<{ matchId: string, setNumber: string, tournamentId: string }>();
    const navigate = useNavigate();

    // Core State
    const [gameState, setGameState] = useState<ScoreCardState | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [officials, setOfficials] = useState<OfficialsData>({ plate: '', field1: '', field2: '', field3: '', table: '' });
    const [isReadOnly, setIsReadOnly] = useState(false);

    // UI State
    const [visibleInnings, setVisibleInnings] = useState(5);
    const [rosterModalOpen, setRosterModalOpen] = useState<{ isOpen: boolean, team: 'visitor' | 'local', slotIdx: number, type: 'starter' | 'sub' } | null>(null);
    const [scoringModal, setScoringModal] = useState<{ isOpen: boolean, pos: { x: number, y: number } | null, slotIdx: number, type: 'starter' | 'sub', inningIdx: number, scoreIdx: number, team: 'visitor' | 'local' } | null>(null);
    const [officialsOpen, setOfficialsOpen] = useState(false);

    const [rosters, setRosters] = useState<{ visitor: RosterItem[], local: RosterItem[] }>({ visitor: [], local: [] });
    const [resetModal, setResetModal] = useState(false);
    const [matchData, setMatchData] = useState<any | null>(null);
    const [hasStarted, setHasStarted] = useState(false);

    // Actions
    const handleClearScores = async () => {
        if (isReadOnly) {
            setResetModal(true);
            return;
        }
        if (!gameState || !confirm("¿Estás seguro de que quieres BORRAR TODAS las anotaciones y reiniciar la planilla? Esta acción no se puede deshacer.")) return;

        performClear();
    };

    const performClear = async (resetStatus = false) => {
        const newState = { ...initialState };
        // Preserve game info but reset scores
        newState.gameInfo = { ...gameState!.gameInfo };
        newState.visitorTeam = createEmptyTeam();
        newState.localTeam = createEmptyTeam();

        setGameState(newState);

        const payload: any = { status: resetStatus ? 'pending' : 'live' }; // or keep current status if not resetting?
        // Actually if we clear, we usually keep 'live' or whatever it was. 
        // But if resetStatus is true, we force 'pending' (or 'live' but not 'finished').
        if (resetStatus) {
            payload.status = 'pending';
            setIsReadOnly(false);
        }

        await saveToDB(newState, null); // Save new empty state
        if (resetStatus) {
            await supabase.from('tournament_sets').update({ status: 'pending' }).eq('match_id', matchId).eq('set_number', setNumber);
        }
    };

    const confirmReset = async () => {
        setResetModal(false);
        await performClear(true);
        alert("El Set ha sido reiniciado a estado PENDING y la planilla limpiada.");
    };

    // Load Data
    useEffect(() => {
        if (!matchId || !setNumber) return;
        const load = async () => {
            try {
                // Fetch Match + Teams
                const { data: match, error: matchErr } = await supabase.from('tournament_matches')
                    .select(`*, local_team:tournament_teams!local_team_id (*), visitor_team:tournament_teams!visitor_team_id (*)`)
                    .eq('id', matchId).single();

                if (matchErr || !match) {
                    console.error("Error loading match:", matchErr);
                    setLoading(false);
                    return;
                }
                setMatchData(match);

                // Fetch Referee Manually
                let refereeData = null;
                if (match.referee_id) {
                    const { data: r } = await supabase.from('tournament_referees').select('*').eq('id', match.referee_id).maybeSingle();
                    refereeData = r;
                }
                const fullMatch = { ...match, referee: refereeData };

                // Fetch Rosters
                const { data: vRoster } = await supabase.from('tournament_rosters').select('*').eq('team_id', fullMatch.visitor_team_id);
                const { data: lRoster } = await supabase.from('tournament_rosters').select('*').eq('team_id', fullMatch.local_team_id);
                setRosters({ visitor: vRoster || [], local: lRoster || [] });

                // Fetch Set
                const { data: setRec } = await supabase.from('tournament_sets').select('*').eq('match_id', matchId).eq('set_number', setNumber).single();

                if (setRec) {
                    let finalState = { ...initialState };

                    if (setRec.state_json) {
                        // Merge top-level keys to ensure structure exists
                        finalState = {
                            ...initialState,
                            ...setRec.state_json,
                            // Ensure nested objects that we rely on are also merged/present
                            gameInfo: { ...initialState.gameInfo, ...(setRec.state_json.gameInfo || {}) },
                            totals: { ...initialState.totals, ...(setRec.state_json.totals || {}) },
                            errors: { ...initialState.errors, ...(setRec.state_json.errors || {}) },
                            inningScores: { ...initialState.inningScores, ...(setRec.state_json.inningScores || {}) },
                            timeouts: { ...initialState.timeouts, ...(setRec.state_json.timeouts || {}) },
                        };

                        // Inject timings from DB
                        finalState.gameInfo.startTime = setRec.start_time;
                        finalState.gameInfo.endTime = setRec.end_time;

                    } else {
                        // Init Defaults from scratch
                        finalState.gameInfo = {
                            ...finalState.gameInfo,
                            visitor: fullMatch.visitor_team?.name || 'Visitante',
                            home: fullMatch.local_team?.name || 'Local',
                            visitorLogo: fullMatch.visitor_team?.logo_url,
                            homeLogo: fullMatch.local_team?.logo_url,
                            gameNum: fullMatch.id,
                            setNum: setNumber,
                            startTime: setRec.start_time,
                            endTime: setRec.end_time
                        };
                    }

                    if (setRec.status === 'finished') {
                        setIsReadOnly(true);
                    }

                    if (setRec.start_time) {
                        setHasStarted(true);
                    }

                    setGameState(finalState);

                    // Officials
                    if (setRec.officials_json) {
                        setOfficials(setRec.officials_json);
                    } else if (fullMatch.referee) {
                        setOfficials(prev => ({ ...prev, table: `${fullMatch.referee.first_name} ${fullMatch.referee.last_name}` }));
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [matchId, setNumber]);

    // Save Logic
    const saveToDB = async (newState: ScoreCardState | null, newOfficials: OfficialsData | null, extraPayload: any = {}) => {
        if (!matchId || !setNumber) return;
        setSaving(true);
        try {
            const payload: any = { ...extraPayload };

            // Start Time Logic: If first meaningful edit (newState present) and no start_time, set it.
            if (newState && !isReadOnly) {
                // We need to check if start_time is already set in DB or local state. 
                // Since we don't hold 'start_time' in local 'gameState' explicitly, we rely on the DB read or previous knowledge.
                // A simple optimization: check if setRec.start_time was loaded. 
                // However, we didn't save it to state. Let's do a quick conditional update or check `lastSaved`.
                // If `lastSaved` is null, this might be the first save. 

                // Better approach: We can blindly try to set start_time if it's null using SQL, but supabase .update doesn't support conditional "set if null" easily in one go without RLS or stored proc.
                // We will check a ref or state. Let's assume if it's the first save of the session and we know it wasn't started, we send it.
                // For now, let's just trigger it if we are setting 'ongoing' status or simply on every save check? No, too many writes.

                // Let's use the 'status' transition. If status goes from 'scheduled' or 'pending' to 'live', we set start_time.
                // But we don't always change status explicitly.

                // Let's just fetch it once on load (we did). We need a ref to know if we started.
                // Actually `matchData` has the match, but we need the Set.
                // Let's add a `setRecord` state to track this metadata? Or just one-off.
            }

            if (newState) {
                // Simplified stat calc for metadata
                // Calculate Stats for columns
                const calcStats = (team: TeamData, manualRuns: string[]) => {
                    let hits = 0, errors = 0, runs = 0;
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

                newState.totals.visitor = vStats.runs.toString();
                newState.totals.local = lStats.runs.toString();
                newState.errors.visitor = vStats.errors.toString();
                newState.errors.local = lStats.errors.toString();

                payload.state_json = newState;
                payload.away_score = vStats.runs;
                payload.home_score = lStats.runs;
                payload.away_hits = vStats.hits;
                payload.home_hits = lStats.hits;
                payload.away_errors = vStats.errors;
                payload.home_errors = lStats.errors;

                // Sync Inning Columns explicitly
                const mapInnings = (t: TeamData, pre: 'vis' | 'loc') => {
                    for (let i = 0; i < 10; i++) {
                        let r = 0;
                        t.slots.forEach(s => [s.starter, s.sub].forEach(p =>
                            p.scores[i]?.forEach(v => { if (v?.includes('●')) r++; })
                        ));
                        const key = (i + 1) <= 5 ? `${pre}_inn${i + 1}` : `${pre}_ex${i + 1}`;
                        payload[key] = r;
                    }
                };
                mapInnings(newState.visitorTeam, 'vis');
                mapInnings(newState.localTeam, 'loc');
            }

            if (newOfficials) {
                payload.officials_json = newOfficials;
            }

            // TIMING LOGIC: If this is the FIRST SAVE (lastSaved is null) and status is not finished, we assume it's starting.
            // This is a heuristic. A better way: check if DB `start_time` is null.
            // We'll let the backend or a separate check handle duplicates, or just update it if we are sure.
            // Let's do a separate conditional update for start_time if we haven't tracked it locally.
            // For now, we'll SKIP automatic start_time in `saveToDB` generic call to avoid overwriting or complexity, 
            // and instead rely on `handleScoreUpdate` or similar to trigger a "Start Set" event if needed.

            // TIMING LOGIC: If first meaningful edit and not started, set start_time
            if (!hasStarted && !isReadOnly && newState) {
                const now = new Date().toISOString();
                payload.start_time = now;

                // If this is set 1, also set match start_time if not set
                if (setNumber === '1' && matchData && !matchData.start_time) {
                    await supabase.from('tournament_matches').update({ start_time: now }).eq('id', matchId);
                }

                setHasStarted(true);
                if (tournamentId) {
                    logTournamentActivity(tournamentId, 'set_start', `Set ${setNumber} Iniciado`, { matchId, setNumber });
                }
            }

            await supabase.from('tournament_sets').update(payload).eq('match_id', matchId).eq('set_number', setNumber);
            setLastSaved(new Date());
        } catch (e) {
            console.error("Save error:", e);
        } finally {
            setSaving(false);
        }
    };

    // Wrapper to update state and save
    const updateState = (updater: (prev: ScoreCardState) => ScoreCardState) => {
        setGameState(prev => {
            if (!prev) return null;
            const next = updater({ ...prev });

            // Fire and forget save
            saveToDB(next, null);
            return next;
        });
    };

    // Auxiliary function to handle start time updates safely
    const checkAndSetStartTime = async () => {
        // This should be called when a scoring action happens
        // We need access to the current Set record or a ref. 
        // Implementation deferred to `handleScoreUpdate` for cleaner flow.
    }

    const handleWinner = async (team: 'visitor' | 'local') => {
        if (!gameState || !confirm(`¿Confirmar que ${team === 'visitor' ? gameState.gameInfo.visitor : gameState.gameInfo.home} ganó este SET?`)) return;

        const winScore = team === 'visitor' ? gameState.totals.visitor : gameState.totals.local;
        const loseScore = team === 'visitor' ? gameState.totals.local : gameState.totals.visitor;
        const winnerName = team === 'visitor' ? gameState.gameInfo.visitor : gameState.gameInfo.home;
        const endTime = new Date().toISOString();

        const newState: ScoreCardState = {
            ...gameState,
            winner: { name: winnerName, score: `${winScore}-${loseScore}`, isVisitor: team === 'visitor' },
            gameInfo: {
                ...gameState.gameInfo,
                endTime: endTime // Update visible end time immediately
            }
        };
        setGameState(newState);

        // Single Update for everything: State + Status + Stats + End Time
        await saveToDB(newState, null, {
            status: 'finished',
            end_time: endTime
        });

        // LOG ACTIVITY
        if (tournamentId) {
            logTournamentActivity(tournamentId, 'set_end', `Set ${setNumber} Finalizado: ${winnerName} ganó ${winScore}-${loseScore}`, { matchId, setNumber, winner: team });
        }

        alert("Set Finalizado correctamente.");

        // --- MATCH WIN CHECK LOGIC ---
        if (matchData) {
            // Fetch all sets to check series status - RELOAD to be safe
            const { data: sets } = await supabase.from('tournament_sets').select('*').eq('match_id', matchId);

            if (sets) {
                // Calculate series Wins
                let vWins = 0;
                let lWins = 0;

                // Set Config Logic
                const isSingleSet = matchData.is_single_set === true || matchData.set_number === '1 Set' || matchData.set_number === 1;
                const setsToWin = isSingleSet ? 1 : 2;

                const currentSetNum = parseInt(setNumber);

                const allSetNumbers = new Set([...sets.map(s => s.set_number), currentSetNum]);

                allSetNumbers.forEach(num => {
                    let setWinner = '';

                    if (num === currentSetNum) {
                        setWinner = team; // The user just clicked "Winner Visitor/Local"
                    } else {
                        const s = sets.find(sx => sx.set_number === num);
                        if (s && s.status === 'finished') {
                            const vR = s.away_score ?? s.visitor_runs ?? 0;
                            const lR = s.home_score ?? s.local_runs ?? 0;
                            if (vR > lR) setWinner = 'visitor';
                            else if (lR > vR) setWinner = 'local';
                        }
                    }

                    if (setWinner === 'visitor') vWins++;
                    if (setWinner === 'local') lWins++;
                });

                console.log(`Match Win Check: V=${vWins}, L=${lWins}, Goal=${setsToWin}`);

                let matchWinnerId = null;
                if (vWins >= setsToWin) matchWinnerId = matchData.visitor_team_id;
                if (lWins >= setsToWin) matchWinnerId = matchData.local_team_id;

                if (matchWinnerId) {
                    const { error: matchUpdateError } = await supabase.from('tournament_matches').update({
                        status: 'finished',
                        winner_team_id: matchWinnerId
                    }).eq('id', matchId);

                    if (!matchUpdateError && tournamentId) {
                        logTournamentActivity(tournamentId, 'match_end', `Partido Finalizado. Ganador: ${team === 'visitor' ? matchData.visitor_team?.name : matchData.local_team?.name}`, { matchId });
                    }

                    if (matchUpdateError) {
                        console.error('Error updating match winner:', matchUpdateError);
                    } else {
                        alert(`¡Partido Finalizado! Ganador: ${team === 'visitor' ? matchData.visitor_team?.name : matchData.local_team?.name}`);
                    }
                }
            }
        }

        // Close / Go Back
        navigate(-1);
    };



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
        if (!scoringModal || !gameState || isReadOnly) return;
        const { team, slotIdx, type, inningIdx, scoreIdx } = scoringModal;
        const teamKey = team === 'visitor' ? 'visitorTeam' : 'localTeam';

        let valToUse = val;
        let shouldScroll = false;

        if (val === 'X') {
            const currentTeamData = gameState[teamKey];
            let outs = 0;
            // Count outs in this inning
            currentTeamData.slots.forEach(s =>
                [s.starter, s.sub].forEach(p =>
                    (p.scores[inningIdx] || []).forEach(v => { if (v?.includes('X')) outs++; })
                )
            );

            const currentCellVal = currentTeamData.slots[slotIdx][type].scores[inningIdx]?.[scoreIdx] || '';
            // If we are at 2 outs and adding a new one (not editing existing out)
            if (outs === 2 && !currentCellVal.includes('X')) {
                valToUse = val + '■';
                shouldScroll = true;
            }
        }

        updateState(prev => {
            // Immutable update for slots
            const newSlots = prev[teamKey].slots.map((slot, idx) => {
                if (idx !== slotIdx) return slot;

                const newPlayer = { ...slot[type] };
                newPlayer.scores = [...newPlayer.scores];

                if (!newPlayer.scores[inningIdx]) {
                    newPlayer.scores[inningIdx] = [''];
                } else {
                    newPlayer.scores[inningIdx] = [...newPlayer.scores[inningIdx]];
                }

                return { ...slot, [type]: newPlayer };
            });

            const newTeam = { ...prev[teamKey], slots: newSlots };
            const currentScores = newTeam.slots[slotIdx][type].scores[inningIdx];
            const currentVal = currentScores[scoreIdx] || '';
            let finalVal = valToUse;

            if (valToUse === '') {
                finalVal = '';
            } else if (['●', '■', '⇄'].includes(valToUse)) {
                // Toggle Modifier Logic
                if (currentVal.includes(valToUse)) {
                    finalVal = currentVal.replace(valToUse, '');
                } else {
                    finalVal = currentVal + valToUse;
                }
            } else {
                // Composite Logic: Base + Modifiers
                // Extract valid mods from input (handle composite input like "X■")
                const inputBase = valToUse.replace(/[●■⇄]/g, '');
                const inputMods = valToUse.split('').filter(c => ['●', '■', '⇄'].includes(c));

                // Keep existing mods that aren't in input (to avoid dupes if input has them)
                // Actually, usually we merge.
                const existingMods = currentVal.split('').filter(c => ['●', '■', '⇄'].includes(c));
                const allMods = Array.from(new Set([...existingMods, ...inputMods])).join('');

                finalVal = inputBase + allMods;
            }

            currentScores[scoreIdx] = finalVal;
            return { ...prev, [teamKey]: newTeam };
        });

        if (shouldScroll) {
            setTimeout(() => {
                const targetId = team === 'visitor' ? 'team-grid-local' : 'team-grid-visitor';
                const el = document.getElementById(targetId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    };

    const addInningColumn = (ingIdx: number) => {
        if (isReadOnly) return;
        updateState(prev => {
            const currentLayout = prev.inningLayout || Array(9).fill(1);
            const newLayout = [...currentLayout];
            if (newLayout[ingIdx] < 4) newLayout[ingIdx]++; // Limit to 4 cols
            return { ...prev, inningLayout: newLayout };
        });
    };

    // Calculate current outs for display
    const currentOuts = useMemo(() => {
        if (!gameState) return 0;
        for (let i = 0; i < 9; i++) { // Check all 9 possible innings
            const countOuts = (t: TeamData) => {
                if (!t || !t.slots) return 0;
                let o = 0;
                t.slots.forEach(s => {
                    [s.starter, s.sub].forEach(p => {
                        // Check all columns in this inning (flatten)
                        const inningScores = p.scores?.[i] || [];
                        inningScores.forEach(sc => {
                            if (sc?.includes('X') || sc?.includes('K')) o++;
                        });
                    });
                });
                return o;
            };

            const vOuts = countOuts(gameState.visitorTeam);
            if (vOuts < 3) return vOuts;
            const lOuts = countOuts(gameState.localTeam);
            if (lOuts < 3) return lOuts;
        }
        return 0;
    }, [gameState]);

    if (loading || !gameState) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    // Grid Renderer - Updated to Double Row with proper styling
    const renderTeamGrid = (teamKey: 'visitor' | 'local', teamData: TeamData, roster: RosterItem[], color: string) => (
        <div id={`team-grid-${teamKey}`} className="bg-[#1e1e24] rounded-xl overflow-hidden border border-white/5 mb-8 scroll-mt-24">
            <div className={`p-3 ${color} text-black font-bold flex justify-between items-center`}>
                <div className="flex items-center gap-4">
                    <span className="bg-black/20 px-3 py-1 rounded text-xs font-black uppercase tracking-widest">Alineación {gameState.gameInfo?.[teamKey === 'visitor' ? 'visitor' : 'home'] || (teamKey === 'visitor' ? 'Visitante' : 'Local')}</span>
                    <span className="text-xl uppercase font-black opacity-80">{teamKey === 'visitor' ? 'VISITANTE' : 'LOCAL'}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr className="bg-[#2A2A35] text-[10px] text-white/50 uppercase font-black tracking-wider">
                            <th className="p-3 text-center w-10 border-r border-white/5">#</th>
                            <th className="p-3 text-center w-10 border-r border-white/5">NO.</th>
                            <th className="p-3 text-left min-w-[200px] border-r border-white/5">Jugador</th>
                            <th className="p-3 w-10 border-r border-white/5">Sex</th>
                            <th className="p-3 w-12 border-r border-white/5">Pos</th>
                            {Array.from({ length: visibleInnings }).map((_, i) => {
                                const colCount = (gameState.inningLayout || Array(9).fill(1))[i];
                                return (
                                    <th key={i} colSpan={colCount} className="p-1 min-w-[60px] border-l border-white/5 text-center align-bottom pb-2 relative group">
                                        <div className="flex items-center justify-center gap-1">
                                            <span>{i + 1}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); addInningColumn(i); }}
                                                className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-white/50 hover:text-white transition-colors"
                                                title="Añadir columna"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </th>
                                );
                            })}
                            <th className="p-2 border-l border-white/5 w-12 text-center">
                                <button
                                    onClick={() => setVisibleInnings(p => Math.min(p + 1, 9))}
                                    className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all active:scale-95 hover:scale-110"
                                    title="Añadir Inning"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {(teamData?.slots || []).map((slot, idx) => {
                            // We render TWO rows per slot: Starter and Sub
                            return (
                                <React.Fragment key={idx}>
                                    <tr className="bg-[#1e1e24] border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
                                        <td className="p-0 border-r border-white/5 font-black text-xl text-white/30">{idx + 1}</td>
                                        <td className="p-0 border-r border-white/5 font-bold text-white/70">{slot.starter.number}</td>

                                        <td className="p-2 text-left cursor-pointer border-r border-white/5 relative group"
                                            onClick={() => setRosterModalOpen({ isOpen: true, team: teamKey, slotIdx: idx, type: 'starter' })}
                                        >
                                            {slot.starter.name ? (
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-white group-hover:text-blue-300 transition-colors">{slot.starter.name}</span>
                                                    <span className="text-xs bg-white/10 px-1.5 rounded text-white/50">#{slot.starter.number}</span>
                                                </div>
                                            ) : (
                                                <span className="text-white/20 italic font-medium">Nombre Titular</span>
                                            )}
                                        </td>

                                        <td className="p-0 border-r border-white/5 text-xs text-white/40">-</td>
                                        <td className="p-0 border-r border-white/5 text-xs font-bold text-white/80">{slot.starter.pos || '-'}</td>

                                        {Array.from({ length: visibleInnings }).map((_, innIdx) => {
                                            const cols = (gameState.inningLayout || Array(9).fill(1))[innIdx];
                                            return Array.from({ length: cols }).map((_, colIdx) => (
                                                <td key={`st-${innIdx}-${colIdx}`} className={`p-0 border-l ${colIdx === 0 ? 'border-white/10' : 'border-white/5'} h-10 w-12 relative`}>
                                                    <ScoreCell
                                                        value={slot.starter.scores[innIdx]?.[colIdx] || ''}
                                                        onOpenModal={(e) => setScoringModal({
                                                            isOpen: true, pos: { x: e.clientX, y: e.clientY },
                                                            team: teamKey, slotIdx: idx, type: 'starter', inningIdx: innIdx, scoreIdx: colIdx
                                                        })}
                                                    />
                                                </td>
                                            ));
                                        })}
                                        {/* Filler for Button Column */}
                                        <td className="border-l border-white/5 bg-[#1e1e24]"></td>
                                    </tr>

                                    <tr className="bg-[#18181b] border-b border-white/10 text-xs">
                                        <td className="p-1 border-r border-white/5 text-[9px] font-bold text-white/30 uppercase tracking-widest">SUB</td>
                                        <td className="p-0 border-r border-white/5 font-bold text-white/50">{slot.sub.number}</td>

                                        <td className="p-2 text-left cursor-pointer border-r border-white/5 relative group"
                                            onClick={() => setRosterModalOpen({ isOpen: true, team: teamKey, slotIdx: idx, type: 'sub' })}
                                        >
                                            {slot.sub.name ? (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-blue-200/80 group-hover:text-blue-200 transition-colors">{slot.sub.name}</span>
                                                    <span className="text-[10px] bg-white/5 px-1 rounded text-white/30">#{slot.sub.number}</span>
                                                </div>
                                            ) : (
                                                <span className="text-white/10 italic">Sustituto</span>
                                            )}
                                        </td>

                                        <td className="p-0 border-r border-white/5 text-white/20">-</td>
                                        <td className="p-0 border-r border-white/5 text-white/40">{slot.sub.pos || '-'}</td>

                                        {Array.from({ length: visibleInnings }).map((_, innIdx) => {
                                            const cols = (gameState.inningLayout || Array(9).fill(1))[innIdx];
                                            return Array.from({ length: cols }).map((_, colIdx) => (
                                                <td key={`sub-${innIdx}-${colIdx}`} className={`p-0 border-l ${colIdx === 0 ? 'border-white/10' : 'border-white/5'} h-8 w-12 relative bg-black/20`}>
                                                    <ScoreCell
                                                        value={slot.sub.scores[innIdx]?.[colIdx] || ''}
                                                        onOpenModal={(e) => setScoringModal({
                                                            isOpen: true, pos: { x: e.clientX, y: e.clientY },
                                                            team: teamKey, slotIdx: idx, type: 'sub', inningIdx: innIdx, scoreIdx: colIdx
                                                        })}
                                                    />
                                                </td>
                                            ));
                                        })}
                                        {/* Filler for Button Column */}
                                        <td className="border-l border-white/5 bg-[#18181b]"></td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-purple-500/30">
            {/* --- TOP HEADER --- */}
            <header className="bg-[#1e1e24] border-b border-white/5 pb-4">
                {/* 1. Navbar Actions */}
                <div className="flex items-center justify-between px-4 py-2 mb-2">
                    <div className="flex gap-2 items-center">
                        <button onClick={handleClearScores} className={`p-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 rounded-lg text-red-400 transition-colors ${isReadOnly ? 'animate-pulse' : ''}`} title={isReadOnly ? "Reiniciar Set" : "Limpiar Planilla"}>
                            <RotateCcw size={20} />
                        </button>
                        <button onClick={() => setOfficialsOpen(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-purple-400 hover:text-purple-300 transition-colors" title="Oficiales">
                            <ClipboardList size={20} />
                        </button>
                        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors" title="Descargar PDF">
                            <Download size={20} />
                        </button>
                        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-green-400 hover:text-green-300 transition-colors" title="Captura">
                            <Camera size={20} />
                        </button>
                        {isReadOnly && (
                            <div className="ml-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                                <AlertTriangle size={16} className="text-yellow-500" />
                                <span className="text-[10px] md:text-xs font-black text-yellow-500 uppercase tracking-wider">Solo Lectura</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center flex flex-col items-center">
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/50 uppercase tracking-widest">
                            Match {gameState?.gameInfo?.gameNum?.slice(0, 4) || '??'} • Set {setNumber}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-white/40 bg-black/20 px-2 py-0.5 rounded border border-white/5">
                            <div className="flex items-center gap-1">
                                <span className="text-white/20">INICIO:</span>
                                <span className={gameState?.gameInfo?.startTime ? "text-green-400/80" : "text-white/20"}>
                                    {gameState?.gameInfo?.startTime ? new Date(gameState.gameInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </span>
                            </div>
                            <div className="w-px h-3 bg-white/10"></div>
                            <div className="flex items-center gap-1">
                                <span className="text-white/20">FIN:</span>
                                <span className={gameState?.gameInfo?.endTime ? "text-red-400/80" : "text-white/20"}>
                                    {gameState?.gameInfo?.endTime ? new Date(gameState.gameInfo.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-[100px] flex justify-end">
                        {saving && <Loader2 size={16} className="animate-spin text-white/30" />}
                    </div>
                </div>

                {/* 2. Match Scoreboard (Centered) */}
                <div className="flex items-center justify-center gap-8 px-4">
                    {/* Visitor */}
                    <div className="flex flex-col items-center gap-2 w-32">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                {gameState.gameInfo?.visitorLogo ? <img src={gameState.gameInfo.visitorLogo} className="w-full h-full object-cover" /> : <span className="text-2xl font-black text-purple-500">V</span>}
                            </div>
                            {gameState.winner?.isVisitor && <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full shadow-lg border border-white"><Trophy size={14} /></div>}
                        </div>
                        <h2 className="text-lg font-black uppercase text-center leading-none">{gameState.gameInfo?.visitor || 'Visitante'}</h2>
                        <button onClick={() => handleWinner('visitor')} className="text-[10px] px-2 py-0.5 bg-green-900/30 text-green-400 border border-green-500/20 rounded hover:bg-green-500 hover:text-white transition-colors">
                            MARCAR GANADOR
                        </button>
                    </div>

                    {/* VS / Score */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-6xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                            {gameState.totals?.visitor || 0} - {gameState.totals?.local || 0}
                        </div>
                        <div className="flex gap-2 mb-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-4 h-4 rounded-full border-2 border-red-500/50 ${i <= currentOuts ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-transparent'}`} />
                            ))}
                        </div>
                        <div className="flex gap-4 text-[10px] text-white/40 font-mono uppercase tracking-widest">
                            <span>H: {gameState.gameInfo?.visitor || 'VISITANTES'} ERR: {gameState.errors?.visitor || 0}</span>
                            <span>|</span>
                            <span>H: {gameState.gameInfo?.home || 'LOCALES'} ERR: {gameState.errors?.local || 0}</span>
                        </div>
                        <div className="mt-1 px-3 py-0.5 bg-white/5 rounded-full text-[10px] font-bold text-white/60">
                            EN JUEGO
                        </div>
                    </div>

                    {/* Local */}
                    <div className="flex flex-col items-center gap-2 w-32">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                {gameState.gameInfo?.homeLogo ? <img src={gameState.gameInfo.homeLogo} className="w-full h-full object-cover" /> : <span className="text-2xl font-black text-cyan-500">L</span>}
                            </div>
                            {gameState.winner?.isVisitor === false && <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full shadow-lg border border-white"><Trophy size={14} /></div>}
                        </div>
                        <h2 className="text-lg font-black uppercase text-center leading-none">{gameState.gameInfo?.home || 'Local'}</h2>
                        <button onClick={() => handleWinner('local')} className="text-[10px] px-2 py-0.5 bg-green-900/30 text-green-400 border border-green-500/20 rounded hover:bg-green-500 hover:text-white transition-colors">
                            MARCAR GANADOR
                        </button>
                    </div>
                </div>
            </header>

            {/* --- MAIN GRID CONTENT --- */}
            <main className="max-w-6xl mx-auto p-4 flex flex-col gap-8">
                {renderTeamGrid('visitor', gameState.visitorTeam, rosters.visitor, 'bg-purple-400')}
                {renderTeamGrid('local', gameState.localTeam, rosters.local, 'bg-amber-400')}
            </main>

            {/* Modals */}
            <OfficialsModal
                isOpen={officialsOpen} onClose={() => setOfficialsOpen(false)}
                data={officials}
                onChange={(k, v) => setOfficials(prev => ({ ...prev, [k]: v }))}
                onSave={() => saveToDB(null, officials)}
            />
            <RosterSelectorModal
                isOpen={!!rosterModalOpen}
                onClose={() => setRosterModalOpen(null)}
                teamName={rosterModalOpen?.team === 'visitor' ? (gameState?.gameInfo?.visitor || 'Visitante') : (gameState?.gameInfo?.home || 'Local')}
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
