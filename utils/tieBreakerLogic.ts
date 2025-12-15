
import { TieBreakerRule, TieBreakerType } from '../types/tournament';

interface TeamStats {
    id: string;
    played: number;
    won: number;
    lost: number;
    points: number;
    runs_scored: number;
    runs_allowed: number;
    // For direct match checking, we might need match history or a helper to check result between A and B
    matches_vs?: Record<string, 'win' | 'loss' | 'draw' | undefined>;
}

/**
 * Sorts teams based on points and then applies tie-breaker rules.
 * @param teams List of teams with stats
 * @param rules Ordered list of active tie-breaker rules
 * @returns Sorted list of teams
 */
export const sortTeamsWithTieBreaker = (
    teams: TeamStats[],
    rules: TieBreakerRule[] = []
): TeamStats[] => {
    // Basic Point Sort first
    const sorted = [...teams].sort((a, b) => b.points - a.points);

    // If no rules, stable sort (or id sort) implicit from points
    if (!rules || rules.length === 0) return sorted;

    const activeRules = rules.filter(r => r.active).sort((a, b) => a.order - b.order);

    // Custom Sort Function
    return sorted.sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;

        // Points are tied, apply rules in order
        for (const rule of activeRules) {
            const result = compareTeams(a, b, rule.type);
            if (result !== 0) return result;
        }

        return 0; // Still tied
    });
};

const compareTeams = (a: TeamStats, b: TeamStats, type: TieBreakerType): number => {
    switch (type) {
        case 'direct_match':
            // 1. Direct Result
            // Logic: Did A beat B?
            if (a.matches_vs && a.matches_vs[b.id] === 'win') return -1; // A wins -> A comes first
            if (a.matches_vs && a.matches_vs[b.id] === 'loss') return 1;  // B wins -> B comes first

            // If they didn't play or drew (or split series if we had more complex logic), we fall through to 0
            // But per request: "if tie persists between 2... apply Random Draw"
            // We check this condition: "If result is 0 (still tied), fallback to Random" 
            // NOTE: The request implies this recursion happens here.
            // Let's implement a random tie-break for THIS specific pairwise comparison if direct match fails.

            // Stable "Random" using ID comparison to avoid UI flickering/reordering between Preview and Apply
            return a.id.localeCompare(b.id);

        case 'run_diff':
            // 2. Diff Runs (Scored - Allowed)
            const diffA = a.runs_scored - a.runs_allowed;
            const diffB = b.runs_scored - b.runs_allowed;
            if (diffA !== diffB) return diffB - diffA; // Higher diff first
            return 0;

        case 'runs_scored':
            // 3. Runs Scored
            if (a.runs_scored !== b.runs_scored) return b.runs_scored - a.runs_scored; // Higher scored first
            return 0;

        case 'random':
            // 4. Random (Deterministic for sort stability usually requires seed, but JS sort is flaky with random)
            // Use ID as stable random seed
            return a.id.localeCompare(b.id);

        default:
            return 0;
    }
};
