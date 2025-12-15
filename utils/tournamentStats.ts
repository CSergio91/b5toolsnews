
import { TournamentPhase } from '../types/structure';
import { TournamentTeam, TieBreakerRule } from '../types/tournament';

export interface TeamStats {
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

export const calculateTeamStats = (
    phases: TournamentPhase[],
    teams: TournamentTeam[],
    simulationResults: Record<string, string> | undefined,
    config: { points_for_win?: number, points_for_loss?: number }
): TeamStats[] => {
    const teamStats: Record<string, TeamStats> = {};
    const pointsForWin = config.points_for_win || 3;
    const pointsForLoss = config.points_for_loss || 0;

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
                            points: 0,
                            runs_scored: 0,
                            runs_allowed: 0
                        };
                    }
                });

                // 2. Calculate Stats from Matches if Simulation Results exist
                if (simulationResults) {
                    group.matches.forEach(match => {
                        const winnerId = simulationResults[match.id];
                        if (winnerId) {
                            const homeId = match.sourceHome?.type === 'team' ? match.sourceHome.id : null;
                            const awayId = match.sourceAway?.type === 'team' ? match.sourceAway.id : null;

                            if (homeId && awayId) {
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

    return Object.values(teamStats);
};

export const getSortedStandings = (stats: TeamStats[]): TeamStats[] => {
    // Default Sort: Group -> Points
    return [...stats].sort((a, b) => {
        if (a.group !== b.group) return a.group.localeCompare(b.group);
        return b.points - a.points;
    });
};
