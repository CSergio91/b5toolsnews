
import React, { useEffect, useState, useRef } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { ZoomIn, ZoomOut, RefreshCcw, GripVertical, Trash2, Plus, Edit2, X, Check, Save, Link as LinkIcon, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
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
    const { state, teams } = useBuilder();
    const { addToast } = useToast();

    // -- State --
    // We maintain a local structure state that mimics the global structure
    // In a real app we'd sync this 2-way with context, but for now we build it here.
    const [phases, setPhases] = useState<TournamentPhase[]>([]);

    // Canvas State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Drag/Drop Reordering
    const [draggedPhaseId, setDraggedPhaseId] = useState<string | null>(null);

    // Editing
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null); // For connecting sources

    // -- Persistence Sync --
    useEffect(() => {
        if (phases.length > 0) {
            // Update Context
            // Be careful about loops. `updateStructure` triggers state change.
            // If `phases` is equal to `state.structure.phases`, don't update?
            // Simple check length or stringify for now.
            const currentStr = JSON.stringify(phases);
            const prevStr = JSON.stringify(state.structure?.phases || []);

            if (currentStr !== prevStr) {
                const debounce = setTimeout(() => {
                    const sorted = recalculateGlobalIds(phases); // Ensure numbering
                    state.structure = {
                        phases: sorted,
                        globalMatchCount: 0 // TODO calculate
                    };
                    // useBuilder provided updateStructure?
                    // Not imported here? Let's check imports.
                    // The component wrapper or context needs to provide `updateStructure`.
                    // `useBuilder` provides `updateStructure` in context.
                }, 1000); // 1s Debounce
                return () => clearTimeout(debounce);
            }
        }
    }, [phases]);

    // -- Init --
    // -- Actions --

    const recalculateGlobalIds = (currentPhases: TournamentPhase[]) => {
        let count = 1;
        // Logic: Iterate phases by order.
        // Groups: count += matches.length
        // Elimination: Iterate matches
        const sorted = [...currentPhases].sort((a, b) => a.order - b.order);

        sorted.forEach(p => {
            if (p.type === 'group' && p.groups) {
                p.groups.forEach(g => {
                    // Assume group matches are already generated/counted. 
                    // We just reserve the block.
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
        // DEBUG: Verify teams presence
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
                location: `${state.config.sets_per_match || 3} Sets`
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
            const setsInfo = state.config.sets_per_match || 3;

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
                            location: `${setsInfo} Sets`
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
                    phaseId: generateId()
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

    // -- Init --
    useEffect(() => {
        // If state already has structure, load it
        if (state.structure && state.structure.phases.length > 0) {
            setPhases(state.structure.phases);
        } else {
            generateStructure();
        }
    }, [state.teams, state.config.tournament_type, state.config.number_of_groups]); // Run when these change (and phases empty)

    const handleAddPhase = (type: 'elimination' | 'placement' | 'group') => {
        const setsInfo = state.config.sets_per_match || 3;

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
                    type: 'elimination', // treating as elimination for rendering purposes, or keep 'placement' if specific render needed? 
                    // User asked for "bracket llamado Finales". Render logic usually handles 'elimination' well.
                    // Let's use 'elimination' type but name it 'Finales' to reuse match rendering.
                    // Or if 'placement' type has special rendering, I should check. 
                    // Currently render checks `phase.type === 'group' ? ... : ...` so 'elimination' and 'placement' render same.
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
                        location: `${setsInfo} Sets`
                    },
                    {
                        id: semi2Id,
                        globalId: 0,
                        name: 'Semifinal 2',
                        roundIndex: 0,
                        phaseId: newPhase.id,
                        location: `${setsInfo} Sets`
                    },
                    {
                        id: thirdPlaceId,
                        globalId: 0,
                        name: '3er y 4to Puesto',
                        roundIndex: 1,
                        phaseId: newPhase.id,
                        location: `${setsInfo} Sets`,
                        sourceHome: { type: 'match.loser', id: semi1Id },
                        sourceAway: { type: 'match.loser', id: semi2Id }
                    },
                    {
                        id: finalId,
                        globalId: 0,
                        name: 'Gran Final',
                        roundIndex: 1,
                        phaseId: newPhase.id,
                        location: `${setsInfo} Sets`,
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
                        location: `${setsInfo} Sets`
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
                            phaseId: phaseId
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
                    [1, 2, 3, 4].forEach(pos => {
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

    // -- Render --

    const renderSourceButton = (match: RoundMatch, side: 'home' | 'away', phaseOrder: number) => {
        const source = side === 'home' ? match.sourceHome : match.sourceAway;
        const available = getAvailableSources(phaseOrder);

        // If picking
        if (editingMatchId === match.id + '-' + side) {
            return (
                <div className="absolute top-0 left-0 bg-[#333] border border-blue-500 rounded-lg p-2 z-50 w-72 shadow-2xl max-h-60 overflow-y-auto font-sans">
                    <div className="text-xs text-blue-300 mb-2 font-bold uppercase sticky top-0 bg-[#333] pb-1 border-b border-white/10">Seleccionar Origen</div>
                    {available.length === 0 && <div className="text-white/30 text-xs italic">No hay fases previas</div>}

                    {/* Group by Phase Name */}
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
        if (source) {
            if (source.type === 'group.pos') {
                label = source.index + 'º G' + source.id;
            } else if (source.type === 'match.winner') {
                label = 'Ganador';
            } else if (source.type === 'match.loser') {
                label = 'Perdedor';
            } else if (source.type === 'team') {
                // Need to look up team name from context
                label = getTeamName(source.id, teams);
            }
        }

        return (
            <button
                onClick={() => setEditingMatchId(match.id + '-' + side)}
                className={'w-full p-2 text-xs text-left rounded border transition-colors relative group ' +
                    (source ? 'bg-blue-900/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-dashed border-white/10 text-white/20 hover:border-white/30 hover:text-white')
                }
            >
                {source ? (
                    <div className="flex items-center gap-2">
                        <LinkIcon size={12} className="opacity-50" />
                        <span className="truncate">
                            {/* Try to find source phase name if possible */}
                            {source.type !== 'team' && (
                                <span className="text-[9px] opacity-70 block">
                                    {phases.find(p => p.groups?.some(g => g.name === source.id) || p.matches?.some(m => String(m.globalId) === source.id))?.name || 'Origen'} &gt;
                                </span>
                            )}
                            {label}
                            {source.type !== 'group.pos' && (
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

    // -- Touch Events --
    const lastTouchDistance = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            isDragging.current = true;
            lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            lastTouchDistance.current = dist;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging.current && e.touches.length === 1) {
            const dx = e.touches[0].clientX - lastPos.current.x;
            const dy = e.touches[0].clientY - lastPos.current.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2 && lastTouchDistance.current) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const delta = dist - lastTouchDistance.current;
            setZoom(z => Math.max(0.2, Math.min(2, z + delta * 0.005)));
            lastTouchDistance.current = dist;
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        lastTouchDistance.current = null;
    };

    return (
        <div className="h-full flex flex-col bg-[#0f0f13] relative overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 flex items-center justify-between border-b border-white/5 z-20 bg-[#0f0f13]/80 backdrop-blur">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-white/50 text-xs uppercase tracking-wider font-bold">Diseñador de Torneo</span>
                        {!state.config.tournament_type ? (
                            <span className="text-[10px] text-green-400 font-bold uppercase animate-pulse">Free Mode</span>
                        ) : (
                            <span className="text-[10px] text-green-400 font-bold uppercase">
                                {state.config.tournament_type === 'groups' && 'Formato Grupos + Play Off'}
                                {state.config.tournament_type === 'cup' && 'Eliminacion Directa'}
                                {state.config.tournament_type === 'double_elimination' && 'Doble Eliminacion'}
                                {state.config.tournament_type === 'league' && 'Liga'}
                            </span>
                        )}
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <button
                        onClick={() => {
                            if (confirm("¿Regenerar el bracket? Se perderán los cambios manuales.")) {
                                generateStructure();
                            }
                        }}
                        className="p-2 bg-white/5 hover:bg-yellow-500/20 text-white/50 hover:text-yellow-500 rounded border border-white/10 transition-colors"
                        title="Regenerar Estructura"
                    >
                        <RefreshCcw size={14} />
                    </button>
                    <div className="h-4 w-px bg-white/10" />
                    <button onClick={() => handleAddPhase('group')} className="px-3 py-1 bg-white/5 hover:bg-green-500/20 text-xs text-white rounded border border-white/10 hover:border-green-500/50 transition-colors">
                        + Fase de Grupos
                    </button>
                    <button onClick={() => handleAddPhase('elimination')} className="px-3 py-1 bg-white/5 hover:bg-blue-500/20 text-xs text-white rounded border border-white/10 hover:border-blue-500/50 transition-colors">
                        + Fase Eliminatoria
                    </button>
                    <button onClick={() => handleAddPhase('placement')} className="px-3 py-1 bg-white/5 hover:bg-purple-500/20 text-xs text-white rounded border border-white/10 hover:border-purple-500/50 transition-colors">
                        + Finales
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 text-white/50 hover:text-white"><ZoomOut size={16} /></button>
                    <span className="text-xs font-mono text-white/30">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 text-white/50 hover:text-white"><ZoomIn size={16} /></button>
                </div>
            </div>

            {/* Infinite Canvas */}
            <div
                className="flex-1 relative cursor-default touch-none"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Canvas Area */}
                <div className="absolute inset-0 overflow-hidden" ref={containerRef}>
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at center, #333 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`
                        }}
                    />

                    {/* Content Container */}
                    <div
                        className="absolute top-0 left-0 flex flex-col items-start p-20 gap-16 transition-transform duration-75"
                        style={{ transform: 'translate(' + pan.x + 'px, ' + pan.y + 'px) scale(' + zoom + ')' }}
                    >
                        {/* Classification Table (Part of Canvas) */}
                        <div className="w-full max-w-4xl">
                            <ClassificationTable phases={phases} />
                        </div>

                        <div className="flex items-start gap-16">
                            {phases.map((phase, idx) => (
                                <div
                                    key={phase.id}
                                    className="w-80 flex-shrink-0 flex flex-col gap-4"
                                    onMouseDown={e => e.stopPropagation()} // Prevent pan when clicking phase
                                >
                                    {/* Phase Header */}
                                    <div className={`flex items-center justify-between border p-3 rounded-lg group hover:border-white/20 transition-all ${phase.name === 'Finales' ? 'bg-purple-900/10 border-purple-500/30' : 'bg-white/5 border-white/10'
                                        }`}>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-white/10 p-1 rounded cursor-grab active:cursor-grabbing text-white/20 hover:text-white">
                                                <GripVertical size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                value={phase.name}
                                                onChange={(e) => handleUpdatePhaseName(phase.id, e.target.value)}
                                                className={`bg-transparent text-sm font-bold outline-none w-full ${phase.name === 'Finales' ? 'text-purple-300' : 'text-white'}`}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {phase.order > 0 && (
                                                <button onClick={() => handleMovePhase(phase.id, 'left')} className="text-white/20 hover:text-white p-1 hover:bg-white/10 rounded" title="Mover a la izquierda">
                                                    <ArrowLeft size={12} />
                                                </button>
                                            )}
                                            {phase.order < phases.length - 1 && (
                                                <button onClick={() => handleMovePhase(phase.id, 'right')} className="text-white/20 hover:text-white p-1 hover:bg-white/10 rounded" title="Mover a la derecha">
                                                    <ArrowRight size={12} />
                                                </button>
                                            )}
                                            {(phase.order > 0 || phase.type === 'group') && (
                                                <button onClick={() => handleDeletePhase(phase.id)} className="text-white/20 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phase Content */}
                                    <div className={`flex flex-col gap-4 min-h-[500px] border-l pl-4 relative ${phase.name === 'Finales' ? 'border-purple-500/20' : 'border-white/5'}`}>
                                        {/* Vertical Line Decor */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-px ${phase.name === 'Finales' ? 'bg-purple-500/20' : 'bg-white/5'}`} />

                                        {phase.type === 'group' ? (
                                            // Group Render (Simplified for Designer)
                                            // We need to render "slots" representing the groups
                                            <div className="flex flex-col gap-6">
                                                {phase.groups?.map((group, gIdx) => (
                                                    <div key={gIdx} className="bg-[#1a1a20]/50 border border-white/10 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                                                        <div className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wider flex justify-between items-center border-b border-white/5 pb-2">
                                                            <span>Grupo {group.name}</span>
                                                            <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                                                                {group.matches.length} Partidos
                                                            </span>
                                                            <button
                                                                onClick={() => handleDeleteGroup(phase.id, gIdx)}
                                                                className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-red-400 ml-2"
                                                                title="Eliminar Grupo"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>

                                                        {/* Group Matches Grid */}
                                                        <div className="grid gap-3">
                                                            {group.matches.map((match: RoundMatch, mIdx: number) => (
                                                                <div key={match.id} className="bg-[#0f0f13] border border-white/5 rounded-lg p-2 hover:border-blue-500/30 transition-all group/match relative">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-[10px] text-white/30 font-mono">#{match.globalId}</span>
                                                                        <span className="text-[9px] text-green-400 bg-green-900/20 px-1.5 rounded">{state.config.sets_per_match || 3} Sets</span>
                                                                    </div>

                                                                    <div className="flex flex-col gap-1.5">
                                                                        {/* Away */}
                                                                        <div className="flex items-center justify-between text-xs text-white/70 bg-white/5 p-1 rounded px-2">
                                                                            <span>{match.sourceAway?.type === 'team' ? getTeamName(match.sourceAway.id, teams) : 'TBD'}</span>
                                                                            <span className="text-[10px] text-white/20">VIS</span>
                                                                        </div>
                                                                        {/* Home */}
                                                                        <div className="flex items-center justify-between text-xs text-white/70 bg-white/5 p-1 rounded px-2">
                                                                            <span>{match.sourceHome?.type === 'team' ? getTeamName(match.sourceHome.id, teams) : 'TBD'}</span>
                                                                            <span className="text-[10px] text-white/20">LOC</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {group.matches.length === 0 && (
                                                                <div className="text-[10px] text-white/20 italic p-1 text-center">Sin partidos generados</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => handleAddGroup(phase.id)}
                                                    className="w-full py-3 border border-dashed border-white/10 rounded-lg text-white/20 hover:text-white hover:border-white/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={14} /> Añadir Grupo
                                                </button>
                                            </div>
                                        ) : (
                                            // Matches Render
                                            phase.matches?.map(match => (
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
                                                            <button
                                                                onClick={() => handleDeleteMatch(phase.id, match.id)}
                                                                className="text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Eliminar Partido"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                        <input
                                                            className={`bg-transparent text-xs text-right outline-none w-24 focus:bg-white/5 rounded px-1 ${match.name === 'Gran Final' ? 'text-yellow-200 font-bold' : 'text-white/70 focus:text-white'
                                                                }`}
                                                            value={match.name}
                                                            onChange={() => { }} // TODO: Update match name
                                                        />
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        {/* Visitor Slot */}
                                                        <div className="relative">
                                                            <div className="text-[10px] text-white/20 uppercase font-bold mb-0.5 ml-1">Visitante</div>
                                                            {renderSourceButton(match, 'away', phase.order)}
                                                        </div>

                                                        <div className="flex items-center gap-2 m-auto">
                                                            <div className="h-px bg-white/10 flex-1 w-8"></div>
                                                            <span className="text-[10px] text-white/10 font-bold">VS</span>
                                                            <div className="h-px bg-white/10 flex-1 w-8"></div>
                                                        </div>

                                                        {/* Local Slot */}
                                                        <div className="relative">
                                                            <div className="text-[10px] text-white/20 uppercase font-bold mb-0.5 ml-1">Local</div>
                                                            {renderSourceButton(match, 'home', phase.order)}
                                                        </div>
                                                    </div>

                                                    {/* Connectors (Decor) */}
                                                    <div className="absolute top-1/2 -left-4 w-4 h-px bg-white/10" />
                                                    <div className="absolute top-1/2 -right-4 w-4 h-px bg-white/10" />
                                                </div>
                                            ))
                                        )}

                                        {phase.type !== 'group' && (
                                            <button
                                                onClick={() => handleAddMatchToPhase(phase.id)}
                                                className="w-full py-3 border border-dashed border-white/10 rounded-lg text-white/20 hover:text-white hover:border-white/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={14} /> Añadir Partido
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Add Phase Column */}
                            <div className="h-full flex items-center pt-20">
                                <button
                                    onClick={() => handleAddPhase('elimination')}
                                    className="w-16 h-96 border border-dashed border-white/10 rounded-full flex flex-col items-center justify-center text-white/10 hover:text-white hover:border-white/30 transition-all hover:bg-white/5 gap-4 group"
                                >
                                    <span className="uppercase tracking-widest text-xs font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                        Añadir Nueva Ronda
                                    </span>
                                    <Plus size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper
const getTeamName = (id: string | null | undefined, teams: any[]) => {
    if (!id) return '...';
    if (id === 'BYE') return 'BYE';
    // Ensure ID comparison is safe (string vs number?)
    // Note: teams IDs are UUIDs (strings)
    const t = teams.find(team => String(team.id) === String(id));
    return t ? t.name : 'Unknown';
};
