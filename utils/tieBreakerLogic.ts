import { TournamentMatch, TournamentSet, TournamentTeam } from '../types/tournament';

export interface TiebreakerStats {
    teamId: string;
    wins: number;
    runDiff: number;
    runsScored: number;
    randomValue?: number;
}

/**
 * Filter matches and sets where both teams are within the tied group
 */
export const getMatchesBetween = (teamIds: string[], matches: TournamentMatch[]) => {
    return matches.filter(m =>
        m.status === 'finished' &&
        teamIds.includes(m.visitor_team_id || '') &&
        teamIds.includes(m.local_team_id || '')
    );
};

/**
 * Calculate Tiebreaker Stats for a specific subset of teams
 * Only counts matches played BETWEEN these teams.
 */
export const calculateTiebreakerStats = (
    teams: TournamentTeam[],
    matches: TournamentMatch[],
    sets: TournamentSet[]
): TiebreakerStats[] => {
    const teamIds = teams.map(t => t.id);
    const relevantMatches = getMatchesBetween(teamIds, matches);

    return teams.map(team => {
        const stats: TiebreakerStats = {
            teamId: team.id,
            wins: 0,
            runDiff: 0,
            runsScored: 0
        };

        relevantMatches.forEach(match => {
            const matchSets = sets.filter(s => s.match_id === match.id && s.status === 'finished');
            if (matchSets.length === 0) return;

            let localSetWins = 0;
            let visitorSetWins = 0;
            let localRuns = 0;
            let visitorRuns = 0;

            matchSets.forEach(set => {
                const lr = set.home_score ?? set.local_runs ?? 0;
                const vr = set.away_score ?? set.visitor_runs ?? 0;
                localRuns += lr;
                visitorRuns += vr;

                if (lr > vr) localSetWins++;
                else if (vr > lr) visitorSetWins++;
            });

            const isLocal = match.local_team_id === team.id;
            const isVisitor = match.visitor_team_id === team.id;

            if (isLocal) {
                stats.runsScored += localRuns;
                stats.runDiff += (localRuns - visitorRuns);
                if (localSetWins > visitorSetWins) stats.wins++;
            } else if (isVisitor) {
                stats.runsScored += visitorRuns;
                stats.runDiff += (visitorRuns - localRuns);
                if (visitorSetWins > localSetWins) stats.wins++;
            }
        });

        return stats;
    });
};

/**
 * Sorts teams based on a specific rule
 */
export const sortTeamsByRule = (
    teams: TournamentTeam[],
    stats: TiebreakerStats[],
    ruleType: 'direct_match' | 'run_diff' | 'runs_scored' | 'random'
): TournamentTeam[] => {
    return [...teams].sort((a, b) => {
        const statA = stats.find(s => s.teamId === a.id)!;
        const statB = stats.find(s => s.teamId === b.id)!;

        switch (ruleType) {
            case 'direct_match':
                return statB.wins - statA.wins;
            case 'run_diff':
                return statB.runDiff - statA.runDiff;
            case 'runs_scored':
                return statB.runsScored - statA.runsScored;
            case 'random':
                return (statB.randomValue || 0) - (statA.randomValue || 0);
            default:
                return 0;
        }
    });
};

/**
 * Checks if a tie still persists in a sorted group for a specific stat
 */
export const checkTiesInSorted = (
    sortedTeams: TournamentTeam[],
    stats: TiebreakerStats[],
    ruleType: 'direct_match' | 'run_diff' | 'runs_scored'
): boolean => {
    for (let i = 0; i < sortedTeams.length - 1; i++) {
        const statA = stats.find(s => s.teamId === sortedTeams[i].id)!;
        const statB = stats.find(s => s.teamId === sortedTeams[i + 1].id)!;

        let valA = 0;
        let valB = 0;

        if (ruleType === 'direct_match') { valA = statA.wins; valB = statB.wins; }
        else if (ruleType === 'run_diff') { valA = statA.runDiff; valB = statB.runDiff; }
        else if (ruleType === 'runs_scored') { valA = statA.runsScored; valB = statB.runsScored; }

        if (valA === valB) return true;
    }
    return false;
};
