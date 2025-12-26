import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle, ListOrdered, Users, CheckCircle2, ChevronRight, Hash, PlayCircle, Loader2, RotateCcw, Dice6, Dices, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { TieBreakerRule, TournamentTeam, TournamentMatch, TournamentSet, Tournament } from '../types/tournament';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTiebreakerStats, sortTeamsByRule, TiebreakerStats } from '../utils/tieBreakerLogic';
import confetti from 'canvas-confetti';

interface TiebreakerModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournament: Tournament | null;
    tiedGroups: { points: number; teams: TournamentTeam[]; rank: number }[];
    matches: TournamentMatch[];
    sets: TournamentSet[];
    onApply: (rankings: { teamId: string, rank: number }[]) => Promise<void>;
}

interface GroupResolution {
    originalRank: number; // e.g., if there's a tie for 1st place
    teams: TournamentTeam[];
    stats: TiebreakerStats[];
    resolved: boolean;
    activeRuleIndex: number;
    isManual?: boolean;
}

export const TiebreakerModal: React.FC<TiebreakerModalProps> = ({
    isOpen,
    onClose,
    tournament,
    tiedGroups,
    matches,
    sets,
    onApply
}) => {
    const rules = useMemo(() => {
        const r = tournament?.tiebreaker_rules || [];
        // Ensure Random is always available as a fallback if not configured, or find it
        const hasRandom = r.some(rule => rule.type === 'random');
        const sorted = [...r].sort((a, b) => a.order - b.order);
        if (!hasRandom) {
            sorted.push({ type: 'random', order: sorted.length + 1, active: true });
        }
        return sorted;
    }, [tournament]);

    const [resolutions, setResolutions] = useState<GroupResolution[]>([]);
    const [isApplying, setIsApplying] = useState(false);
    const [isProcessing, setIsProcessing] = useState<string | null>(null); // groupIdx-ruleIndex
    const [sorteosExecuted, setSorteosExecuted] = useState(0);
    const [showSorteoChoice, setShowSorteoChoice] = useState<number | null>(null); // groupIdx

    // Initialize Resolutions
    useEffect(() => {
        if (isOpen && tiedGroups.length > 0) {
            const initial = tiedGroups.map((group) => {
                const teamsWithStats = calculateTiebreakerStats(group.teams, matches, sets);
                return {
                    originalRank: group.rank,
                    teams: [...group.teams],
                    stats: teamsWithStats,
                    resolved: false,
                    activeRuleIndex: 0
                };
            });
            setResolutions(initial);
            setSorteosExecuted(0);
        }
    }, [isOpen, tiedGroups, matches, sets]);

    const handleApplyRule = async (groupIdx: number) => {
        const group = resolutions[groupIdx];
        const rule = rules[group.activeRuleIndex];
        if (!rule) return;

        if (rule.type === 'random') {
            setShowSorteoChoice(groupIdx);
            return;
        }

        setIsProcessing(`${groupIdx}-${group.activeRuleIndex}`);

        // Simulate calculation time for "premium" feel
        await new Promise(r => setTimeout(r, 1500));

        const sorted = sortTeamsByRule(group.teams, group.stats, rule.type);

        // Check if still tied for any consecutive pairs
        let stillTied = false;
        for (let i = 0; i < sorted.length - 1; i++) {
            const sA = group.stats.find(s => s.teamId === sorted[i].id)!;
            const sB = group.stats.find(s => s.teamId === sorted[i + 1].id)!;

            let valA = 0, valB = 0;
            if (rule.type === 'direct_match') { valA = sA.wins; valB = sB.wins; }
            else if (rule.type === 'run_diff') { valA = sA.runDiff; valB = sB.runDiff; }
            else if (rule.type === 'runs_scored') { valA = sA.runsScored; valB = sB.runsScored; }

            if (valA === valB) {
                stillTied = true;
                break;
            }
        }

        const nextRes = [...resolutions];
        nextRes[groupIdx] = {
            ...group,
            teams: sorted,
            resolved: !stillTied,
            activeRuleIndex: stillTied ? group.activeRuleIndex + 1 : group.activeRuleIndex
        };
        setResolutions(nextRes);
        setIsProcessing(null);

        if (!stillTied) {
            confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
        }
    };

    const handleRandomDraw = async (groupIdx: number, mode: 'auto' | 'manual') => {
        if (sorteosExecuted >= 3) {
            alert("Has alcanzado el límite de 3 sorteos para este torneo.");
            return;
        }

        const group = resolutions[groupIdx];
        setShowSorteoChoice(null);
        setIsProcessing(`${groupIdx}-random`);
        setSorteosExecuted(prev => prev + 1);

        if (mode === 'auto') {
            await new Promise(r => setTimeout(r, 2000));
            // Randomize but ensure distinct values
            const randomizedTeams = [...group.teams].sort(() => Math.random() - 0.5);
            setResolutions(prev => {
                const updated = [...prev];
                updated[groupIdx] = { ...group, teams: randomizedTeams, resolved: true };
                return updated;
            });
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
            // Manual mode keeps it in sorting mode but shows arrows
            setResolutions(prev => {
                const updated = [...prev];
                updated[groupIdx] = { ...group, resolved: false, isManual: true };
                return updated;
            });
        }
        setIsProcessing(null);
    };

    const moveTeam = (groupIdx: number, teamIdx: number, direction: 'up' | 'down') => {
        const group = resolutions[groupIdx];
        const newTeams = [...group.teams];
        const targetIdx = direction === 'up' ? teamIdx - 1 : teamIdx + 1;

        if (targetIdx < 0 || targetIdx >= newTeams.length) return;

        const temp = newTeams[teamIdx];
        newTeams[teamIdx] = newTeams[targetIdx];
        newTeams[targetIdx] = temp;

        setResolutions(prev => {
            const updated = [...prev];
            updated[groupIdx] = { ...group, teams: newTeams };
            return updated;
        });
    };

    const finalizeManual = (groupIdx: number) => {
        setResolutions(prev => {
            const updated = [...prev];
            updated[groupIdx] = { ...updated[groupIdx], resolved: true };
            return updated;
        });
        confetti({ particleCount: 50, spread: 50 });
    };

    const handleSaveResolutions = async () => {
        setIsApplying(true);
        try {
            // Combine all rankings
            const finalRanks: { teamId: string, rank: number }[] = [];
            resolutions.forEach(group => {
                group.teams.forEach((team, idx) => {
                    finalRanks.push({ teamId: team.id, rank: group.originalRank + idx });
                });
            });
            await onApply(finalRanks);
            onClose();
        } catch (e) {
            console.error("Error saving tiebreakers:", e);
        } finally {
            setIsApplying(false);
        }
    };

    const allResolved = resolutions.every(r => r.resolved);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    onClick={onClose}
                />
            </AnimatePresence>

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-4xl bg-[#0f0f1a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header Decoration */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/30">
                            <AlertTriangle className="text-yellow-400" size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Resolución de Desempates</h2>
                            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Ajuste Dinámico de Clasificación</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/20"><X size={24} /></button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {resolutions.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-6">
                            {/* Group Header */}
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-white/40">
                                        <Hash size={16} />
                                    </div>
                                    <h3 className="font-black text-white text-xl italic uppercase tracking-tight">Empate por el {group.originalRank}º puesto</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Regla Activa:</span>
                                    <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20 uppercase">
                                        {rules[group.activeRuleIndex]?.type === 'direct_match' && 'Resultado Directo'}
                                        {rules[group.activeRuleIndex]?.type === 'run_diff' && 'Diferencia Carreras'}
                                        {rules[group.activeRuleIndex]?.type === 'runs_scored' && 'Carreras Anotadas'}
                                        {rules[group.activeRuleIndex]?.type === 'random' && 'Sorteo / Azar'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* Teams List */}
                                <div className="lg:col-span-8 space-y-3">
                                    <div className="grid grid-cols-1 gap-2">
                                        {group.teams.map((team, tIdx) => (
                                            <motion.div
                                                layout
                                                key={team.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ type: 'spring', stifness: 300, damping: 30 }}
                                                className={`p-3 md:p-4 rounded-2xl flex items-center justify-between border transition-all ${group.resolved ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10 shadow-lg'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                                                    <span className="w-6 md:w-8 font-black text-white/20 text-sm md:text-lg">#{group.originalRank + tIdx}</span>
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 border border-white/10 p-1 flex-shrink-0">
                                                        {team.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full rounded-full bg-blue-500/20" />}
                                                    </div>
                                                    <span className="font-bold text-white text-xs md:text-base tracking-tight truncate">{team.name}</span>
                                                </div>

                                                <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                                                    {/* Data preview based on active rule */}
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">
                                                            {rules[group.activeRuleIndex]?.type === 'direct_match' ? 'Wins H2H' :
                                                                rules[group.activeRuleIndex]?.type === 'run_diff' ? 'DC H2H' :
                                                                    rules[group.activeRuleIndex]?.type === 'runs_scored' ? 'CA H2H' : 'Posición'}
                                                        </span>
                                                        <span className="font-black text-blue-400 text-sm md:text-lg">
                                                            {rules[group.activeRuleIndex]?.type === 'direct_match' ? (group.stats.find(s => s.teamId === team.id)?.wins) :
                                                                rules[group.activeRuleIndex]?.type === 'run_diff' ? (group.stats.find(s => s.teamId === team.id)?.runDiff) :
                                                                    rules[group.activeRuleIndex]?.type === 'runs_scored' ? (group.stats.find(s => s.teamId === team.id)?.runsScored) : group.originalRank + tIdx}
                                                        </span>
                                                    </div>

                                                    {/* Manual Movement Controls */}
                                                    {rules[group.activeRuleIndex]?.type === 'random' && !group.resolved && (
                                                        <div className="flex flex-col gap-1">
                                                            <button onClick={() => moveTeam(groupIdx, tIdx, 'up')} className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white transition-all"><ChevronUp size={16} /></button>
                                                            <button onClick={() => moveTeam(groupIdx, tIdx, 'down')} className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white transition-all"><ChevronDown size={16} /></button>
                                                        </div>
                                                    )}

                                                    {group.resolved && <CheckCircle2 className="text-green-500" size={20} md:size={24} />}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rule Action Card */}
                                <div className="lg:col-span-4 space-y-4">
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />

                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Accionado por Regla</h4>
                                        <div className="space-y-4">
                                            {!group.resolved ? (
                                                <>
                                                    {rules[group.activeRuleIndex]?.type !== 'random' ? (
                                                        <>
                                                            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                                                <PlayCircle className="text-blue-400 shrink-0" size={20} />
                                                                <p className="text-xs text-blue-100/70 leading-relaxed">
                                                                    Aplicar <span className="font-bold text-white capitalize">{rules[group.activeRuleIndex]?.type.replace('_', ' ')}</span>.
                                                                </p>
                                                            </div>

                                                            <button
                                                                onClick={() => handleApplyRule(groupIdx)}
                                                                disabled={isProcessing !== null}
                                                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black italic uppercase tracking-tighter flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/40 group/btn"
                                                            >
                                                                {isProcessing === `${groupIdx}-${group.activeRuleIndex}` ? (
                                                                    <>
                                                                        <Loader2 className="animate-spin" size={20} />
                                                                        Calculando...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        Ejecutar Regla
                                                                        <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                                                    </>
                                                                )}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center p-6 text-center gap-3 bg-purple-500/5 rounded-2xl border border-purple-500/20">
                                                            <Dices className="text-purple-400" size={32} />
                                                            <div>
                                                                <p className="font-bold text-white uppercase tracking-tight italic">Sorteo Requerido</p>
                                                                {group.isManual ? (
                                                                    <button
                                                                        onClick={() => finalizeManual(groupIdx)}
                                                                        className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase transition-all"
                                                                    >
                                                                        Confirmar Orden
                                                                    </button>
                                                                ) : (
                                                                    <p className="text-[9px] text-white/30 mt-1 uppercase tracking-widest leading-relaxed">Usa el botón inferior para realizar el sorteo.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center p-6 text-center gap-3">
                                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 border border-green-500/30">
                                                        <CheckCircle2 size={32} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white uppercase tracking-tight">¡Resuelto!</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const r = [...resolutions];
                                                            r[groupIdx].resolved = false;
                                                            r[groupIdx].activeRuleIndex = 0;
                                                            setResolutions(r);
                                                        }}
                                                        className="text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-white flex items-center gap-1.5 transition-all mt-2"
                                                    >
                                                        <RotateCcw size={10} /> Reiniciar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Apply & Global Actions */}
                <div className="p-4 md:p-8 border-t border-white/5 bg-black/40 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {/* NEW UNIFIED SORTEO BUTTON + COUNTER POSITION */}
                        <div className="flex-shrink-0">
                            {resolutions.some(r => !r.resolved && rules[r.activeRuleIndex]?.type === 'random' && !r.isManual) ? (
                                <button
                                    onClick={() => {
                                        const gIdx = resolutions.findIndex(r => !r.resolved && rules[r.activeRuleIndex]?.type === 'random' && !r.isManual);
                                        setShowSorteoChoice(gIdx);
                                    }}
                                    disabled={isProcessing !== null || sorteosExecuted >= 3}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-black italic uppercase text-[10px] md:text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-900/40"
                                >
                                    <Dice6 size={14} />
                                    <span>Ejecutar Sorteo ({sorteosExecuted}/3)</span>
                                </button>
                            ) : (
                                <div>
                                    <p className="text-[8px] md:text-xs text-white/40 font-bold uppercase tracking-widest">Sorteos Realizados</p>
                                    <p className="text-xs md:text-sm font-black italic items-center flex gap-2 text-purple-400">
                                        <Dice6 size={14} /> {sorteosExecuted}/3
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="w-px h-8 bg-white/10" />

                        <div>
                            <p className="text-[8px] md:text-xs text-white/40 font-bold uppercase tracking-widest">Estado</p>
                            <p className="text-xs md:text-sm font-black italic items-center flex gap-2">
                                {allResolved ? (
                                    <>
                                        <CheckCircle2 size={16} className="text-green-500" />
                                        <span className="text-green-500 uppercase">Todo Resuelto</span>
                                    </>
                                ) : (
                                    <>
                                        <Loader2 size={16} className="text-yellow-500 animate-spin" />
                                        <span className="text-yellow-500 uppercase">En progreso...</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={handleSaveResolutions}
                            disabled={!allResolved || isApplying}
                            className={`flex-1 md:flex-none px-6 md:px-10 py-4 rounded-2xl font-black italic uppercase tracking-tighter flex items-center justify-center gap-3 transition-all ${allResolved
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-xl shadow-green-900/30'
                                : 'bg-white/5 text-white/10 border border-white/5 cursor-not-allowed grayscale'
                                }`}
                        >
                            {isApplying ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            <span className="hidden sm:inline">Guardar Cambios</span>
                            <span className="sm:hidden text-xs">Guardar</span>
                        </button>
                    </div>
                </div>

                {/* Sorteo Choice Modal overlay */}
                <AnimatePresence>
                    {showSorteoChoice !== null && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center p-8">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-[#0f0f1a]/95 backdrop-blur-xl"
                            />
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-white/5 border border-white/10 p-10 rounded-[3rem] w-full max-w-lg relative z-30 text-center space-y-8"
                            >
                                <div className="w-20 h-20 bg-purple-500/20 rounded-[2rem] flex items-center justify-center border border-purple-500/30 mx-auto">
                                    <Dices className="text-purple-400" size={40} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">¿Cómo realizar el sorteo?</h3>
                                    <p className="text-white/40 mt-2 font-medium">Elige el método para resolver este empate al azar.</p>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <button
                                        onClick={() => handleRandomDraw(showSorteoChoice, 'auto')}
                                        className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-all group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                                                <RotateCcw className="text-blue-400" size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-white italic uppercase tracking-tight">Sorteo Automático</p>
                                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">El sistema decide al azar</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-white/10 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </button>

                                    <button
                                        onClick={() => handleRandomDraw(showSorteoChoice, 'manual')}
                                        className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-all group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
                                                <Users className="text-purple-400" size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-white italic uppercase tracking-tight">Sorteo Manual</p>
                                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Ajuste manual en el campo</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-white/10 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowSorteoChoice(null)}
                                    className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white transition-all pt-4"
                                >
                                    Cancelar y Volver
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
