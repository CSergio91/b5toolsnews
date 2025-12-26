
import { SupabaseClient } from '@supabase/supabase-js';

// Types for Source Definition (matching DB columns)
type SourceType = 'group.pos' | 'match.winner' | 'match.loser' | 'team';

export const updateBracketProgression = async (supabase: SupabaseClient, tournamentId: string) => {
    console.log("Starting Bracket Progression Update...");

    // 1. Fetch Tournament (including structure)
    const { data: tournament, error: tError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();
    if (tError || !tournament) return { success: false, error: tError };

    // 2. Fetch Phases
    const { data: phases, error: phaseError } = await supabase
        .from('tournament_phases')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('phase_order', { ascending: true });
    if (phaseError || !phases) return { success: false, error: phaseError };

    // 3. Fetch ALL Matches and Teams
    const { data: allMatches } = await supabase.from('tournament_matches').select('*').eq('tournament_id', tournamentId);
    const { data: allTeams } = await supabase.from('tournament_teams').select('*').eq('tournament_id', tournamentId);
    if (!allMatches || !allTeams) return { success: false, error: 'Matches or Teams not found' };

    const { data: allSets } = await supabase
        .from('tournament_sets')
        .select('*')
        .in('match_id', allMatches.map(m => m.id))
        .eq('status', 'finished');

    let updatesCount = 0;

    // Helper: Calculate Group Standings
    const getGroupStandings = (groupIdOrName: string) => {
        // Try matching by ID or Name (JSON reflects Names usually "Grupo A")
        const groupTeams = allTeams?.filter(t => t.group_name === groupIdOrName || t.group_id === groupIdOrName) || [];
        if (groupTeams.length === 0) return [];

        const stats = groupTeams.map(team => {
            const teamMatches = allMatches.filter(m =>
                m.status === 'finished' &&
                (m.visitor_team_id === team.id || m.local_team_id === team.id)
            );

            let wins = 0;
            let pts = 0;
            let runDiff = 0;

            teamMatches.forEach(m => {
                const isVisitor = m.visitor_team_id === team.id;
                if (m.winner_team_id === team.id) {
                    wins++;
                    pts += (tournament?.points_for_win || 3);
                } else if (m.winner_team_id && m.winner_team_id !== team.id) {
                    pts += (tournament?.points_for_loss || 0);
                }

                const mSets = allSets?.filter(s => s.match_id === m.id) || [];
                mSets.forEach(s => {
                    const rScored = isVisitor ? (s.away_score ?? 0) : (s.home_score ?? 0);
                    const rAllowed = isVisitor ? (s.home_score ?? 0) : (s.away_score ?? 0);
                    runDiff += (rScored - rAllowed);
                });
            });

            return { team, wins, pts, runDiff };
        });

        return stats.sort((a, b) => {
            // 1. Points (Descending)
            if (b.pts !== a.pts) return b.pts - a.pts;

            // 2. Tiebreaker Rank (Ascending, 1 is better than 2)
            // Manual resolution always wins if points are tied
            if ((a.team.tiebreaker_rank || 0) > 0 && (b.team.tiebreaker_rank || 0) > 0) {
                return a.team.tiebreaker_rank - b.team.tiebreaker_rank;
            }

            // 3. Run Difference (Descending)
            return b.runDiff - a.runDiff;
        });
    };

    // 4. Seeding Logic (Cruces)
    // We look for matches that are linked to source_home/away types
    const pendingMatches = allMatches.filter(m => !m.visitor_team_id || !m.local_team_id);

    for (const match of pendingMatches) {
        let updateData: any = {};

        // Resolve LOCAL
        if (!match.local_team_id && match.source_home_type) {
            const type = match.source_home_type;
            const sourceId = match.source_home_id;
            const index = match.source_home_index || 1; // 1st, 2nd...

            if (type === 'group.pos' && sourceId) {
                const standings = getGroupStandings(sourceId);
                const target = standings[index - 1];
                if (target) updateData.local_team_id = target.team.id;
            } else if ((type === 'match.winner' || type === 'match.loser') && sourceId) {
                const sm = allMatches.find(m => m.id === sourceId || m.global_id?.toString() === sourceId);
                if (sm && sm.status === 'finished' && sm.winner_team_id) {
                    if (type === 'match.winner') updateData.local_team_id = sm.winner_team_id;
                    else updateData.local_team_id = (sm.visitor_team_id === sm.winner_team_id ? sm.local_team_id : sm.visitor_team_id);
                }
            }
        }

        // Resolve VISITOR
        if (!match.visitor_team_id && match.source_away_type) {
            const type = match.source_away_type;
            const sourceId = match.source_away_id;
            const index = match.source_away_index || 1;

            if (type === 'group.pos' && sourceId) {
                const standings = getGroupStandings(sourceId);
                const target = standings[index - 1];
                if (target) updateData.visitor_team_id = target.team.id;
            } else if ((type === 'match.winner' || type === 'match.loser') && sourceId) {
                const sm = allMatches.find(m => m.id === sourceId || m.global_id?.toString() === sourceId);
                if (sm && sm.status === 'finished' && sm.winner_team_id) {
                    if (type === 'match.winner') updateData.visitor_team_id = sm.winner_team_id;
                    else updateData.visitor_team_id = (sm.visitor_team_id === sm.winner_team_id ? sm.local_team_id : sm.visitor_team_id);
                }
            }
        }

        if (Object.keys(updateData).length > 0) {
            await supabase.from('tournament_matches').update(updateData).eq('id', match.id);
            updatesCount++;
        }
    }

    // 5. Phase Activation logic
    // If the active phase is finished (all matches finished), move to next one
    const activePhase = phases.find(p => p.status === 'active');
    if (activePhase) {
        const pMatches = allMatches.filter(m => m.phase_id === activePhase.phase_id || m.stage_id === activePhase.phase_id);
        const finishedCount = pMatches.filter(m => m.status === 'finished').length;

        console.log(`Phase check: ${activePhase.name} (${activePhase.phase_id}) - ${finishedCount}/${pMatches.length} finished.`);

        // If all are finished OR it's a group stage that just got its ties resolved
        // (Actually, better to check if everything is finished)
        if (pMatches.length > 0 && finishedCount === pMatches.length) {
            const nextIdx = phases.findIndex(p => p.phase_id === activePhase.phase_id) + 1;
            if (nextIdx < phases.length) {
                const nextPhase = phases[nextIdx];
                console.log(`Transitioning: ${activePhase.name} -> ${nextPhase.name}`);
                await supabase.from('tournament_phases').update({ status: 'finished' }).eq('phase_id', activePhase.phase_id);
                await supabase.from('tournament_phases').update({ status: 'active' }).eq('phase_id', nextPhase.phase_id);
            }
        }
    }

    return { success: true, updates: updatesCount };
};
