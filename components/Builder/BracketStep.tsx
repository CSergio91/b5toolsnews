
import React, { useEffect, useState, useRef } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { ZoomIn, ZoomOut, RefreshCcw, Trash2, Plus, Edit2, X, Check, Link as LinkIcon, ArrowLeft, ArrowRight, Play, Trophy, ArrowLeftRight, Layout, Minimize, Maximize, Target } from 'lucide-react';
import { TournamentPhase, RoundMatch, ReferenceSource } from '../../types/structure';
import { useToast } from '../../context/ToastContext';
import { ClassificationTable } from './ClassificationTable';
import { calculateTeamStats, getSortedStandings } from '../../utils/tournamentStats';
import { Podium } from '../Tournament/Podium';

// DnD Kit
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { MatchDropZone } from './MatchDropZone';

// Helpers
const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const BracketStep: React.FC = () => {
    const { state, teams, updateStructure } = useBuilder();
    const { addToast } = useToast();

    // -- State --
    const [phases, setPhases] = useState<TournamentPhase[]>([]);

    // Simulation State
    const [isSimulation, setIsSimulation] = useState(false);
    const [simulationResults, setSimulationResults] = useState<Record<string, string>>({}); // matchId -> winnerId

    // Sets Modal State
    const [isSetsModalOpen, setIsSetsModalOpen] = useState(false);
    const [pendingPhaseType, setPendingPhaseType] = useState<'elimination' | 'placement' | 'group' | null>(null);

    // Canvas State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Editing
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null); // For connecting sources

    // -- Persistence Sync --
    useEffect(() => {
        if (phases.length > 0) {
            const currentStr = JSON.stringify({ phases });
            const prevStr = JSON.stringify({ phases: state.structure?.phases || [] });

            if (currentStr !== prevStr) {
                const debounce = setTimeout(() => {
                    const sorted = recalculateGlobalIds(phases);
                    updateStructure({
                        phases: sorted,
                        globalMatchCount: 0
                    });
                }, 1000);
                return () => clearTimeout(debounce);
            }
        }
    }, [phases]);

    // --- Auto-Migration: Ensure all matches have 'sets' ---
    useEffect(() => {
        if (!phases || phases.length === 0) return;

        let hasChanges = false;
        const setsCount = state.config.sets_per_match || 3;

        const fixMatch = (m: RoundMatch) => {
            if (!m.sets || m.sets.length === 0) {
                hasChanges = true;
                return {
                    ...m,
                    sets: Array.from({ length: setsCount }, (_, i) => ({
                        set_number: i + 1,
                        home_score: 0,
                        away_score: 0,
                        status: 'pending' as const
                    }))
                };
            }
            return m;
        };

        const migratedPhases = phases.map(p => {
            let pChanged = false;
            let newGroups = p.groups;
            let newMatches = p.matches;

            if (p.groups) {
                newGroups = p.groups.map(g => {
                    const fixedMatches = g.matches.map(fixMatch);
                    if (fixedMatches !== g.matches) pChanged = true;
                    return { ...g, matches: fixedMatches };
                });
            }

            if (p.matches) {
                newMatches = p.matches.map(fixMatch);
                if (newMatches !== p.matches) pChanged = true;
            }

            if (pChanged || hasChanges) {
                return { ...p, groups: newGroups, matches: newMatches };
            }
            return p;
        });

        if (hasChanges) {
            setPhases(migratedPhases);
        }
    }, [phases.length, state.config.sets_per_match]);



    // -- Actions --

    const recalculateGlobalIds = (currentPhases: TournamentPhase[]) => {
        let count = 1;
        const sorted = [...currentPhases].sort((a, b) => a.order - b.order);

        sorted.forEach(p => {
            if (p.type === 'group' && p.groups) {
                p.groups.forEach(g => {
                    g.matches.forEach(m => m.globalId = count++);
                });
            } else if (p.matches) {
                p.matches.forEach(m => {
                    m.globalId = count++;
                });
            }
        });
        return sorted;
    };

    const generateStructure = () => {
        const type = state.config.tournament_type || 'knockout';
        const teamsList = state.teams || [];
        const defaultSets = state.config.sets_per_match || 3;

        if (teamsList.length === 0) addToast("Advertencia: No se detectaron equipos.", 'error');

        const newPhases: TournamentPhase[] = [];

        if (type === 'cup') {
            const groupPhase: TournamentPhase = {
                id: generateId(),
                type: 'group',
                name: 'Fase de Liga',
                order: 0,
                groups: [{ name: 'Unico', teams: [], matches: [] }]
            };
            newPhases.push(groupPhase);

            const finalsPhase: TournamentPhase = {
                id: generateId(),
                type: 'elimination',
                name: 'Finales',
                order: 1,
                matches: []
            };
            finalsPhase.matches = [{
                id: generateId(), globalId: 1, name: 'Gran Final', roundIndex: 0, phaseId: finalsPhase.id, location: `${defaultSets} Sets`
            }];
            newPhases.push(finalsPhase);

        } else if (type === 'double_elimination') {
            const winnersPhase: TournamentPhase = { id: generateId(), type: 'elimination', name: 'Ganadores', order: 0, matches: [] };
            const wM1 = generateId(); const wM2 = generateId();
            winnersPhase.matches = [
                { id: wM1, globalId: 1, name: 'Ronda 1 - P1', roundIndex: 0, phaseId: winnersPhase.id },
                { id: wM2, globalId: 2, name: 'Ronda 1 - P2', roundIndex: 0, phaseId: winnersPhase.id }
            ];
            newPhases.push(winnersPhase);
            const losersPhase: TournamentPhase = {
                id: generateId(), type: 'elimination', name: 'Perdedores', order: 1, matches: [
                    { id: generateId(), globalId: 3, name: 'Ronda P1', roundIndex: 0, phaseId: generateId(), sourceHome: { type: 'match.loser', id: wM1 }, sourceAway: { type: 'match.loser', id: wM2 } }
                ]
            };
            newPhases.push(losersPhase);
            const finalPhase: TournamentPhase = {
                id: generateId(), type: 'elimination', name: 'Finales', order: 2, matches: [{
                    id: generateId(), globalId: 4, name: 'Gran Final', roundIndex: 0, phaseId: generateId(), sourceHome: { type: 'match.winner', id: wM1 }, sourceAway: { type: 'match.winner', id: losersPhase.matches![0].id }
                }]
            };
            newPhases.push(finalPhase);

        } else if (type === 'groups') {
            const numGroups = state.config.number_of_groups || 4;
            const groups: any[] = [];
            const generateRoundRobin = (teamIds: string[], groupName: string) => {
                const matches: RoundMatch[] = [];
                const n = teamIds.length;
                if (n < 2) return matches;
                const setsCount = state.config.sets_per_match || 3;
                const generateSets = (count: number) => Array.from({ length: count }, (_, i) => ({ set_number: i + 1, home_score: 0, away_score: 0, status: 'pending' as const }));
                let matchCount = 1;
                for (let i = 0; i < n; i++) {
                    for (let j = i + 1; j < n; j++) {
                        matches.push({
                            id: generateId(), globalId: 0, name: `G${groupName} (J${matchCount})`, roundIndex: 0, phaseId: 'group-temp',
                            sourceHome: { type: 'team', id: teamIds[i] }, sourceAway: { type: 'team', id: teamIds[j] },
                            location: `${setsCount} Sets`, sets: generateSets(setsCount)
                        });
                        matchCount++;
                    }
                }
                return matches;
            };
            const groupNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
            for (let i = 0; i < numGroups; i++) {
                const teamIds: string[] = [];
                teamsList.forEach((team, idx) => { if (idx % numGroups === i) teamIds.push(team.id); });
                groups.push({ name: groupNames[i] || `G${i + 1}`, teams: teamIds, matches: generateRoundRobin(teamIds, groupNames[i] || `G${i + 1}`) });
            }
            newPhases.push({ id: generateId(), type: 'group', name: 'Fase de Grupos', order: 0, groups: groups });
        } else {
            const groupPhase: TournamentPhase = { id: generateId(), type: 'group', name: 'Fase de Grupos', order: 0, groups: [{ name: 'A', teams: [], matches: [] }, { name: 'B', teams: [], matches: [] }] };
            newPhases.push(groupPhase);
        }

        setPhases(recalculateGlobalIds(newPhases));
    };

    // -- Init Load & Auto-Gen --
    useEffect(() => {
        let shouldGen = false;
        if (!state.structure || !state.structure.phases || state.structure.phases.length === 0) {
            shouldGen = true;
        }
        else if (state.config.tournament_type === 'groups') {
            const groupPhase = state.structure.phases.find(p => p.type === 'group');
            const currentGroupsCount = groupPhase?.groups?.length || 0;
            const configGroupsCount = state.config.number_of_groups || 4;
            if (currentGroupsCount !== configGroupsCount) {
                shouldGen = true;
            }
        }
        if (shouldGen && state.config.tournament_type) {
            generateStructure();
        } else if (state.structure?.phases) {
            setPhases(state.structure.phases);
            if (state.structure.simulationResults) {
                setSimulationResults(state.structure.simulationResults);
            }
        }
    }, [state.config.number_of_groups, state.config.tournament_type]);

    const handleAddPhase = (type: 'elimination' | 'placement' | 'group') => {
        setPendingPhaseType(type);
        setIsSetsModalOpen(true);
    };

    const handleConfirmAddPhase = (sets: number) => {
        const type = pendingPhaseType;
        if (!type) return;

        setIsSetsModalOpen(false);
        setPendingPhaseType(null);

        const setsInfo = `${sets} Sets`;
        const createSets = (n: number) => Array.from({ length: n }, (_, i) => ({ set_number: i + 1, home_score: 0, away_score: 0, status: 'pending' as const }));

        setPhases(prev => {
            let newPhase: TournamentPhase;
            if (type === 'group') {
                const shifted = prev.map(p => ({ ...p, order: p.order + 1 }));
                newPhase = { id: generateId(), type: 'group', name: 'Fase de Grupos', order: 0, groups: [{ name: 'A', teams: [], matches: [] }, { name: 'B', teams: [], matches: [] }] };
                return recalculateGlobalIds([...shifted, newPhase]);
            } else if (type === 'placement') {
                newPhase = { id: generateId(), type: 'elimination', name: 'Finales', order: prev.length, matches: [] };
                const semi1Id = generateId(); const semi2Id = generateId();
                newPhase.matches = [
                    { id: semi1Id, globalId: 0, name: 'Semifinal 1', roundIndex: 0, phaseId: newPhase.id, location: setsInfo, sets: createSets(sets) },
                    { id: semi2Id, globalId: 0, name: 'Semifinal 2', roundIndex: 0, phaseId: newPhase.id, location: setsInfo, sets: createSets(sets) },
                    { id: generateId(), globalId: 0, name: '3er y 4to Puesto', roundIndex: 1, phaseId: newPhase.id, location: setsInfo, sourceHome: { type: 'match.loser', id: semi1Id }, sourceAway: { type: 'match.loser', id: semi2Id }, sets: createSets(sets) },
                    { id: generateId(), globalId: 0, name: 'Gran Final', roundIndex: 1, phaseId: newPhase.id, location: setsInfo, sourceHome: { type: 'match.winner', id: semi1Id }, sourceAway: { type: 'match.winner', id: semi2Id }, sets: createSets(sets) }
                ];
            } else {
                newPhase = { id: generateId(), type: type, name: 'Nueva Ronda', order: prev.length, matches: [{ id: generateId(), globalId: 0, name: 'Partido 1', roundIndex: 0, phaseId: generateId(), location: setsInfo, sets: createSets(sets) }] };
                newPhase.matches![0].phaseId = newPhase.id;
            }
            return recalculateGlobalIds([...prev, newPhase]);
        });
    };

    const handleDeletePhase = (id: string) => {
        if (confirm("¿Eliminar esta fase?")) {
            setPhases(prev => recalculateGlobalIds(prev.filter(p => p.id !== id)));
        }
    };

    const handleUpdatePhaseName = (id: string, newName: string) => {
        setPhases(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    };

    const handleMovePhase = (id: string, direction: 'left' | 'right') => {
        setPhases(prev => {
            const current = prev.find(p => p.id === id);
            if (!current) return prev;
            const targetOrder = direction === 'left' ? current.order - 1 : current.order + 1;
            const target = prev.find(p => p.order === targetOrder);
            if (!target) return prev;
            const newPhases = prev.map(p => {
                if (p.id === current.id) return { ...p, order: targetOrder };
                if (p.id === target.id) return { ...p, order: current.order };
                return p;
            });
            return recalculateGlobalIds(newPhases);
        });
    };

    const handleAddMatchToPhase = (phaseId: string) => {
        setPhases(prev => {
            const newPhases = prev.map(p => {
                if (p.id === phaseId && p.matches) {
                    const setsCount = state.config.sets_per_match || 3;
                    return {
                        ...p,
                        matches: [...p.matches, {
                            id: generateId(),
                            globalId: 0,
                            name: 'Partido ' + (p.matches.length + 1),
                            roundIndex: 0,
                            phaseId: phaseId,
                            location: `${setsCount} Sets`,
                            sets: Array.from({ length: setsCount }, (_, i) => ({ set_number: i + 1, home_score: 0, away_score: 0, status: 'pending' as const }))
                        }]
                    };
                }
                return p;
            });
            return recalculateGlobalIds(newPhases);
        });
    };

    const handleAddGroup = (phaseId: string) => {
        setPhases(prev => {
            const newPhases = prev.map(p => {
                if (p.id === phaseId && p.groups) {
                    const lastGroup = p.groups[p.groups.length - 1];
                    const nextCharCode = lastGroup ? lastGroup.name.charCodeAt(0) + 1 : 65; // 65 = 'A'
                    const nextName = String.fromCharCode(nextCharCode);
                    return { ...p, groups: [...p.groups, { name: nextName, teams: [], matches: [] }] };
                }
                return p;
            });
            return recalculateGlobalIds(newPhases);
        });
    };

    const handleDeleteGroup = (phaseId: string, groupIndex: number) => {
        if (!confirm("¿Eliminar este grupo?")) return;
        setPhases(prev => {
            const newPhases = prev.map(p => {
                if (p.id === phaseId && p.groups) {
                    const newGroups = [...p.groups];
                    newGroups.splice(groupIndex, 1);
                    return { ...p, groups: newGroups };
                }
                return p;
            });
            return recalculateGlobalIds(newPhases);
        });
    };

    const handleDeleteMatch = (phaseId: string, matchId: string) => {
        if (!confirm("¿Eliminar este partido?")) return;
        setPhases(prev => {
            const newPhases = prev.map(p => {
                if (p.id === phaseId && p.matches) {
                    return { ...p, matches: p.matches.filter(m => m.id !== matchId) };
                }
                return p;
            });
            return recalculateGlobalIds(newPhases);
        });
    };


    // -- Connection & Swap Logic --
    const getAvailableSources = (targetPhaseOrder: number) => {
        const sources: { label: string, value: ReferenceSource, phaseName: string, key?: string }[] = [];
        phases.filter(p => p.order < targetPhaseOrder).forEach(p => {
            if (p.type === 'group' && p.groups) {
                p.groups.forEach(g => {
                    const count = Math.max(4, g.teams.length);
                    Array.from({ length: count }, (_, i) => i + 1).forEach(pos => {
                        sources.push({
                            label: pos + 'º Grupo ' + g.name,
                            value: { type: 'group.pos', id: g.name, index: pos },
                            phaseName: p.name,
                            key: `pos-${p.id}-${g.name}-${pos}`
                        });
                    });
                });
            } else if (p.matches) {
                p.matches.forEach(m => {
                    sources.push({ label: 'Ganador #' + m.globalId + ' (' + m.name + ')', value: { type: 'match.winner', id: String(m.globalId) }, phaseName: p.name });
                    const context = targetPhaseOrder - p.order === 1 ? ' (Para 3er/4to o Clasif.)' : '';
                    sources.push({ label: 'Perdedor #' + m.globalId + ' (' + m.name + ')' + context, value: { type: 'match.loser', id: String(m.globalId) }, phaseName: p.name });
                });
            }
        });
        return sources;
    };

    const handleConnectSource = (matchId: string, side: 'home' | 'away', source: ReferenceSource) => {
        setPhases(prev => {
            const newPhases = prev.map(p => {
                if (p.matches) {
                    const matchIdx = p.matches.findIndex(m => m.id === matchId);
                    if (matchIdx !== -1) {
                        const match = p.matches[matchIdx];
                        if (side === 'home') match.sourceHome = source;
                        else match.sourceAway = source;
                    }
                }
                return p;
            });
            return [...newPhases];
        });
        setEditingMatchId(null);
    };

    const handleSwapTeams = (phaseId: string, matchId: string) => {
        setPhases(prev => {
            return prev.map(p => {
                if (p.id === phaseId) {
                    if (p.matches) {
                        return {
                            ...p,
                            matches: p.matches.map(m => {
                                if (m.id === matchId) {
                                    return { ...m, sourceHome: m.sourceAway, sourceAway: m.sourceHome };
                                }
                                return m;
                            })
                        };
                    }
                    if (p.groups) {
                        const newGroups = p.groups.map(g => ({
                            ...g,
                            matches: g.matches.map(m => {
                                if (m.id === matchId) return { ...m, sourceHome: m.sourceAway, sourceAway: m.sourceHome };
                                return m;
                            })
                        }));
                        return { ...p, groups: newGroups };
                    }
                }
                return p;
            });
        });
        addToast("Equipos intercambiados", 'info');
    };

    // -- DND Logic --
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const activeId = String(active.id); // Not used now as sidebar is gone, but keeping for future or internal drag
        const overId = String(over.id);
        // ... (Logic removed as request asked to remove sidebar dragging)
    };

    // -- Simulation Logic --
    const handleSimulationClick = (matchId: string, teamId: string | null) => {
        if (!isSimulation || !teamId) return;
        setSimulationResults(prev => ({ ...prev, [matchId]: teamId }));
    };

    const resolveTeamId = (source: ReferenceSource | undefined): string | null => {
        if (!source) return null;
        if (source.type === 'team') return source.id;

        if (source.type === 'group.pos' && isSimulation) {
            const stats = calculateTeamStats(phases, teams, simulationResults, state.config);
            const groupStats = stats.filter(s => s.group === source.id);
            const sorted = getSortedStandings(groupStats);
            const targetStat = sorted[source.index - 1];
            return targetStat ? targetStat.id : null;
        }

        if (source.type === 'match.winner' || source.type === 'match.loser') {
            let foundMatch: RoundMatch | undefined;
            for (const p of phases) {
                if (p.matches) {
                    const m = p.matches.find(m => m.id === source.id || String(m.globalId) === source.id);
                    if (m) { foundMatch = m; break; }
                }
            }

            if (foundMatch) {
                const winnerId = simulationResults[foundMatch.id];
                if (!winnerId) return null;

                if (source.type === 'match.winner') return winnerId;
                if (source.type === 'match.loser') {
                    const homeId = resolveTeamId(foundMatch.sourceHome);
                    const awayId = resolveTeamId(foundMatch.sourceAway);
                    if (homeId === winnerId) return awayId;
                    if (awayId === winnerId) return homeId;
                }
            }
        }
        return null;
    };

    const getTeamName = (id: string | null | undefined, teams: any[]) => {
        if (!id) return '...';
        if (id === 'BYE') return 'BYE';
        const t = teams.find(team => String(team.id) === String(id));
        return t ? t.name : 'Unknown';
    };

    // Label Detection (Heuristic)
    const getMatchLabel = (match: RoundMatch, phase: TournamentPhase, isLastPhase: boolean): { text: string, color: string } | null => {
        // Explicit names in structure?
        if (match.name.toLowerCase().includes('final') && !match.name.toLowerCase().includes('semi')) return { text: 'GRAN FINAL', color: 'text-amber-400' };
        if (match.name.toLowerCase().includes('3er')) return { text: '3ER PUESTO', color: 'text-orange-400' };
        if (match.name.toLowerCase().includes('semi')) return { text: 'SEMIFINAL', color: 'text-blue-300' };

        // Heuristic fallback
        if (!phase.matches) return null;

        if (isLastPhase && phase.matches.length === 1) return { text: 'GRAN FINAL', color: 'text-amber-400' };

        // If last phase has 2 matches (e.g. Final + 3rd place), usually Final is the last one or identified by source
        if (isLastPhase && phase.matches.length === 2) {
            // If this match depends on LOSERS, it's 3rd place
            if (match.sourceHome?.type === 'match.loser') return { text: '3ER PUESTO', color: 'text-orange-400' };
            // If depends on WINNERS, it's Final
            if (match.sourceHome?.type === 'match.winner') return { text: 'GRAN FINAL', color: 'text-amber-400' };
        }

        return null;
    };

    const renderMatchCard = (match: RoundMatch, phaseOrder: number, isLastPhase: boolean = false, phase: TournamentPhase) => {
        const label = getMatchLabel(match, phase, isLastPhase);

        return (
            <div key={match.id} className={`relative bg-[#222] border border-white/5 rounded-lg p-2 min-w-[240px] shadow-lg flex flex-col gap-1 hover:border-blue-500/50 transition-colors group ${label?.text === 'GRAN FINAL' ? 'ring-1 ring-amber-500/30' : ''}`}>
                {/* Header */}
                <div className="flex justify-between items-center text-[10px] text-white/30 uppercase font-bold tracking-wider relative z-20">
                    <div className="flex items-center gap-2">
                        <span>M#{match.globalId}</span>
                        {label && <span className={`${label.color} font-extrabold px-1.5 py-0.5 bg-white/5 rounded-[2px] ml-1`}>{label.text}</span>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleSwapTeams(phase.id, match.id)} className="hover:text-yellow-400 p-0.5" title="Intercambiar Local/Visitante"><ArrowLeftRight size={10} /></button>
                        <button onClick={() => setEditingMatchId(match.id + '-home')} className="hover:text-blue-400 p-0.5"><LinkIcon size={10} /></button>
                        <button onClick={() => handleDeleteMatch(phase.id, match.id)} className="hover:text-red-400 p-0.5"><Trash2 size={10} /></button>
                    </div>
                </div>

                {/* Slots */}
                <div className="flex flex-col gap-1 mt-1">
                    <MatchDropZone matchId={match.id} side="home">
                        {renderSourceButtonFull(match, 'home', phaseOrder)}
                    </MatchDropZone>

                    <div className="h-px bg-white/5 w-full my-0.5" />

                    <MatchDropZone matchId={match.id} side="away">
                        {renderSourceButtonFull(match, 'away', phaseOrder)}
                    </MatchDropZone>
                </div>
            </div>
        );
    };

    const renderSourceButtonFull = (match: RoundMatch, side: 'home' | 'away', phaseOrder: number) => {
        const source = side === 'home' ? match.sourceHome : match.sourceAway;
        const available = getAvailableSources(phaseOrder);
        const resolvedTeamId = resolveTeamId(source);
        const resolvedTeamName = resolvedTeamId ? getTeamName(resolvedTeamId, teams) : null;
        const isWinner = simulationResults[match.id] === resolvedTeamId && resolvedTeamId !== null;

        // Manual Selection Popover
        if (editingMatchId === match.id + '-' + side && !isSimulation) {
            return (
                <div className="absolute top-0 left-0 bg-[#333] border border-blue-500 rounded-lg p-2 z-50 w-72 shadow-2xl max-h-60 overflow-y-auto font-sans">
                    <div className="text-xs text-blue-300 mb-2 font-bold uppercase sticky top-0 bg-[#333] pb-1 border-b border-white/10 flex justify-between">
                        <span>Seleccionar Origen</span>
                        <button onClick={() => setEditingMatchId(null)}><X size={12} /></button>
                    </div>
                    {/* Add Teams to dropdown too */}
                    <div className="mb-2">
                        <div className="text-[10px] text-white/50 uppercase font-bold px-1 mb-1">Equipos</div>
                        {teams.map(t => (
                            <button key={t.id} className="w-full text-left p-1.5 text-xs text-white hover:bg-blue-500/20 rounded truncate flex items-center gap-2"
                                onClick={() => handleConnectSource(match.id, side, { type: 'team', id: t.id })}>
                                <div className="w-4 h-4 rounded-full overflow-hidden bg-white/10">{t.logo_url && <img src={t.logo_url} className="w-full h-full object-cover" />}</div>
                                {t.name}
                            </button>
                        ))}
                    </div>

                    {available.map(opt => (
                        <button key={opt.key || (opt.value.id + opt.value.type)} className="w-full text-left p-1.5 text-xs text-white hover:bg-blue-500/20 rounded truncate"
                            onClick={() => handleConnectSource(match.id, side, opt.value)}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            );
        }

        let displayText = 'Vacío';

        if (resolvedTeamName) {
            displayText = resolvedTeamName;
        } else if (source) {
            if (source.type === 'team') displayText = 'Equipo desconocido';
            else if (source.type === 'group.pos') displayText = `${source.index}º Grupo ${source.id}`;
            else if (source.type === 'match.winner') displayText = `Ganador M${source.id}`;
            else if (source.type === 'match.loser') displayText = `Perdedor M${source.id}`;
            else displayText = 'Esperando...';
        }

        return (
            <div
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer relative ${isWinner ? 'bg-green-500/10 text-green-300' : 'bg-black/20 hover:bg-white/5'}`}
                onClick={() => {
                    if (isSimulation) handleSimulationClick(match.id, resolvedTeamId);
                    else setEditingMatchId(match.id + '-' + side);
                }}
            >
                {/* Status Dot / Logo */}
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden ${isWinner ? 'bg-green-500 text-black' : 'bg-white/5 text-white/50'}`}>
                    {resolvedTeamId && teams.find(t => t.id === resolvedTeamId)?.logo_url ? <img src={teams.find(t => t.id === resolvedTeamId)?.logo_url} className="w-full h-full object-cover" /> : (side === 'home' ? 'H' : 'A')}
                </div>

                <div className="flex-1 min-w-0 flex flex-col leading-none">
                    <span className={`text-xs font-medium truncate ${isWinner ? 'text-green-300' : 'text-white/80'}`}>
                        {displayText}
                    </span>
                    {source && source.type !== 'team' && resolvedTeamName && (
                        <span className="text-[9px] text-white/30 truncate">
                            {source.type === 'match.winner' ? `Ganador M${source.id}` : source.type === 'match.loser' ? `Perdedor M${source.id}` : source.type === 'group.pos' ? `${source.index}º Grupo ${source.id}` : source.id}
                        </span>
                    )}
                </div>
                {!isSimulation && <Edit2 size={10} className="text-white/10 opacity-0 group-hover:opacity-100" />}
            </div>
        );
    };

    // calculate podium data
    const getPodiumData = () => {
        // Find Final match
        // Heuristic: Last match of last phase? or explicitly named "Gran Final"?
        let finalMatch: RoundMatch | undefined;
        let thirdPlaceMatch: RoundMatch | undefined;

        for (const p of phases) {
            if (p.matches) {
                const f = p.matches.find(m => m.name.includes("Gran Final") || getMatchLabel(m, p, p.order === phases.length - 1)?.text === 'GRAN FINAL');
                if (f) finalMatch = f;

                const t = p.matches.find(m => m.name.includes("3er") || getMatchLabel(m, p, p.order === phases.length - 1)?.text === '3ER PUESTO')
                if (t) thirdPlaceMatch = t;
            }
        }

        if (!finalMatch) return null;

        const winnerId = simulationResults[finalMatch.id];
        if (!winnerId) return null;

        const runnerUpId = resolveTeamId(finalMatch.sourceHome) === winnerId ? resolveTeamId(finalMatch.sourceAway) : resolveTeamId(finalMatch.sourceHome);

        let thirdPlaceId: string | null = null;
        if (thirdPlaceMatch) {
            thirdPlaceId = simulationResults[thirdPlaceMatch.id] || null;
        }

        const getTeam = (id: string | null) => teams.find(t => t.id === id);

        return {
            first: getTeam(winnerId)!,
            second: getTeam(runnerUpId)!,
            third: getTeam(thirdPlaceId) || undefined
        };
    };

    const podiumData = isSimulation ? getPodiumData() : null;

    // Canvas Events
    const handleCMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.node-interactive')) return;
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const handleCMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const handleCMouseUp = () => { isDragging.current = false; };


    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-full bg-[#111] text-white overflow-hidden relative">
                {/* Top Bar */}
                <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#1a1a1a] z-50">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                            <button onClick={generateStructure} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded border border-red-500/20">
                                <RefreshCcw size={12} /> Regenerar
                            </button>
                            <button onClick={() => setIsSimulation(!isSimulation)} className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded border transition-all ${isSimulation ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}>
                                <Play size={12} fill={isSimulation ? "currentColor" : "none"} /> {isSimulation ? 'Simulando' : 'Simular'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ZoomOut className="cursor-pointer text-white/50 hover:text-white" size={16} onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} />
                        <span className="text-xs font-mono text-white/30 min-w-[3ch] text-center">{Math.round(zoom * 100)}%</span>
                        <ZoomIn className="cursor-pointer text-white/50 hover:text-white" size={16} onClick={() => setZoom(z => Math.min(2, z + 0.1))} />
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Canvas Area */}
                    <div
                        ref={containerRef}
                        className="flex-1 bg-[#111] overflow-hidden cursor-grab active:cursor-grabbing relative"
                        style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                        onMouseDown={handleCMouseDown}
                        onMouseMove={handleCMouseMove}
                        onMouseUp={handleCMouseUp}
                        onMouseLeave={handleCMouseUp}
                    >
                        <div
                            className="absolute top-0 left-0 transition-transform duration-75 ease-out origin-top-left flex items-start p-20 gap-16 min-w-max min-h-max"
                            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                        >
                            {/* Render Phases Columns */}
                            {phases.sort((a, b) => a.order - b.order).map((phase, pIdx) => {
                                const isLastPhase = pIdx === phases.length - 1;
                                return (
                                    <div key={phase.id} className="flex flex-col gap-4 min-w-[280px] node-interactive">
                                        {/* Phase Header */}
                                        <div className="flex items-center justify-between group mb-2">
                                            <div className="flex items-center gap-2">
                                                {pIdx > 0 && <button onClick={() => handleMovePhase(phase.id, 'left')} className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"><ArrowLeft size={10} /></button>}
                                                <input
                                                    value={phase.name}
                                                    onChange={(e) => handleUpdatePhaseName(phase.id, e.target.value)}
                                                    className="bg-transparent text-sm font-bold uppercase tracking-widest text-blue-400 outline-none w-32 focus:bg-white/5 rounded px-1"
                                                />
                                                {pIdx < phases.length - 1 && <button onClick={() => handleMovePhase(phase.id, 'right')} className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight size={10} /></button>}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {phase.type === 'group' && <button onClick={() => handleAddGroup(phase.id)} title="Agregar Grupo" className="p-1 hover:bg-green-500/20 rounded text-green-400"><Plus size={12} /></button>}
                                                {phase.type !== 'group' && <button onClick={() => handleAddMatchToPhase(phase.id)} title="Agregar Partido" className="p-1 hover:bg-blue-500/20 rounded text-blue-400"><Plus size={12} /></button>}
                                                <button onClick={() => handleDeletePhase(phase.id)} className="p-1 hover:bg-red-500/20 rounded text-red-400"><Trash2 size={12} /></button>
                                            </div>
                                        </div>

                                        {/* Groups or Matches */}
                                        <div className="flex flex-col gap-6">
                                            {phase.type === 'group' && phase.groups ? (
                                                phase.groups.map((group, gIdx) => (
                                                    <div key={gIdx} className="border border-white/10 bg-[#1a1a1a]/50 rounded-xl p-3 flex flex-col gap-3 backdrop-blur-sm">
                                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                            <span className="text-xs font-bold text-white/50">GRUPO {group.name}</span>
                                                            <button onClick={() => handleDeleteGroup(phase.id, gIdx)} className="text-white/10 hover:text-red-400"><X size={10} /></button>
                                                        </div>

                                                        {/* Classification / Standing */}
                                                        <ClassificationTable
                                                            groupName={group.name}
                                                            phases={phases}
                                                            simulationResults={simulationResults}
                                                            isSimulation={isSimulation}
                                                        />

                                                        {/* Matches List */}
                                                        <div className="flex flex-col gap-2 mt-2">
                                                            {group.matches.map(m => renderMatchCard(m, phase.order, isLastPhase, phase))}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                // Elimination Matches
                                                <div className="flex flex-col gap-4">
                                                    {phase.matches?.map(m => renderMatchCard(m, phase.order, isLastPhase, phase))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Add Phase Button Column */}
                            <div className="flex flex-col gap-2 pt-8 node-interactive opacity-50 hover:opacity-100 transition-opacity">
                                <button onClick={() => handleAddPhase('elimination')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-blue-500/20 flex items-center justify-center border border-white/10 hover:border-blue-500/50 text-white/30 hover:text-blue-400 transition-all shadow-xl" title="Agregar Ronda Eliminatoria">
                                    <Trophy size={16} />
                                </button>
                                <button onClick={() => handleAddPhase('placement')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-amber-500/20 flex items-center justify-center border border-white/10 hover:border-amber-500/50 text-white/30 hover:text-amber-400 transition-all shadow-xl" title="Agregar Finales / Definición">
                                    <Target size={16} />
                                </button>
                                <button onClick={() => handleAddPhase('group')} className="w-10 h-10 rounded-full bg-white/5 hover:bg-green-500/20 flex items-center justify-center border border-white/10 hover:border-green-500/50 text-white/30 hover:text-green-400 transition-all shadow-xl" title="Agregar Fase de Grupos">
                                    <Layout size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Podium Overlay */}
                {podiumData && podiumData.first && (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-in fade-in duration-500">
                        <div className="relative w-full h-full p-10 flex flex-col items-center justify-center">
                            <button
                                onClick={() => setIsSimulation(false)}
                                className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors font-bold z-50 backdrop-blur-md"
                            >
                                <X size={20} /> Cerrar Podium
                            </button>
                            <Podium
                                teams={[
                                    { place: 1, name: podiumData.first?.name || '?', logo: podiumData.first?.logo_url },
                                    { place: 2, name: podiumData.second?.name || '?', logo: podiumData.second?.logo_url },
                                    { place: 3, name: podiumData.third?.name || '?', logo: podiumData.third?.logo_url }
                                ].filter(t => t.name !== '?')}
                            />
                        </div>
                    </div>
                )}

                {/* Confirmations & Modals */}
                {isSetsModalOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
                        <div className="bg-[#222] border border-white/10 p-6 rounded-xl w-80 shadow-2xl">
                            <h3 className="text-lg font-bold mb-4">Configurar Partidos</h3>
                            <p className="text-white/50 text-xs mb-4">¿Cuántos sets por partido en esta fase?</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[1, 3].map(n => (
                                    <button key={n} onClick={() => handleConfirmAddPhase(n)} className="p-3 bg-white/5 hover:bg-blue-600 rounded border border-white/10 hover:border-blue-400 font-mono font-bold transition-all">
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setIsSetsModalOpen(false)} className="mt-4 text-xs text-white/30 hover:text-white underline w-full text-center">Cancelar</button>
                        </div>
                    </div>
                )}
            </div>
            <DragOverlay>
                {/* Optional: Render dragging preview */}
            </DragOverlay>
        </DndContext>
    );

};

function CustomTargetIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}
