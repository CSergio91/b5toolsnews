
import { SupabaseClient } from '@supabase/supabase-js';

// Types for Source Definition (matching DB columns)
type SourceType = 'group.pos' | 'match.winner' | 'match.loser' | 'team';

export const updateBracketProgression = async (supabase: SupabaseClient, tournamentId: string) => {
    console.log("Starting Bracket Progression Update...");

    // 1. Fetch ALL Matches for context (needed for lookups)
    const { data: allMatches, error: matchError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId);

    if (matchError || !allMatches) {
        console.error("Error fetching matches", matchError);
        return { success: false, error: matchError };
    }

    // 2. Fetch Teams (for Group logic)
    const { data: allTeams, error: teamError } = await supabase
        .from('tournament_teams')
        .select('*')
        .eq('tournament_id', tournamentId);

    if (teamError) return { success: false, error: teamError };

    // 3. Fetch Sets (needed for calculating standings if source is group.pos)
    // Optimization: Only fetch sets for finished matches if needed, but fetching all is safer for general logic
    const { data: allSets } = await supabase
        .from('tournament_sets')
        .select('*')
        .in('match_id', allMatches.map(m => m.id))
        .eq('status', 'finished');

    let updatesCount = 0;

    // Helper: Calculate Group Standings
    // We only calculate this on demand for specific groups to save massive computation if not needed
    const getGroupStandings = (groupId: string) => {
        // Filter teams in this group - Wait, team.group_id might be needed. 
        // The DB might rely on `group_name` or `stage_id`. 
        // Checking `tournament_teams` columns... usually `group_name` or `group_id`.
        // We will assume `group_name` corresponds to the ID passed (e.g. "A").
        // Actually, `source_home_id` for `group.pos` might be the Group UUID or Name.
        // If it's a UUID, we need to correct. The `structure` uses Group Names usually "A", "B"?
        // Let's assume ID for now, and try to match against `group_id` or `group_name`.

        // Find teams belonging to this group
        // If `source_home_id` is a UUID (Group Phase ID?), we match teams. 
        // If it's "A", we match `group_name`.

        const groupTeams = allTeams?.filter(t => t.group_name === groupId || t.group_id === groupId) || [];

        if (groupTeams.length === 0) return [];

        // Build simple stats
        const stats = groupTeams.map(team => {
            const teamMatches = allMatches.filter(m =>
                m.status === 'finished' &&
                (m.visitor_team_id === team.id || m.local_team_id === team.id)
            );

            let wins = 0;
            let losses = 0;
            let pts = 0;
            let runDiff = 0;

            teamMatches.forEach(m => {
                const isVisitor = m.visitor_team_id === team.id;
                const winnerId = m.winner_team_id;

                // Pts calc (Simple default)
                if (winnerId === team.id) {
                    wins++;
                    pts += 3; // Default 3 for now, or check config? Safe default logic: Win > Loss
                } else if (winnerId) {
                    losses++;
                    pts += 1; // Default 1 for loss?
                }

                // Run Diff (using sets)
                const mSets = allSets?.filter(s => s.match_id === m.id) || [];
                mSets.forEach(s => {
                    const rScored = isVisitor ? (s.away_score ?? 0) : (s.home_score ?? 0);
                    const rAllowed = isVisitor ? (s.home_score ?? 0) : (s.away_score ?? 0);
                    runDiff += (rScored - rAllowed);
                });
            });

            return { team, wins, losses, pts, runDiff };
        });

        // Sort: Pts Desc, then Run Diff Desc
        return stats.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            return b.runDiff - a.runDiff;
        });
    };

    // 4. Iterate Matches that need resolution
    const pendingMatches = allMatches.filter(m =>
        m.status !== 'finished' &&
        (!m.visitor_team_id || !m.local_team_id)
    );

    for (const match of pendingMatches) {
        let updateData: any = {};

        // Resolve LOCAL SLOT
        if (!match.local_team_id && match.source_home_type && match.source_home_id) {
            const type = match.source_home_type as SourceType;
            const id = match.source_home_id;
            const idx = match.source_home_index || 0; // 0-based or 1-based? Usually 1-based in UI ("1st"), so index might be 1. logic: if index=1, array[0].

            if (type === 'match.winner') {
                const sourceMatch = allMatches.find(m => m.id === id || m.global_id?.toString() === id); // Handle ID or Global ID
                if (sourceMatch && sourceMatch.status === 'finished' && sourceMatch.winner_team_id) {
                    updateData.local_team_id = sourceMatch.winner_team_id;
                }
            } else if (type === 'match.loser') {
                const sourceMatch = allMatches.find(m => m.id === id || m.global_id?.toString() === id);
                if (sourceMatch && sourceMatch.status === 'finished' && sourceMatch.winner_team_id) {
                    // Loser is the one NOT winner
                    const loserId = sourceMatch.visitor_team_id === sourceMatch.winner_team_id ? sourceMatch.local_team_id : sourceMatch.visitor_team_id;
                    if (loserId) updateData.local_team_id = loserId;
                }
            } else if (type === 'group.pos') {
                const standings = getGroupStandings(id);
                // idx is likely 1-based (1st place)
                const targetIndex = idx - 1;
                if (standings.length > targetIndex && targetIndex >= 0) {
                    updateData.local_team_id = standings[targetIndex].team.id;
                }
            }
        }

        // Resolve VISITOR SLOT
        if (!match.visitor_team_id && match.source_away_type && match.source_away_id) {
            const type = match.source_away_type as SourceType;
            const id = match.source_away_id;
            const idx = match.source_away_index || 0;

            if (type === 'match.winner') {
                const sourceMatch = allMatches.find(m => m.id === id || m.global_id?.toString() === id);
                if (sourceMatch && sourceMatch.status === 'finished' && sourceMatch.winner_team_id) {
                    updateData.visitor_team_id = sourceMatch.winner_team_id;
                }
            } else if (type === 'match.loser') {
                const sourceMatch = allMatches.find(m => m.id === id || m.global_id?.toString() === id);
                if (sourceMatch && sourceMatch.status === 'finished' && sourceMatch.winner_team_id) {
                    const loserId = sourceMatch.visitor_team_id === sourceMatch.winner_team_id ? sourceMatch.local_team_id : sourceMatch.visitor_team_id;
                    if (loserId) updateData.visitor_team_id = loserId;
                }
            } else if (type === 'group.pos') {
                const standings = getGroupStandings(id);
                const targetIndex = idx - 1;
                if (standings.length > targetIndex && targetIndex >= 0) {
                    updateData.visitor_team_id = standings[targetIndex].team.id;
                }
            }
        }

        // Perform Update if needed
        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
                .from('tournament_matches')
                .update(updateData)
                .eq('id', match.id);

            if (!updateError) {
                updatesCount++;
                console.log(`Updated Match ${match.id} / Global ${match.global_id}:`, updateData);
            } else {
                console.error(`Failed to update Match ${match.id}`, updateError);
            }
        }
    }

    return { success: true, updates: updatesCount };
};
