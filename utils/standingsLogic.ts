import { TournamentMatch, TournamentSet, TournamentTeam, Tournament } from '../types/tournament';

/**
 * Calculates standings based on matches and sets.
 * Sorting order: Points (DESC) -> Tiebreaker Rank (ASC) -> Run Difference (DESC) -> Runs Scored (DESC)
 */
export const calculateStandings = (
    teams: TournamentTeam[],
    matches: TournamentMatch[],
    sets: TournamentSet[],
    stageId: string | null = null,
    tournamentConfig: Tournament | null = null
) => {
    // Initial accumulation using a map for efficiency
    const map = new Map<string, TournamentTeam & {
        wins: number;
        losses: number;
        pts: number;
        runs_scored: number;
        runs_allowed: number;
        gp: number
    }>();

    teams.forEach(t => {
        map.set(t.id, {
            ...t,
            wins: 0,
            losses: 0,
            pts: 0,
            runs_scored: 0,
            runs_allowed: 0,
            gp: 0,
            seed: t.seed || 0
        });
    });

    matches.forEach(match => {
        // Filter by stage if provided
        if (stageId && match.stage_id !== stageId) return;

        // Only consider finished sets for stats
        const matchSets = sets.filter(s => s.match_id === (match.id || (match as any).match_id) && s.status === 'finished');
        if (matchSets.length === 0) return;

        const local = map.get(match.local_team_id || '');
        const visitor = map.get(match.visitor_team_id || '');

        // Accumulate runs regardless of match status (sets define the score)
        matchSets.forEach(set => {
            const lr = set.home_score ?? set.local_runs ?? 0;
            const vr = set.away_score ?? set.visitor_runs ?? 0;

            if (local) {
                local.runs_scored += lr;
                local.runs_allowed += vr;
            }
            if (visitor) {
                visitor.runs_scored += vr;
                visitor.runs_allowed += lr;
            }
        });

        // Award points and match wins/losses if match is finished
        if (match.status === 'finished') {
            let localSetWins = 0;
            let visitorSetWins = 0;
            matchSets.forEach(set => {
                const lr = set.home_score ?? set.local_runs ?? 0;
                const vr = set.away_score ?? set.visitor_runs ?? 0;
                if (lr > vr) localSetWins++;
                else if (vr > lr) visitorSetWins++;
            });

            if (local && visitor) {
                local.gp++;
                visitor.gp++;
                if (localSetWins > visitorSetWins) {
                    local.wins++;
                    visitor.losses++;
                    local.pts += (tournamentConfig?.points_for_win ?? 1);
                    visitor.pts += (tournamentConfig?.points_for_loss ?? 0);
                } else if (visitorSetWins > localSetWins) {
                    visitor.wins++;
                    local.losses++;
                    visitor.pts += (tournamentConfig?.points_for_win ?? 1);
                    local.pts += (tournamentConfig?.points_for_loss ?? 0);
                }
            }
        }
    });

    const result = Array.from(map.values());

    // Final sorting
    return result.sort((a, b) => {
        // 1. Primary: Points (Descending)
        if ((b.pts || 0) !== (a.pts || 0)) return (b.pts || 0) - (a.pts || 0);

        // 2. Secondary: Seed (Ascending, e.g., 1 is better than 2)
        // This is manually resolved by the user via the TiebreakerModal and stored in the 'seed' column.
        if ((a.seed || 0) > 0 && (b.seed || 0) > 0) {
            if (a.seed !== b.seed) return (a.seed || 0) - (b.seed || 0);
        }

        // 3. Tertiary: Run Difference (Descending)
        const diffA = (a.runs_scored || 0) - (a.runs_allowed || 0);
        const diffB = (b.runs_scored || 0) - (b.runs_allowed || 0);
        if (diffB !== diffA) return diffB - diffA;

        // 4. Quaternary: Runs Scored (Descending)
        return (b.runs_scored || 0) - (a.runs_scored || 0);
    });
};
