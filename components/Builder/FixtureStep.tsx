import React, { useState, useEffect } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { generateSingleEliminationBracket, generateGroupStage, generateMatchesForOneGroup, GroupStructure } from '../../utils/bracketGenerator';
import { BracketStep } from './BracketStep';
import { LayoutGrid, List, Calendar, Move } from 'lucide-react';

export const FixtureStep: React.FC = () => {
    const { state, teams } = useBuilder();
    const [viewMode, setViewMode] = useState<'groups' | 'bracket'>('groups');
    const [generatedGroups, setGeneratedGroups] = useState<GroupStructure[]>([]);

    const isGroupFormat = (state.config as any).tournament_type === 'group_stage';

    // Initial Generation (Only if empty, to preserve manual edits)
    useEffect(() => {
        if (isGroupFormat && generatedGroups.length === 0 && teams.length > 0) {
            const groupsCount = (state.config as any).number_of_groups || 4;
            const groups = generateGroupStage(teams as any[], groupsCount);
            setGeneratedGroups(groups);
            setViewMode('groups');
        } else if (!isGroupFormat) {
            setViewMode('bracket');
        }
    }, [isGroupFormat, teams, state.config.number_of_groups]); // Intentionally omitting generatedGroups from deps to avoid loop

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

    const handleDrop = (e: React.DragEvent, targetGroupName: string, targetIndex: number = -1) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to group container if dropped on item
        const teamId = e.dataTransfer.getData('teamId');
        const sourceGroupName = e.dataTransfer.getData('sourceGroupName');

        setGeneratedGroups(prev => {
            // 1. Deep Clone
            const newGroups = prev.map(g => ({
                ...g,
                teams: [...g.teams],
                matches: [...g.matches]
            }));

            const sourceGroup = newGroups.find(g => g.name === sourceGroupName);
            const targetGroup = newGroups.find(g => g.name === targetGroupName);

            if (!sourceGroup || !targetGroup) return prev;

            // 2. Sanity Check
            const currentSourceIndex = sourceGroup.teams.indexOf(teamId);
            if (currentSourceIndex === -1) return prev;

            // CASE A: Reordering within same group
            if (sourceGroupName === targetGroupName) {
                // Remove from old position
                sourceGroup.teams.splice(currentSourceIndex, 1);

                // Calculate real target index (if moving down, index shifts by 1)
                // If targetIndex is -1 (dropped on empty space), push to end
                if (targetIndex === -1) {
                    sourceGroup.teams.push(teamId);
                } else {
                    sourceGroup.teams.splice(targetIndex, 0, teamId);
                }

                // Regenerate matches (Order matters for Berger system pairing)
                sourceGroup.matches = generateMatchesForOneGroup(sourceGroup.teams, sourceGroup.name);
                return newGroups;
            }

            // CASE B: Moving to different group
            else {
                // Prevent Duplicates
                if (targetGroup.teams.includes(teamId)) return prev;

                // Remove from source
                sourceGroup.teams.splice(currentSourceIndex, 1);

                // Add to target at specific index or end
                if (targetIndex === -1) {
                    targetGroup.teams.push(teamId);
                } else {
                    targetGroup.teams.splice(targetIndex, 0, teamId);
                }

                // Regenerate both
                sourceGroup.matches = generateMatchesForOneGroup(sourceGroup.teams, sourceGroup.name);
                targetGroup.matches = generateMatchesForOneGroup(targetGroup.teams, targetGroup.name);

                return newGroups;
            }
        });
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
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <LayoutGrid className="text-blue-500" /> Fase de Grupos
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('bracket')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        Ver Llave de Playoff →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto pb-20 custom-scrollbar mt-6">
                {generatedGroups.map((group, groupIdx) => {
                    // Cyclic gradients for groups
                    // Cyclic gradients for groups - IMPROVED VISIBILITY
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
                            className={`bg-gradient-to-br ${themeClass} border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:border-opacity-50`}
                            style={{ backdropFilter: 'blur(10px)' }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, group.name, -1)}
                        >
                            {/* Group Header */}
                            <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex justify-between items-center">
                                <span className="font-bold text-white">Grupo {group.name}</span>
                                <span className="text-xs text-white/40">{group.teams.length} Equipos</span>
                            </div>

                            {/* Teams Lists (Draggable) */}
                            <div className="p-2 space-y-1 bg-black/10 min-h-[50px]">
                                {group.teams.map((teamId, idx) => {
                                    const team = teams.find(t => t.id === teamId);
                                    return (
                                        <div
                                            key={teamId}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, teamId, group.name)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, group.name, idx)} // Pass specific index for insertion/reorder
                                            className="flex items-center gap-3 p-2 rounded bg-white/5 hover:bg-white/10 cursor-grab active:cursor-grabbing group border border-transparent hover:border-blue-500/30 transition-all"
                                        >
                                            <div className="text-white/20 font-mono w-4 text-xs">{idx + 1}</div>
                                            <div className="flex-1 font-bold text-white text-sm truncate">{team?.name || 'Unknown'}</div>
                                            <Move size={12} className="text-white/20 group-hover:text-white/50" />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Fixture List Mini */}
                            <div className="bg-black/20 p-4 border-t border-white/5 flex-1">
                                <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-1">
                                    <Calendar size={10} /> Partidos Generados ({group.matches.length})
                                </h5>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {group.matches.length === 0 && (
                                        <div className="text-xs text-white/20 italic">Esperando equipos...</div>
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
