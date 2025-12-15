
import React, { useEffect, useState, useRef } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { ZoomIn, ZoomOut, RefreshCcw, GripVertical, Trash2, Plus, Edit2, X, Check, Save, Link as LinkIcon, AlertCircle, ArrowLeft, ArrowRight, Play, Trophy, ArrowLeftRight } from 'lucide-react';
import { TournamentPhase, RoundMatch, ReferenceSource } from '../../types/structure';
import { useToast } from '../../context/ToastContext';
import { ClassificationTable } from './ClassificationTable';

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
            const currentStr = JSON.stringify({ phases, sim: simulationResults });
            const prevStr = JSON.stringify({ phases: state.structure?.phases || [], sim: state.structure?.simulationResults || {} });

            if (currentStr !== prevStr) {
                const debounce = setTimeout(() => {
                    const sorted = recalculateGlobalIds(phases);
                    updateStructure({
                        phases: sorted,
                        globalMatchCount: 0,
                        simulationResults
                    });
                }, 1000);
                return () => clearTimeout(debounce);
            }
        }
    }, [phases, simulationResults]);

    // -- Init Load --
    useEffect(() => {
        if (state.structure && state.structure.phases && state.structure.phases.length > 0) {
            setPhases(state.structure.phases);
            if (state.structure.simulationResults) {
                setSimulationResults(state.structure.simulationResults);
            }
        }
    }, []);

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
        // -- DYNAMIC GENERATION LOGIC --
        const type = state.config.tournament_type || 'knockout';
        const teamsList = state.teams || [];
        const defaultSets = state.config.sets_per_match || 3;

        if (teamsList.length === 0) addToast("Advertencia: No se detectaron equipos. Asegúrate de haber agregado equipos en el paso anterior.", 'error');

        const newPhases: TournamentPhase[] = [];

        if (type === 'cup') {
            // ELIMINACION DIRECTA -> User defined as "League + Finals"
            // 1. Group Phase (Single Group "Todos contra Todos")
            const groupPhase: TournamentPhase = {
                id: generateId(),
                type: 'group',
                name: 'Fase de Liga',
                order: 0,
                groups: [{ name: 'Unico', teams: [], matches: [] }]
            };
            newPhases.push(groupPhase);

            // 2. Finals Phase
            const finalsPhase: TournamentPhase = {
                id: generateId(),
                type: 'elimination',
                name: 'Finales',
                order: 1,
                matches: []
            };
            finalsPhase.matches = [{
                id: generateId(),
                globalId: 1,
                name: 'Gran Final',
                roundIndex: 0,
                phaseId: finalsPhase.id,
                location: `${defaultSets} Sets`
            }];
            newPhases.push(finalsPhase);

        } else if (type === 'double_elimination') {
            // DOBLE ELIMINACION
            const winnersPhase: TournamentPhase = {
                id: generateId(),
                type: 'elimination',
                name: 'Ganadores',
                order: 0,
                matches: []
            };
            const wM1 = generateId(); const wM2 = generateId();
            winnersPhase.matches = [
                { id: wM1, globalId: 1, name: 'Ronda 1 - P1', roundIndex: 0, phaseId: winnersPhase.id },
                { id: wM2, globalId: 2, name: 'Ronda 1 - P2', roundIndex: 0, phaseId: winnersPhase.id }
            ];
            newPhases.push(winnersPhase);

            const losersPhase: TournamentPhase = {
                id: generateId(),
                type: 'elimination',
                name: 'Perdedores',
                order: 1,
                matches: [
                    {
                        id: generateId(), globalId: 3, name: 'Ronda P1', roundIndex: 0, phaseId: generateId(),
                        sourceHome: { type: 'match.loser', id: wM1 },
                        sourceAway: { type: 'match.loser', id: wM2 }
                    }
                ]
            };
            newPhases.push(losersPhase);

            const finalPhase: TournamentPhase = {
                id: generateId(),
                type: 'elimination',
                name: 'Finales',
                order: 2,
                matches: [{
                    id: generateId(), globalId: 4, name: 'Gran Final', roundIndex: 0, phaseId: generateId(),
                    sourceHome: { type: 'match.winner', id: wM1 },
                    sourceAway: { type: 'match.winner', id: losersPhase.matches![0].id }
                }]
            };
            newPhases.push(finalPhase);

        } else if (type === 'groups') {
            // GRUPOS + PLAYOFF (Standard)
            // 1. Generate Group Phase
            const numGroups = state.config.number_of_groups || 4;
            const groups: any[] = [];

            // Match Generator (Round Robin) - Simplified for Groups
            const generateRoundRobin = (teamIds: string[], groupName: string) => {
                const matches: RoundMatch[] = [];
                const n = teamIds.length;
                if (n < 2) return matches;
                let matchCount = 1;
                for (let i = 0; i < n; i++) {
                    for (let j = i + 1; j < n; j++) {
                        matches.push({
                            id: generateId(),
                            globalId: 0,
                            name: `G${groupName} (J${matchCount})`,
                            roundIndex: 0,
                            phaseId: 'group-temp',
                            sourceHome: { type: 'team', id: teamIds[i] },
                            sourceAway: { type: 'team', id: teamIds[j] },
                            location: `${defaultSets} Sets`
                        });
                        matchCount++;
                    }
                }
                return matches;
            };

            const groupNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
            for (let i = 0; i < numGroups; i++) {
                const teamIds: string[] = [];
                teamsList.forEach((team, idx) => {
                    if (idx % numGroups === i) teamIds.push(team.id);
                });
                groups.push({
                    name: groupNames[i] || `G${i + 1}`,
                    teams: teamIds,
                    matches: generateRoundRobin(teamIds, groupNames[i] || `G${i + 1}`)
                });
            }

            newPhases.push({
                id: generateId(),
                type: 'group',
                name: 'Fase de Grupos',
                order: 0,
                groups: groups
            });

            const playoffPhase: TournamentPhase = {
                id: generateId(),
                type: 'elimination',
                name: 'Playoffs',
                order: 1,
                matches: [{
                    id: generateId(),
                    globalId: 1,
                    name: 'Gran Final',
                    roundIndex: 0,
                    phaseId: generateId(),
                    location: `${defaultSets} Sets`
                }]
            };
            newPhases.push(playoffPhase);

        } else {
            // FREE MODE (Default)
            const groupPhase: TournamentPhase = {
                id: generateId(),
                type: 'group',
                name: 'Fase de Grupos',
                order: 0,
                groups: [
                    { name: 'A', teams: [], matches: [] },
                    { name: 'B', teams: [], matches: [] }
                ]
            };
            newPhases.push(groupPhase);
        }

        setPhases(recalculateGlobalIds(newPhases));
    };

    const handleAddPhase = (type: 'elimination' | 'placement' | 'group') => {
        // Prompt for Sets
        const setsInput = prompt("¿Cuántos sets se jugarán por partido en esta fase?", String(state.config.sets_per_match || 3));
        const setsInfo = setsInput ? `${setsInput} Sets` : `${state.config.sets_per_match || 3} Sets`;

        setPhases(prev => {
            let newPhase: TournamentPhase;

            if (type === 'group') {
                // Generic Group Phase - Insert at START
                // Shift all existing phases
                const shiftedPhases = prev.map(p => ({ ...p, order: p.order + 1 }));

                newPhase = {
                    id: generateId(),
                    type: 'group',
                    name: 'Fase de Grupos',
                    order: 0, // Always first
                    groups: [
                        { name: 'A', teams: [], matches: [] },
                        { name: 'B', teams: [], matches: [] }
                    ]
                };
                return recalculateGlobalIds([...shiftedPhases, newPhase]);

            } else if (type === 'placement') {
                // "Finales" Logic
                newPhase = {
                    id: generateId(),
                    type: 'elimination',
                    name: 'Finales',
                    order: prev.length,
                    matches: []
                };

                // Semis, 3rd Place, Final
                const finalId = generateId();
                const thirdPlaceId = generateId();
                const semi1Id = generateId();
                const semi2Id = generateId();

                newPhase.matches = [
                    {
                        id: semi1Id,
                        globalId: 0,
                        name: 'Semifinal 1',
                        roundIndex: 0,
                        phaseId: newPhase.id,
                        location: setsInfo
                    },
                    {
                        id: semi2Id,
                        globalId: 0,
                        name: 'Semifinal 2',
                        roundIndex: 0,
                        phaseId: newPhase.id,
                        location: setsInfo
                    },
                    {
                        id: thirdPlaceId,
                        globalId: 0,
                        name: '3er y 4to Puesto',
                        roundIndex: 1,
                        phaseId: newPhase.id,
                        location: setsInfo,
                        sourceHome: { type: 'match.loser', id: semi1Id },
                        sourceAway: { type: 'match.loser', id: semi2Id }
                    },
                    {
                        id: finalId,
                        globalId: 0,
                        name: 'Gran Final',
                        roundIndex: 1,
                        phaseId: newPhase.id,
                        location: setsInfo,
                        sourceHome: { type: 'match.winner', id: semi1Id },
                        sourceAway: { type: 'match.winner', id: semi2Id }
                    }
                ];
            } else {
                // Standard Elimination Phase add
                newPhase = {
                    id: generateId(),
                    type: type, // 'elimination'
                    name: 'Nueva Ronda',
                    order: prev.length,
                    matches: [{
                        id: generateId(),
                        globalId: 0,
                        name: 'Partido 1',
                        roundIndex: 0,
                        phaseId: generateId(), // Temp ID?
                        location: setsInfo
                    }]
                };
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

            if (!target) return prev; // Cannot move

            // Swap orders
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
                    return {
                        ...p,
                        matches: [...p.matches, {
                            id: generateId(),
                            globalId: 0,
                            name: 'Partido ' + (p.matches.length + 1),
                            roundIndex: 0,
                            phaseId: phaseId,
                            location: `${state.config.sets_per_match || 3} Sets`
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
                    // Determine next letter
                    const lastGroup = p.groups[p.groups.length - 1];
                    const nextCharCode = lastGroup ? lastGroup.name.charCodeAt(0) + 1 : 65; // 65 = 'A'
                    const nextName = String.fromCharCode(nextCharCode);

                    return {
                        ...p,
                        groups: [...p.groups, {
                            name: nextName,
                            teams: [],
                            matches: []
                        }]
                    };
                }
                return p;
            });
            return recalculateGlobalIds(newPhases);
        });
    };

    const handleDeleteGroup = (phaseId: string, groupIndex: number) => {
        if (!confirm("¿Eliminar este grupo y sus partidos?")) return;
        setPhases(prev => {
            const newPhases = prev.map(p => {
                if (p.id === phaseId && p.groups) {
                    const newGroups = [...p.groups];
                    newGroups.splice(groupIndex, 1);
                    return {
                        ...p,
                        groups: newGroups
                    };
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
                    return {
                        ...p,
                        matches: p.matches.filter(m => m.id !== matchId)
                    };
                }
                return p;
            });
            return recalculateGlobalIds(newPhases);
        });
    };

    // -- Connection Logic --

    // Returns available sources for a specific match
    // Returns available sources for a specific match
    const getAvailableSources = (targetPhaseOrder: number) => {
        // Collect all potential sources from PREVIOUS phases
        const sources: { label: string, value: ReferenceSource, phaseName: string }[] = [];

        phases.filter(p => p.order < targetPhaseOrder).forEach(p => {
            if (p.type === 'group' && p.groups) {
                p.groups.forEach(g => {
                    // Add positions 1..4 (or matches length?)
                    // "1st Group A"
                    const count = Math.max(4, g.teams.length);
                    Array.from({ length: count }, (_, i) => i + 1).forEach(pos => {
                        sources.push({
                            label: pos + 'º Grupo ' + g.name,
                            value: { type: 'group.pos', id: g.name, index: pos },
                            phaseName: p.name
                        });
                    });
                });
            } else if (p.matches) {
                p.matches.forEach(m => {
                    sources.push({
                        label: 'Ganador #' + m.globalId + ' (' + m.name + ')',
                        value: { type: 'match.winner', id: String(m.globalId) }, // Use global ID as ref? Or internal ID? Global is better for user, but internal is safer.
                        phaseName: p.name
                    });

                    // Smart Context for Losers (Placement)
                    const context = targetPhaseOrder - p.order === 1 ? ' (Para 3er/4to o Clasif.)' : '';
                    sources.push({
                        label: 'Perdedor #' + m.globalId + ' (' + m.name + ')' + context,
                        value: { type: 'match.loser', id: String(m.globalId) },
                        phaseName: p.name
                    });
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
                        // Update name if generic?
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
                if (p.id === phaseId) { // Check phase ID to avoid scanning all phases if we pass it
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
                        // Handle swap inside groups? Usually group matches generated automatically.
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
    };

    const handleSimulationClick = (matchId: string, teamId: string | null) => {
        if (!isSimulation || !teamId) return;
        setSimulationResults(prev => ({
            ...prev,
            [matchId]: teamId
        }));
    };

    // -- Resolution --
    const resolveTeamId = (source: ReferenceSource | undefined): string | null => {
        if (!source) return null;
        if (source.type === 'team') return source.id;

        // Resolve dynamic
        if (source.type === 'match.winner' || source.type === 'match.loser') {
            // Find match
            let foundMatch: RoundMatch | undefined;
            // Search all phases
            for (const p of phases) {
                if (p.matches) {
                    const m = p.matches.find(m => String(m.globalId) === source.id);
                    if (m) { foundMatch = m; break; }
                }
                // Check group matches too if needed
            }

            if (foundMatch) {
                const winnerId = simulationResults[foundMatch.id];
                if (!winnerId) return null; // Not played yet

                if (source.type === 'match.winner') return winnerId;
                if (source.type === 'match.loser') {
                    // Find loser logic
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

    // -- Render --

    const renderSourceButtonFull = (match: RoundMatch, side: 'home' | 'away', phaseOrder: number) => {
        const source = side === 'home' ? match.sourceHome : match.sourceAway;
        const available = getAvailableSources(phaseOrder);

        // Sim Resolution
        const resolvedTeamId = resolveTeamId(source); // Recursive resolution!
        const resolvedTeamName = resolvedTeamId ? getTeamName(resolvedTeamId, teams) : null;

        // Winner Check
        const isWinner = simulationResults[match.id] === resolvedTeamId && resolvedTeamId !== null;

        // If picking
        if (editingMatchId === match.id + '-' + side && !isSimulation) {
            return (
                <div className="absolute top-0 left-0 bg-[#333] border border-blue-500 rounded-lg p-2 z-50 w-72 shadow-2xl max-h-60 overflow-y-auto font-sans">
                    <div className="text-xs text-blue-300 mb-2 font-bold uppercase sticky top-0 bg-[#333] pb-1 border-b border-white/10">Seleccionar Origen</div>
                    {available.length === 0 && <div className="text-white/30 text-xs italic">No hay fases previas</div>}
                    {Object.entries(available.reduce((acc, curr) => {
                        (acc[curr.phaseName] = acc[curr.phaseName] || []).push(curr);
                        return acc;
                    }, {} as Record<string, typeof available>)).map(([pName, opts]) => (
                        <div key={pName} className="mb-2">
                            <div className="text-[10px] text-white/50 uppercase font-bold px-1 mb-1">{pName}</div>
                            {opts.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className="w-full text-left p-1.5 text-xs text-white hover:bg-blue-500/20 rounded truncate flex items-center gap-2"
                                    onClick={() => handleConnectSource(match.id, side, opt.value)}
                                >
                                    <div className="w-1 h-1 bg-white/30 rounded-full" />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    ))}
                    <button onClick={() => setEditingMatchId(null)} className="mt-2 w-full text-center text-[10px] text-red-400 p-1 border border-red-500/20 rounded hover:bg-red-500/10 hover:text-red-300 transition-colors">Cancelar</button>
                </div>
            );
        }

        let label = '';
        // If Simulating, show resolved name better
        if (isSimulation && resolvedTeamName) {
            label = resolvedTeamName;
        } else if (source) {
            if (source.type === 'group.pos') label = source.index + 'º G' + source.id;
            else if (source.type === 'match.winner') label = 'Ganador';
            else if (source.type === 'match.loser') label = 'Perdedor';
            else if (source.type === 'team') label = getTeamName(source.id, teams);
        }

        return (
            <button
                onClick={() => {
                    if (isSimulation) {
                        if (resolvedTeamId) handleSimulationClick(match.id, resolvedTeamId);
                    } else {
                        setEditingMatchId(match.id + '-' + side);
                    }
                }}
                className={'w-full p-2 text-xs text-left rounded border transition-colors relative group ' +
                    (isWinner ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200' :
                        source ? 'bg-blue-900/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-dashed border-white/10 text-white/20 hover:border-white/30 hover:text-white')
                }
            >
                {source || resolvedTeamName ? (
                    <div className="flex items-center gap-2">
                        {!isSimulation && <LinkIcon size={12} className="opacity-50" />}
                        {isSimulation && <div className={`w-2 h-2 rounded-full ${isWinner ? 'bg-yellow-400' : 'bg-white/20'}`} />}
                        <span className="truncate">
                            {/* Hint Source in Edit Mode */}
                            {!isSimulation && source && source.type !== 'team' && (
                                <span className="text-[9px] opacity-70 block">
                                    {phases.find(p => p.groups?.some(g => g.name === source.id) || p.matches?.some(m => String(m.globalId) === source.id))?.name || 'Origen'} &gt;
                                </span>
                            )}
                            {label}
                            {!isSimulation && source && source.type !== 'group.pos' && (
                                <span className="ml-1 opacity-50 text-[10px]">
                                    (#{phases.flatMap(p => p.matches || []).find(m => String(m.globalId) === source.id || m.id === source.id)?.globalId || '?'})
                                </span>
                            )}
                        </span>
                    </div>
                ) : (
                    <span>+ Seleccionar</span>
                )}
            </button>
        );
    };

    const renderMatch = (match: RoundMatch, phase: TournamentPhase) => {
        return (
            <div
                key={match.id}
                className={`border rounded-lg p-3 shadow-lg transition-all group relative ${match.name === 'Gran Final'
                    ? 'bg-gradient-to-br from-yellow-900/20 to-black border-yellow-500/50 hover:border-yellow-400'
                    : phase.name === 'Finales'
                        ? 'bg-[#1a1a20] border-purple-500/30 hover:border-purple-400'
                        : 'bg-[#1a1a20] border-white/10 hover:border-blue-500/30'
                    }`}
            >
                {/* Match Header */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${match.name === 'Gran Final' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-black/40 text-white/40'}`}>
                            #{match.globalId}
                        </span>
                        {!isSimulation && (
                            <button
                                onClick={() => handleDeleteMatch(phase.id, match.id)}
                                className="text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar Partido"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                        {/* Swap Button */}
                        <button
                            onClick={() => handleSwapTeams(phase.id, match.id)}
                            className="text-white/10 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Intercambiar Local/Visita"
                        >
                            <ArrowLeftRight size={12} />
                        </button>
                    </div>
                    <div className="flex flex-col items-end">
                        <input
                            className={`bg-transparent text-xs text-right outline-none w-24 focus:bg-white/5 rounded px-1 ${match.name === 'Gran Final' ? 'text-yellow-200 font-bold' : 'text-white/70 focus:text-white'}`}
                            value={match.name}
                            onChange={() => { }}
                            readOnly={isSimulation}
                        />
                        <span className="text-[9px] text-white/30">{match.location}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    {/* Visitor */}
                    <div className="relative">
                        <div className="text-[10px] text-white/20 uppercase font-bold mb-0.5 ml-1">Visitante</div>
                        {renderSourceButtonFull(match, 'away', phase.order)}
                    </div>

                    <div className="flex items-center gap-2 m-auto">
                        <div className="h-px bg-white/10 flex-1 w-8"></div>
                        <span className="text-[10px] text-white/10 font-bold">VS</span>
                        <div className="h-px bg-white/10 flex-1 w-8"></div>
                    </div>

                    {/* Local */}
                    <div className="relative">
                        <div className="text-[10px] text-white/20 uppercase font-bold mb-0.5 ml-1">Local</div>
                        {renderSourceButtonFull(match, 'home', phase.order)}
                    </div>
                </div>
            </div>
        );
    };

    // -- Canvas Events --
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            setZoom(z => Math.max(0.2, Math.min(2, z + e.deltaY * -0.001)));
        } else {
            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };
    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => isDragging.current = false;

    // Champion Card Logic
    const renderChampionCard = () => {
        const finalMatch = phases.find(p => p.name === 'Finales')?.matches?.find(m => m.name === 'Gran Final');
        if (!finalMatch) return null;

        const winnerId = simulationResults[finalMatch.id];
        if (!winnerId) return null;

        const team = teams.find(t => t.id === winnerId);

        return (
            <div className="mt-8 flex flex-col items-center animate-bounce">
                <div className="text-yellow-500 font-bold uppercase tracking-[0.2em] text-xs mb-2">Campeón</div>
                <div className="bg-gradient-to-t from-yellow-600 to-yellow-300 p-1 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                    <div className="bg-black rounded-full p-1">
                        <div className="w-24 h-24 bg-[#1a1a20] rounded-full flex items-center justify-center border-2 border-yellow-500 overflow-hidden">
                            {team?.logo_url ? <img src={team.logo_url} className="w-full h-full object-cover" /> : <Trophy size={40} className="text-yellow-500" />}
                        </div>
                    </div>
                </div>
                <div className="mt-4 bg-yellow-500 text-black px-6 py-2 rounded-full font-black uppercase tracking-widest text-sm shadow-xl">
                    {team?.name || 'Campeón'}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-[#0f0f13] relative overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 flex items-center justify-between border-b border-white/5 z-20 bg-[#0f0f13]/80 backdrop-blur">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-white/50 text-xs uppercase tracking-wider font-bold">Diseñador de Torneo</span>
                        {isSimulation ? <span className="text-[10px] text-yellow-400 font-bold uppercase animate-pulse">MODO SIMULACIÓN</span> : <span className="text-[10px] text-green-400 font-bold uppercase">DISEÑO</span>}
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <button onClick={() => {
                        if (confirm("¿Regenerar el bracket? Se perderán los cambios manuales.")) {
                            generateStructure();
                        }
                    }} className="p-2 bg-white/5 hover:bg-yellow-500/20 text-white/50 hover:text-yellow-500 rounded border border-white/10 transition-colors" title="Regenerar Estructura">
                        <RefreshCcw size={14} />
                    </button>
                    <div className="h-4 w-px bg-white/10" />
                    <button onClick={() => setIsSimulation(!isSimulation)} className={`p-2 rounded border transition-colors flex items-center gap-2 text-xs font-bold ${isSimulation ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'}`}>
                        <Play size={14} className={isSimulation ? 'fill-current' : ''} /> {isSimulation ? 'Terminar Simulación' : 'Simular Torneo'}
                    </button>
                    {!isSimulation && (
                        <>
                            <div className="h-4 w-px bg-white/10" />
                            <button onClick={() => handleAddPhase('group')} className="px-3 py-1 bg-white/5 hover:bg-green-500/20 text-xs text-white rounded border border-white/10 hover:border-green-500/50 transition-colors">+ Fase de Grupos</button>
                            <button onClick={() => handleAddPhase('elimination')} className="px-3 py-1 bg-white/5 hover:bg-blue-500/20 text-xs text-white rounded border border-white/10 hover:border-blue-500/50 transition-colors">+ Fase Eliminatoria</button>
                            <button onClick={() => handleAddPhase('placement')} className="px-3 py-1 bg-white/5 hover:bg-purple-500/20 text-xs text-white rounded border border-white/10 hover:border-purple-500/50 transition-colors">+ Finales</button>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 text-white/50 hover:text-white"><ZoomOut size={16} /></button>
                    <span className="text-xs font-mono text-white/30">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 text-white/50 hover:text-white"><ZoomIn size={16} /></button>
                </div>
            </div>

            {/* Canvas */}
            <div
                className="flex-1 relative cursor-default touch-none"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <div className="absolute inset-0 overflow-hidden" ref={containerRef}>
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at center, #333 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`
                        }}
                    />

                    <div
                        className="absolute top-0 left-0 flex flex-col items-start p-20 gap-16 transition-transform duration-75"
                        style={{ transform: 'translate(' + pan.x + 'px, ' + pan.y + 'px) scale(' + zoom + ')' }}
                    >
                        {/* Classification Table */}
                        <div className="w-full max-w-4xl">
                            <ClassificationTable phases={phases} simulationResults={simulationResults} />
                        </div>

                        {/* Phases */}
                        <div className="flex items-start gap-16">
                            {phases.map((phase) => (
                                <div key={phase.id} className={`flex-shrink-0 flex flex-col gap-4 ${phase.name === 'Finales' ? 'w-[800px]' : 'w-80'}`} onMouseDown={e => e.stopPropagation()}>
                                    {/* Phase Header */}
                                    <div className={`flex items-center justify-between border p-3 rounded-lg group hover:border-white/20 transition-all ${phase.name === 'Finales' ? 'bg-purple-900/10 border-purple-500/30' : 'bg-white/5 border-white/10'}`}>
                                        <div className="flex items-center gap-2">
                                            <GripVertical size={14} className="text-white/20" />
                                            <input value={phase.name} onChange={(e) => handleUpdatePhaseName(phase.id, e.target.value)} className="bg-transparent text-sm font-bold outline-none text-white w-full" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {phase.order > 0 && (
                                                <button onClick={() => handleMovePhase(phase.id, 'left')} className="text-white/20 hover:text-white p-1 hover:bg-white/10 rounded">
                                                    <ArrowLeft size={12} />
                                                </button>
                                            )}
                                            {phase.order < phases.length - 1 && (
                                                <button onClick={() => handleMovePhase(phase.id, 'right')} className="text-white/20 hover:text-white p-1 hover:bg-white/10 rounded">
                                                    <ArrowRight size={12} />
                                                </button>
                                            )}
                                            {(phase.order > 0 || phase.type === 'group') && (
                                                <button onClick={() => handleDeletePhase(phase.id)} className="p-1 hover:text-red-400 text-white/20"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phase Body */}
                                    {phase.name === 'Finales' ? (
                                        // Custom Finals Layout
                                        <div className="grid grid-cols-2 gap-16 items-center min-h-[500px] border-l border-purple-500/20 pl-4 relative">
                                            {/* Decor */}
                                            <div className="absolute left-0 top-0 bottom-0 w-px bg-purple-500/20" />

                                            {/* Column 1: Semis */}
                                            <div className="flex flex-col justify-center gap-20">
                                                {phase.matches?.filter(m => m.name.includes('Semifinal')).map(m => renderMatch(m, phase))}
                                            </div>

                                            {/* Column 2: Final + Champion */}
                                            <div className="flex flex-col items-center gap-8 translate-y-8">
                                                {phase.matches?.filter(m => m.name === 'Gran Final').map(m => renderMatch(m, phase))}
                                                {isSimulation && renderChampionCard()}
                                                {phase.matches?.filter(m => m.name.includes('3er')).map(m => renderMatch(m, phase))}
                                            </div>
                                        </div>
                                    ) : phase.type === 'group' ? (
                                        // Group Render
                                        <div className="flex flex-col gap-6">
                                            {phase.groups?.map((group, idx) => (
                                                <div key={idx} className="bg-[#1a1a20]/50 border border-white/10 rounded-xl p-4">
                                                    <div className="text-sm font-bold text-blue-400 mb-4 px-1 flex justify-between">
                                                        <span>Grupo {group.name}</span>
                                                        {!isSimulation && <button onClick={() => handleDeleteGroup(phase.id, idx)} className="text-white/20 hover:text-red-400"><Trash2 size={12} /></button>}
                                                    </div>
                                                    <div className="grid gap-3">
                                                        {group.matches.map(m => renderMatch(m, phase))}
                                                    </div>
                                                </div>
                                            ))}
                                            {!isSimulation && <button onClick={() => handleAddGroup(phase.id)} className="w-full py-3 border border-dashed border-white/10 rounded text-center text-xs text-white/30 hover:text-white">+ Añadir Grupo</button>}
                                        </div>
                                    ) : (
                                        // Standard Elimination
                                        <div className="flex flex-col gap-4 min-h-[500px] border-l border-white/5 pl-4 relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5" />
                                            {phase.matches?.map(m => renderMatch(m, phase))}
                                            {!isSimulation && <button onClick={() => handleAddMatchToPhase(phase.id)} className="w-full py-3 border border-dashed border-white/10 rounded text-center text-xs text-white/30 hover:text-white">+ Añadir Partido</button>}
                                        </div>
                                    )}

                                </div>
                            ))}

                            {/* Add Column Button */}
                            {!isSimulation && (
                                <div className="h-full flex items-center pt-20">
                                    <button onClick={() => handleAddPhase('elimination')} className="w-16 h-96 border border-dashed border-white/10 rounded-full text-white/10 flex items-center justify-center hover:bg-white/5"><Plus size={24} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
