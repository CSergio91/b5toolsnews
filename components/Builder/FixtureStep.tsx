import React, { useState, useEffect } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { generateSingleEliminationBracket, generateGroupStage, generateMatchesForOneGroup, GroupStructure } from '../../utils/bracketGenerator';
import { BracketStep } from './BracketStep';
import { LayoutGrid, List, Calendar, Move } from 'lucide-react';

export const FixtureStep: React.FC = () => {
    const { state, teams, updateStructure } = useBuilder();
    const [viewMode, setViewMode] = useState<'groups' | 'bracket'>('groups');
    const [generatedGroups, setGeneratedGroups] = useState<GroupStructure[]>([]);

    const isGroupFormat = (state.config as any).tournament_type === 'group_stage';

    const [unassignedTeams, setUnassignedTeams] = useState<string[]>([]);

    // Initialize Empty Groups
    useEffect(() => {
        if (isGroupFormat && generatedGroups.length === 0) {
            const groupsCount = (state.config as any).number_of_groups || 4;
            const groups: GroupStructure[] = Array.from({ length: groupsCount }, (_, i) => ({
                name: String.fromCharCode(65 + i),
                teams: [],
                matches: []
            }));
            setGeneratedGroups(groups);
            // Initially all teams are unassigned
            setUnassignedTeams(teams.map(t => t.id));
            setViewMode('groups');
        } else if (!isGroupFormat) {
            setViewMode('bracket');
        }
    }, [isGroupFormat, state.config.number_of_groups]); // Removed teams from dependency to avoid auto-reset

    // Update unassigned teams whenever groups change
    useEffect(() => {
        const assigned = new Set(generatedGroups.flatMap(g => g.teams));
        setUnassignedTeams(teams.map(t => t.id).filter(id => !assigned.has(id)));

        // Sync to Global Structure
        // Find existing 'group' phase or create one
        let existingStructure = state.structure || { phases: [], globalMatchCount: 0 };
        const phaseIndex = existingStructure.phases.findIndex(p => p.type === 'group');

        const groupPhase: any = {
            id: phaseIndex >= 0 ? existingStructure.phases[phaseIndex].id : crypto.randomUUID(),
            type: 'group',
            name: 'Fase de Grupos',
            order: 0,
            groups: generatedGroups.map(g => ({
                name: g.name,
                teams: g.teams,
                matches: g.matches.map(m => ({
                    id: m.id,
                    globalId: 0, // Placeholder, engine should numbering
                    name: `G${g.name} - Match`,
                    phaseId: 'group-phase',
                    // ... map other fields if needed
                    roundIndex: 0
                } as any))
            }))
        };

        let newPhases = [...existingStructure.phases];
        if (phaseIndex >= 0) {
            newPhases[phaseIndex] = groupPhase;
        } else {
            // Insert at start
            newPhases = [groupPhase, ...newPhases];
        }

        // Ideally we only update if changed deep? 
        // For now let's only update if we are in viewMode groups to avoid loop with BracketStep
        if (viewMode === 'groups') {
            updateStructure({ ...existingStructure, phases: newPhases });
        }
    }, [generatedGroups, teams]);

    // Explicit Sync when switching to Bracket
    useEffect(() => {
        if (viewMode === 'bracket') {
            let existingStructure = state.structure || { phases: [], globalMatchCount: 0 };
            const phaseIndex = existingStructure.phases.findIndex(p => p.type === 'group');

            const groupPhase: any = {
                id: phaseIndex >= 0 ? existingStructure.phases[phaseIndex].id : crypto.randomUUID(),
                type: 'group',
                name: 'Fase de Grupos',
                order: 0,
                groups: generatedGroups.map(g => ({
                    name: g.name,
                    teams: g.teams,
                    matches: g.matches.map(m => ({
                        id: m.id || crypto.randomUUID(),
                        globalId: 0,
                        name: `${m.home} vs ${m.away}`,
                        phaseId: 'group-phase',
                        // Map TempMatch to RoundMatch
                        sourceHome: { type: 'group.pos', id: g.name, index: -1 }, // TODO better map
                        roundIndex: 0
                    }))
                }))
            };

            let newPhases = [...existingStructure.phases];
            if (phaseIndex >= 0) {
                newPhases[phaseIndex] = groupPhase;
            } else {
                newPhases = [groupPhase, ...newPhases];
            }

            updateStructure({ ...existingStructure, phases: newPhases });
        }
    }, [viewMode]);

    // Actions
    const handleAssignTeam = (teamId: string, groupName: string) => {
        if (!teamId) return;
        setGeneratedGroups(prev => {
            const newGroups = prev.map(g => ({ ...g, teams: [...g.teams], matches: [...g.matches] }));
            // Actually we need to regenerate matches if we change teams? 
            // The requirement implies we setup groups THEN generate matches?
            // "no vas a asignar los equipos a los grupos automaticamente, crearas los grupos y los espacios..."
            // Usually matches are generated AFTER groups are finalized.
            // But existing logic generates matches on the fly. Let's keep it consistent.

            const target = newGroups.find(g => g.name === groupName);
            if (target && !target.teams.includes(teamId)) {
                target.teams.push(teamId);
                target.matches = generateMatchesForOneGroup(target.teams, target.name);
            }
            return newGroups;
        });
    };

    const handleRemoveTeam = (teamId: string, groupName: string) => {
        setGeneratedGroups(prev => {
            const newGroups = prev.map(g => ({ ...g, teams: [...g.teams] }));
            const target = newGroups.find(g => g.name === groupName);
            if (target) {
                target.teams = target.teams.filter(t => t !== teamId);
                target.matches = generateMatchesForOneGroup(target.teams, target.name);
            }
            return newGroups;
        });
    };

    const handleRandomize = () => {
        if (confirm("¿Asignar aleatoriamente todos los equipos? Esto sobrescribirá la configuración actual.")) {
            // Shuffle teams
            const shuffled = [...teams].sort(() => 0.5 - Math.random());
            const groupsCount = (state.config as any).number_of_groups || 4;
            const newGroups = generateGroupStage(shuffled, groupsCount);
            setGeneratedGroups(newGroups);
        }
    };

    const handleUnassignAll = () => {
        if (confirm("¿Quitar todos los equipos de los grupos?")) {
            const groupsCount = (state.config as any).number_of_groups || 4;
            setGeneratedGroups(Array.from({ length: groupsCount }, (_, i) => ({
                name: String.fromCharCode(65 + i),
                teams: [],
                matches: []
            })));
        }
    };

    // Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, teamId: string, sourceGroupName: string) => {
        e.dataTransfer.setData('teamId', teamId);
        e.dataTransfer.setData('sourceGroupName', sourceGroupName);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (
        e: React.DragEvent | any,
        targetGroupName: string,
        targetIndex: number = -1,
        manualTeamId?: string,
        manualSourceGroup?: string
    ) => {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();

        const teamId = manualTeamId || e.dataTransfer.getData('teamId');
        const sourceGroupName = manualSourceGroup || e.dataTransfer.getData('sourceGroupName');

        setGeneratedGroups(prev => {
            const newGroups = prev.map(g => ({ ...g, teams: [...g.teams], matches: [...g.matches] }));
            const sourceGroup = newGroups.find(g => g.name === sourceGroupName);
            const targetGroup = newGroups.find(g => g.name === targetGroupName);

            if (!sourceGroup || !targetGroup) return prev;
            const currentSourceIndex = sourceGroup.teams.indexOf(teamId);
            if (currentSourceIndex === -1) return prev;

            if (sourceGroupName === targetGroupName) {
                sourceGroup.teams.splice(currentSourceIndex, 1);
                if (targetIndex === -1) sourceGroup.teams.push(teamId);
                else sourceGroup.teams.splice(targetIndex, 0, teamId);
                sourceGroup.matches = generateMatchesForOneGroup(sourceGroup.teams, sourceGroup.name);
                return newGroups;
            } else {
                if (targetGroup.teams.includes(teamId)) return prev;
                sourceGroup.teams.splice(currentSourceIndex, 1);
                if (targetIndex === -1) targetGroup.teams.push(teamId);
                else targetGroup.teams.splice(targetIndex, 0, teamId);
                sourceGroup.matches = generateMatchesForOneGroup(sourceGroup.teams, sourceGroup.name);
                targetGroup.matches = generateMatchesForOneGroup(targetGroup.teams, targetGroup.name);
                return newGroups;
            }
        });
    };

    const moveTeamToNextGroup = (teamId: string, currentGroupName: string) => {
        const currentGroupIdx = generatedGroups.findIndex(g => g.name === currentGroupName);
        if (currentGroupIdx === -1) return;
        const nextGroup = generatedGroups[(currentGroupIdx + 1) % generatedGroups.length];
        // Simulate Drop
        handleDrop({ preventDefault: () => { }, stopPropagation: () => { } } as any, nextGroup.name, -1, teamId, currentGroupName);
    };

    const reorderTeamUp = (teamId: string, groupName: string, currentIdx: number) => {
        if (currentIdx <= 0) return;
        handleDrop({ preventDefault: () => { }, stopPropagation: () => { } } as any, groupName, currentIdx - 1, teamId, groupName);
    };

    if (!isGroupFormat || viewMode === 'bracket') {
        return (
            <div className="h-full flex flex-col">
                {isGroupFormat && (
                    <div className="mb-4 flex gap-2">
                        <button onClick={() => setViewMode('groups')} className="px-4 py-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 text-sm font-bold">
                            ← Volver a Grupos
                        </button>
                    </div>
                )}
                <BracketStep />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col animate-in fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <LayoutGrid className="text-blue-500" /> Fase de Grupos
                </h2>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                        onClick={handleRandomize}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors"
                        title="Asignar Aleatoriamente"
                    >
                        🎲 Aleatorio
                    </button>
                    <button
                        onClick={handleUnassignAll}
                        className="px-3 py-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-xs font-bold text-red-300 transition-colors"
                    >
                        Limpiar
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-2 hidden md:block"></div>
                    <button
                        onClick={() => setViewMode('bracket')}
                        className="w-full md:w-auto justify-center px-4 py-3 md:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        Ver Llave de Playoff →
                    </button>
                </div>
            </div>

            {/* Unassigned Teams Indicator */}
            {unassignedTeams.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-xs flex items-center gap-2">
                    <span className="font-bold">⚠ {unassignedTeams.length} equipos sin asignar:</span>
                    <span className="opacity-70 truncate">{unassignedTeams.map(id => teams.find(t => t.id === id)?.name).join(', ')}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pb-32 lg:pb-20">
                {generatedGroups.map((group, groupIdx) => {
                    const gradients = [
                        'from-blue-600/20 to-blue-800/10 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] border-blue-500/30',
                        'from-purple-600/20 to-purple-800/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] border-purple-500/30',
                        'from-orange-600/20 to-orange-800/10 hover:shadow-[0_0_30px_rgba(249,115,22,0.25)] border-orange-500/30',
                        'from-pink-600/20 to-pink-800/10 hover:shadow-[0_0_30px_rgba(236,72,153,0.25)] border-pink-500/30',
                    ];
                    const themeClass = gradients[groupIdx % gradients.length];

                    return (
                        <div
                            key={group.name}
                            className={`bg-gradient-to-br ${themeClass} border rounded-2xl overflow-hidden flex flex-col sm:flex-row h-auto sm:h-80 transition-all duration-300 hover:border-opacity-50 shadow-xl`}
                            style={{ backdropFilter: 'blur(10px)' }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, group.name, -1)}
                        >
                            {/* Side A: Teams List */}
                            <div className="flex-1 flex flex-col min-h-[50%] border-b sm:border-b-0 sm:border-r border-white/5 order-1">
                                <div className="bg-white/10 px-4 py-3 border-b border-white/5 flex justify-between items-center">
                                    <span className="font-bold text-white">Grupo {group.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-white/40">{group.teams.length} Equipos</span>
                                        {/* Dropdown for Quick Add */}
                                        <select
                                            className="bg-black/50 border border-white/20 rounded text-[10px] text-white px-1 py-1 w-24 outline-none"
                                            value=""
                                            onChange={(e) => handleAssignTeam(e.target.value, group.name)}
                                        >
                                            <option value="">+ Añadir</option>
                                            {unassignedTeams.map(id => {
                                                const t = teams.find(team => team.id === id);
                                                return <option key={id} value={id}>{t?.name}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-2 space-y-1 bg-black/20 flex-1 h-auto min-h-[120px]">
                                    {group.teams.map((teamId, idx) => {
                                        const team = teams.find(t => t.id === teamId);
                                        return (
                                            <div
                                                key={teamId}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, teamId, group.name)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, group.name, idx)}
                                                className="flex items-center gap-2 p-2 rounded bg-white/5 hover:bg-white/10 cursor-grab active:cursor-grabbing group border border-transparent hover:border-blue-500/30 transition-all relative"
                                            >
                                                <div className="text-white/20 font-mono w-4 text-xs">{idx + 1}</div>
                                                <div className="flex-1 font-bold text-white text-sm truncate">{team?.name || 'Unknown'}</div>

                                                {/* Mobile Move Controls (Fallback for No DnD) */}
                                                <div className="flex sm:hidden gap-1">
                                                    {/* Move Up */}
                                                    <button
                                                        onClick={() => reorderTeamUp(teamId, group.name, idx)}
                                                        disabled={idx === 0}
                                                        className="p-1 text-white/20 hover:text-white disabled:opacity-0"
                                                    >
                                                        ▲
                                                    </button>
                                                    {/* Move Next Group */}
                                                    <button
                                                        onClick={() => moveTeamToNextGroup(teamId, group.name)}
                                                        title="Mover al siguiente grupo"
                                                        className="p-1 text-white/20 hover:text-blue-400"
                                                    >
                                                        →
                                                    </button>
                                                </div>

                                                <Move size={12} className="text-white/20 group-hover:text-white/50 hidden sm:block" />

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => handleRemoveTeam(teamId, group.name)}
                                                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/20 hover:text-red-400 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all ml-1"
                                                    title="Quitar del grupo"
                                                >
                                                    <span className="text-xs font-bold">×</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Side B: Fixture List */}
                            <div className="flex-1 flex flex-col bg-black/40 min-h-[50%] order-2">
                                <h5 className="px-4 py-3 text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1 border-b border-white/5 bg-white/5">
                                    <Calendar size={10} /> Partidos ({group.matches.length})
                                </h5>
                                <div className="p-2 space-y-2 flex-1 h-auto min-h-[120px]">
                                    {group.matches.length === 0 && (
                                        <div className="p-4 text-xs text-white/20 italic text-center">Esperando equipos...</div>
                                    )}
                                    {group.matches.map(match => (
                                        <div key={match.id} className="flex justify-between items-center bg-white/5 p-2 rounded text-xs border-l-2 border-l-blue-500/20">
                                            <span className="text-white/80 w-1/3 text-right truncate">
                                                {teams.find(t => t.id === match.visitorTeamId)?.name}
                                            </span>
                                            <div className="flex flex-col items-center w-8">
                                                <span className="text-white/20 font-mono text-[10px] bg-black/30 px-1 rounded">R{match.round}</span>
                                            </div>
                                            <span className="text-white/80 w-1/3 text-left truncate">
                                                {teams.find(t => t.id === match.localTeamId)?.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
