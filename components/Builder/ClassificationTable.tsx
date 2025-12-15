import React, { useMemo } from 'react';
import { TournamentPhase } from '../../types/structure';
import { useBuilder } from '../../context/BuilderContext';

interface ClassificationTableProps {
    phases: TournamentPhase[];
    simulationResults?: Record<string, string>;
}

interface TeamStats {
    id: string;
    name: string;
    group: string;
    played: number;
    won: number;
    lost: number;
    points: number;
}

export const ClassificationTable: React.FC<ClassificationTableProps> = ({ phases, simulationResults }) => {
    const { teams, state } = useBuilder();

    const stats = useMemo(() => {
        const teamStats: Record<string, TeamStats> = {};
        const pointsForWin = state.config.points_for_win || 3;
        const pointsForLoss = state.config.points_for_loss || 0;

        // 1. Initialize with all teams found in groups
        phases.forEach(phase => {
            if (phase.type === 'group' && phase.groups) {
                phase.groups.forEach(group => {
                    group.teams.forEach(teamId => {
                        if (!teamStats[teamId]) {
                            const team = teams.find(t => t.id === teamId);
                            teamStats[teamId] = {
                                id: teamId,
                                name: team ? team.name : 'Desconocido',
                                group: group.name,
                                played: 0,
                                won: 0,
                                lost: 0,
                                points: 0
                            };
                        }
                    });

                    // 2. Calculate Stats from Matches if Simulation Results exist
                    if (simulationResults) {
                        group.matches.forEach(match => {
                            const winnerId = simulationResults[match.id];
                            if (winnerId) {
                                // Resolve Home/Away IDs
                                // Note: Simplified resolution. In real app, source might be complicated.
                                // For groups, source is usually type: 'team'.
                                const homeId = match.sourceHome?.type === 'team' ? match.sourceHome.id : null;
                                const awayId = match.sourceAway?.type === 'team' ? match.sourceAway.id : null;

                                if (homeId && awayId) {
                                    // Make sure teams exist in stats (safety)
                                    if (teamStats[homeId] && teamStats[awayId]) {
                                        teamStats[homeId].played++;
                                        teamStats[awayId].played++;

                                        if (winnerId === homeId) {
                                            teamStats[homeId].won++;
                                            teamStats[homeId].points += pointsForWin;
                                            teamStats[awayId].lost++;
                                            teamStats[awayId].points += pointsForLoss;
                                        } else {
                                            teamStats[awayId].won++;
                                            teamStats[awayId].points += pointsForWin;
                                            teamStats[homeId].lost++;
                                            teamStats[homeId].points += pointsForLoss;
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
            }
        });

        return Object.values(teamStats).sort((a, b) => {
            // Sort by Group then Points
            if (a.group !== b.group) return a.group.localeCompare(b.group);
            return b.points - a.points;
        });

    }, [phases, teams, simulationResults, state.config.points_for_win, state.config.points_for_loss]);

    if (stats.length === 0) return null;

    return (
        <div className="mb-4 bg-[#1a1a20] rounded-lg border border-white/10 overflow-hidden">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Tabla de Clasificación General</h3>
                <span className="text-[10px] text-white/30 uppercase">Fase de Grupos</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="text-[10px] uppercase text-white/40 bg-white/5 font-bold">
                        <tr>
                            <th className="px-4 py-2 w-10 text-center">Grp</th>
                            <th className="px-4 py-2">Equipo</th>
                            <th className="px-2 py-2 w-12 text-center" title="Juegos Jugados">JJ</th>
                            <th className="px-2 py-2 w-12 text-center" title="Juegos Ganados">JG</th>
                            <th className="px-2 py-2 w-12 text-center" title="Juegos Perdidos">JP</th>
                            <th className="px-4 py-2 w-16 text-center text-white" title="Puntos">PTS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {stats.map((stat) => (
                            <tr key={stat.id} className="hover:bg-white/5 transition-colors">
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
    );
};
