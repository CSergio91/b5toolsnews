
import React, { useEffect, useState, useRef } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { ZoomIn, ZoomOut, RefreshCcw, GripVertical, Trash2, Plus, Edit2, X, Check, Save, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { TournamentPhase, RoundMatch, ReferenceSource } from '../../types/structure';

// Helpers
const generateId = () => crypto.randomUUID();

export const BracketStep: React.FC = () => {
    const { state, teams } = useBuilder();

    // -- State --
    // We maintain a local structure state that mimics the global structure
    // In a real app we'd sync this 2-way with context, but for now we build it here.
    const [phases, setPhases] = useState<TournamentPhase[]>([]);

    // Canvas State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    // Drag/Drop Reordering
    const [draggedPhaseId, setDraggedPhaseId] = useState<string | null>(null);

    // Editing
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null); // For connecting sources

    // -- Init --
    useEffect(() => {
        // If state already has structure, load it
        if (state.structure && state.structure.phases.length > 0) {
            setPhases(state.structure.phases);
        } else {
            // Default Init: Group Phase + 1 Round of Playoffs (e.g. Final)
            // We assume Groups are passed from a previous step or we create a placeholder
            // For this specific requirement, we allow CREATING groups here too? 
            // "Adding Groups already created"
            // Let's create a Group Phase based on teams logic if possible, or just empty.

            const initialGroupPhase: TournamentPhase = {
                id: generateId(),
                type: 'group',
                name: 'Fase de Grupos',
                order: 0,
                groups: []
            };

            const initialFinal: TournamentPhase = {
                id: generateId(),
                type: 'elimination',
                name: 'Final',
                order: 1,
                matches: [{
                    id: generateId(),
                    globalId: 1, // Will be recalc
                    name: 'Gran Final',
                    roundIndex: 0,
                    phaseId: ''
                }]
            };
            initialFinal.matches![0].phaseId = initialFinal.id;

            setPhases([initialGroupPhase, initialFinal]);
        }
    }, []); // Run once on mount

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

    const handleAddPhase = (type: 'elimination' | 'placement') => {
        const newPhase: TournamentPhase = {
            id: generateId(),
            type,
            name: type === 'placement' ? 'Lugares' : 'Nueva Ronda',
            order: phases.length,
            matches: []
        };
        // Add default match
        newPhase.matches = [{
            id: generateId(),
            globalId: 0,
            name: 'Partido 1',
            roundIndex: 0,
            phaseId: newPhase.id
        }];

        setPhases(prev => recalculateGlobalIds([...prev, newPhase]));
    };

    const handleDeletePhase = (id: string) => {
        if (confirm("¿Eliminar esta fase?")) {
            setPhases(prev => recalculateGlobalIds(prev.filter(p => p.id !== id)));
        }
    };

    const handleUpdatePhaseName = (id: string, newName: string) => {
        setPhases(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
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

    // -- Connection Logic --

    // Returns available sources for a specific match
    const getAvailableSources = (targetPhaseOrder: number) => {
        // Collect all potential sources from PREVIOUS phases
        const sources: { label: string, value: ReferenceSource }[] = [];

        phases.filter(p => p.order < targetPhaseOrder).forEach(p => {
            if (p.type === 'group' && p.groups) {
                p.groups.forEach(g => {
                    // Add positions 1..4 (or matches length?)
                    // "1st Group A"
                    [1, 2, 3, 4].forEach(pos => {
                        sources.push({
                            label: pos + 'º Grupo ' + g.name,
                            value: { type: 'group.pos', id: g.name, index: pos }
                        });
                    });
                });
            } else if (p.matches) {
                p.matches.forEach(m => {
                    sources.push({
                        label: 'Ganador #' + m.globalId + ' (' + m.name + ')',
                        value: { type: 'match.winner', id: String(m.globalId) } // Use global ID as ref? Or internal ID? Global is better for user, but internal is safer.
                        // User requested global numbering focus. Let's use internal ID for link, display Global.
                        // Actually, let's use internal ID for the link ID, but display the global one.
                    });
                    sources.push({
                        label: 'Perdedor #' + m.globalId + ' (' + m.name + ')',
                        value: { type: 'match.loser', id: String(m.globalId) } // Actually standard is to link by ID
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
                <div className="absolute top-0 left-0 bg-[#333] border border-blue-500 rounded-lg p-2 z-50 w-64 shadow-2xl max-h-60 overflow-y-auto">
                    <div className="text-xs text-blue-300 mb-2 font-bold uppercase">Seleccionar Origen</div>
                    {available.length === 0 && <div className="text-white/30 text-xs italic">No hay fases previas</div>}
                    {available.map((opt, idx) => (
                        <button
                            key={idx}
                            className="w-full text-left p-1 text-xs text-white hover:bg-blue-500/20 rounded truncate"
                            onClick={() => handleConnectSource(match.id, side, opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                    <button onClick={() => setEditingMatchId(null)} className="mt-2 w-full text-center text-[10px] text-red-400 p-1 border border-red-500/20 rounded hover:bg-red-500/10">Cancelar</button>
                </div>
            );
        }

        let label = '';
        if (source) {
            if (source.type === 'group.pos') {
                label = source.index + 'º G' + source.id;
            } else if (source.type === 'match.winner') {
                label = 'Ganador';
            } else {
                label = 'Perdedor';
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

    return (
        <div className="h-full flex flex-col bg-[#0f0f13] relative overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 flex items-center justify-between border-b border-white/5 z-20 bg-[#0f0f13]/80 backdrop-blur">
                <div className="flex items-center gap-4">
                    <span className="text-white/50 text-xs uppercase tracking-wider font-bold">Diseñador de Torneo</span>
                    <div className="h-4 w-px bg-white/10" />
                    <button onClick={() => handleAddPhase('elimination')} className="px-3 py-1 bg-white/5 hover:bg-blue-500/20 text-xs text-white rounded border border-white/10 hover:border-blue-500/50 transition-colors">
                        + Fase Eliminatoria
                    </button>
                    <button onClick={() => handleAddPhase('placement')} className="px-3 py-1 bg-white/5 hover:bg-purple-500/20 text-xs text-white rounded border border-white/10 hover:border-purple-500/50 transition-colors">
                        + Fase Lugares
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
                className="flex-1 relative cursor-default"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: (20 * zoom) + 'px ' + (20 * zoom) + 'px',
                        backgroundPosition: pan.x + 'px ' + pan.y + 'px'
                    }}
                />

                {/* Content Container */}
                <div
                    className="absolute top-0 left-0 flex items-start p-20 gap-16 transition-transform duration-75"
                    style={{ transform: 'translate(' + pan.x + 'px, ' + pan.y + 'px) scale(' + zoom + ')' }}
                >
                    {phases.map((phase, idx) => (
                        <div
                            key={phase.id}
                            className="w-80 flex-shrink-0 flex flex-col gap-4"
                            onMouseDown={e => e.stopPropagation()} // Prevent pan when clicking phase
                        >
                            {/* Phase Header */}
                            <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-lg group hover:border-white/20">
                                <div className="flex items-center gap-2">
                                    <div className="bg-white/10 p-1 rounded cursor-grab active:cursor-grabbing text-white/20 hover:text-white">
                                        <GripVertical size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        value={phase.name}
                                        onChange={(e) => handleUpdatePhaseName(phase.id, e.target.value)}
                                        className="bg-transparent text-sm font-bold text-white outline-none w-full"
                                    />
                                </div>
                                {phase.order > 0 && (
                                    <button onClick={() => handleDeletePhase(phase.id)} className="text-white/20 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Phase Content */}
                            <div className="flex flex-col gap-4 min-h-[500px] border-l border-white/5 pl-4 relative">
                                {/* Vertical Line Decor */}
                                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5" />

                                {phase.type === 'group' ? (
                                    // Group Render (Simplified for Designer)
                                    // We need to render "slots" representing the groups
                                    <div className="text-white/30 text-xs italic p-4 text-center border border-dashed border-white/10 rounded-lg">
                                        Fase de Grupos (Configurada en paso anterior)
                                        <br />
                                        <span className="not-italic text-white mt-2 block font-bold">4 Grupos (A-D)</span>
                                    </div>
                                ) : (
                                    // Matches Render
                                    phase.matches?.map(match => (
                                        <div key={match.id} className="bg-[#1a1a20] border border-white/10 rounded-lg p-3 shadow-lg hover:border-blue-500/30 transition-all group relative">
                                            {/* Match Header */}
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-white/40">#{match.globalId}</span>
                                                <input
                                                    className="bg-transparent text-xs text-white/70 text-right outline-none w-24 focus:text-white focus:bg-white/5 rounded px-1"
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

                    {/* Add Phase Column (Corrected Text Orientation) */}
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
    );
};

// Helper
const getTeamName = (id: string | null | undefined, teams: any[]) => {
    if (!id) return 'TBD';
    if (id === 'BYE') return 'BYE';
    const t = teams.find(team => team.id === id);
    return t ? t.name : 'Unknown';
}
