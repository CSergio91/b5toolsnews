import React, { useMemo, useState, useEffect } from 'react';
import { TournamentPhase } from '../../types/structure';
import { TieBreakerRule } from '../../types/tournament';
import { useBuilder } from '../../context/BuilderContext';
import { sortTeamsWithTieBreaker } from '../../utils/tieBreakerLogic';
import { calculateTeamStats } from '../../utils/tournamentStats';
import { AlignLeft, HelpCircle } from 'lucide-react';

interface ClassificationTableProps {
    phases: TournamentPhase[];
    simulationResults?: Record<string, string>;
    isSimulation?: boolean;
}

interface TeamStats {
    id: string;
    name: string;
    group: string;
    played: number;
    won: number;
    lost: number;
    points: number;
    runs_scored: number;
    runs_allowed: number;
}

export const ClassificationTable: React.FC<ClassificationTableProps> = ({ phases, simulationResults, isSimulation }) => {
    const { teams, state } = useBuilder();
    const config = state.config;

    // State for temporary simulation overrides
    // We only need this locally for visual feedback in simulation
    // When sim ends, this component unmounts or props change, resetting state? 
    // Actually we need to explicitly clear it if isSimulation becomes false
    const [activeRuleOverride, setActiveRuleOverride] = useState<TieBreakerRule | null>(null);

    useEffect(() => {
        if (!isSimulation) setActiveRuleOverride(null);
    }, [isSimulation]);

    const stats = useMemo(() => {
        // Use shared logic
        const rawStats = calculateTeamStats(phases, teams, simulationResults, state.config);

        // Sort Logic with Tie Breaker Override
        if (isSimulation && activeRuleOverride) {
            return sortTeamsWithTieBreaker(rawStats, [activeRuleOverride]);
        }

        // Standard Sort
        return rawStats.sort((a, b) => {
            if (a.group !== b.group) return a.group.localeCompare(b.group);
            return b.points - a.points;
        });

    }, [phases, teams, simulationResults, state.config, activeRuleOverride, isSimulation]);

    // Tie Detection Logic for UI
    const getTiedGroups = () => {
        const groups: Record<string, TeamStats[]> = {};
        stats.forEach(t => {
            if (!groups[t.group]) groups[t.group] = [];
            groups[t.group].push(t);
        });

        const tiedInfo: { group: string, points: number, teams: TeamStats[] }[] = [];

        Object.entries(groups).forEach(([grpName, groupTeams]) => {
            // Group teams by points
            const pointMap: Record<number, TeamStats[]> = {};
            groupTeams.forEach(t => {
                if (!pointMap[t.points]) pointMap[t.points] = [];
                pointMap[t.points].push(t);
            });

            // If any point value has > 1 team, it's a tie
            Object.entries(pointMap).forEach(([pts, tiedTeams]) => {
                if (tiedTeams.length > 1) {
                    tiedInfo.push({ group: grpName, points: parseInt(pts), teams: tiedTeams });
                }
            });
        });

        return tiedInfo;
    };

    const ties = isSimulation ? getTiedGroups() : [];
    const hasTies = ties.length > 0;

    if (stats.length === 0) return null;

    return (
        <div className="flex gap-4 items-start w-full">
            {/* Main Table */}
            <div className={`bg-[#1a1a20] rounded-lg border border-white/10 overflow-hidden flex-1 transition-all`}>
                <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Tabla de Clasificación General</h3>
                    <span className="text-[10px] text-white/30 uppercase">Fase de Grupos</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase text-white/40 bg-white/5 font-bold">
                            <tr>
                                <th className="px-4 py-2 w-10 text-center">#</th>
                                <th className="px-4 py-2 w-10 text-center">Grp</th>
                                <th className="px-4 py-2">Equipo</th>
                                <th className="px-2 py-2 w-12 text-center" title="Juegos Jugados">JJ</th>
                                <th className="px-2 py-2 w-12 text-center" title="Juegos Ganados">JG</th>
                                <th className="px-2 py-2 w-12 text-center" title="Juegos Perdidos">JP</th>
                                <th className="px-4 py-2 w-16 text-center text-white" title="Puntos">PTS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {stats.map((stat, idx) => (
                                <tr key={stat.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 text-center font-bold text-white/50">{idx + 1}</td>
                                    <td className="px-4 py-2 text-center font-bold text-white/30">{stat.group}</td>
                                    <td className="px-4 py-2 font-medium text-white/80">{stat.name}</td>
                                    <td className="px-2 py-2 text-center text-white/50">{stat.played}</td>
                                    <td className="px-2 py-2 text-center text-green-400/70">{stat.won}</td>
                                    <td className="px-2 py-2 text-center text-red-400/70">{stat.lost}</td>
                                    <td className="px-4 py-2 text-center font-bold text-white bg-white/5">{stat.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tie Breaker Zone */}
            {isSimulation && hasTies && (
                <div className="w-[500px] bg-[#1a1a20] rounded-lg border border-yellow-500/30 overflow-hidden animate-in fade-in slide-in-from-right-4 shadow-xl">
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 border-b border-yellow-500/20">
                        <div className="flex items-center gap-2 text-yellow-500">
                            <HelpCircle size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">Desempate Requerido</span>
                        </div>
                        {activeRuleOverride && (
                            <button
                                onClick={() => setActiveRuleOverride(null)}
                                className="text-[10px] text-white/50 hover:text-white underline"
                            >
                                Resetear Regla
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-white/10">
                        {/* Column 1: Tied Teams */}
                        <div className="p-4 space-y-3">
                            {ties.map((tie, idx) => (
                                <div key={idx} className="bg-white/5 rounded p-2 border border-white/5">
                                    <div className="text-[10px] uppercase font-bold text-white/40 mb-1">
                                        Empate en {tie.points} pts (Grp {tie.group})
                                    </div>
                                    <div className="space-y-1">
                                        {tie.teams.map(t => (
                                            <div key={t.id} className="text-xs text-white pl-2 border-l-2 border-yellow-500/50">
                                                {t.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Column 2: Rules */}
                        <div className="p-4 flex flex-col gap-2 justify-center">
                            <div className="text-[10px] uppercase font-bold text-white/40 mb-2 text-center">Aplicar Regla</div>
                            {(config.tiebreaker_rules || []).map((rule: any) => (
                                <button
                                    key={rule.type}
                                    onClick={() => setActiveRuleOverride({ ...rule, active: true })}
                                    className={`w-full p-2 text-xs text-left rounded border transition-all flex items-center justify-between group ${activeRuleOverride?.type === rule.type
                                            ? 'bg-yellow-500 text-black border-yellow-500 font-bold'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:border-yellow-500/50 hover:text-white'
                                        }`}
                                >
                                    <span>{rule.label || rule.type}</span>
                                    {activeRuleOverride?.type === rule.type && <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                                </button>
                            ))}
                            {(!config.tiebreaker_rules || config.tiebreaker_rules.length === 0) && (
                                <div className="text-xs text-white/30 text-center italic">No hay reglas configuradas</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
