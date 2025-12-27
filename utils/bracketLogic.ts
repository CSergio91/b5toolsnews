import { SupabaseClient } from '@supabase/supabase-js';
import { calculateStandings } from './standingsLogic';

// Types for Source Definition (matching DB columns)
export type SourceType = 'group.pos' | 'match.winner' | 'match.loser' | 'team';

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

    // 3. Fetch ALL Matches, Teams, and Sets
    const { data: allMatches } = await supabase.from('tournament_matches').select('*').eq('tournament_id', tournamentId);
    const { data: allTeams } = await supabase.from('tournament_teams').select('*').eq('tournament_id', tournamentId);
    if (!allMatches || !allTeams) return { success: false, error: 'Matches or Teams not found' };

    const { data: allSets } = await supabase
        .from('tournament_sets')
        .select('*, match_id')
        .in('match_id', allMatches.map(m => m.id));

    let updatesCount = 0;
    let activatedPhaseId: string | null = null;

    // Helper: Calculate Group Standings using centralized utility
    const getGroupStandings = (groupIdOrName: string) => {
        const normalizedInput = groupIdOrName.replace(/^Grupo\s+/i, '');

        // 1. Identify teams in this group from the structure JSON (Source of Truth)
        let groupTeamIds: string[] = [];
        const structPhases = tournament?.structure?.phases || [];
        for (const phase of structPhases) {
            if (phase.groups) {
                const targetGroup = phase.groups.find((g: any) =>
                    g.name === groupIdOrName ||
                    g.name === normalizedInput ||
                    g.id === groupIdOrName
                );
                if (targetGroup && targetGroup.teams) {
                    groupTeamIds = targetGroup.teams;
                    break;
                }
            }
        }

        // 2. Filter teams based on identified IDs OR database column fallback
        const groupTeams = allTeams?.filter(t => {
            if (groupTeamIds.length > 0) {
                return groupTeamIds.includes(t.id);
            }
            // Fallback to DB columns
            return t.id === groupIdOrName ||
                t.group_name === groupIdOrName ||
                t.group_name === normalizedInput ||
                (t.group_name?.replace(/^Grupo\s+/i, '') === normalizedInput)
        }) || [];

        if (groupTeams.length === 0) return [];

        // Use the centralized utility
        return calculateStandings(groupTeams, allMatches, allSets || [], null, tournament);
    };

    // 4. Seeding Logic (Cruces)
    const allStructurePhases = tournament?.structure?.phases || tournament?.structure?.stages || [];
    const allStructureMatches: any[] = [];
    allStructurePhases.forEach((p: any) => {
        if (p.matches) allStructureMatches.push(...p.matches);
        if (p.groups) p.groups.forEach((g: any) => {
            if (g.matches) allStructureMatches.push(...g.matches);
        });
    });

    const pendingMatches = allMatches.filter(m => m.status !== 'finished');

    for (const match of pendingMatches) {
        let updateData: any = {};
        const structMatch = allStructureMatches.find(sm => sm.id === match.id || sm.globalId === match.global_id);

        // Resolve LOCAL
        const sHType = match.source_home_type || structMatch?.sourceHome?.type;
        const sHId = match.source_home_id || structMatch?.sourceHome?.id;
        const sHIndex = match.source_home_index || structMatch?.sourceHome?.index || 1;

        if (sHType) {
            let resolvedTeamId = null;
            if (sHType === 'group.pos' && sHId) {
                const standings = getGroupStandings(sHId);
                resolvedTeamId = standings[sHIndex - 1]?.id;
            } else if ((sHType === 'match.winner' || sHType === 'match.loser') && sHId) {
                const sm = allMatches.find(m => m.id === sHId || m.global_id?.toString() === sHId);
                if (sm && sm.status === 'finished' && sm.winner_team_id) {
                    if (sHType === 'match.winner') resolvedTeamId = sm.winner_team_id;
                    else resolvedTeamId = (sm.visitor_team_id === sm.winner_team_id ? sm.local_team_id : sm.visitor_team_id);
                }
            }
            // Overwrite if different (Allow correction/re-seeding)
            if (resolvedTeamId && resolvedTeamId !== match.local_team_id) {
                updateData.local_team_id = resolvedTeamId;
            }
        }

        // Resolve VISITOR
        const sAType = match.source_away_type || structMatch?.sourceAway?.type;
        const sAId = match.source_away_id || structMatch?.sourceAway?.id;
        const sAIndex = match.source_away_index || structMatch?.sourceAway?.index || 1;

        if (sAType) {
            let resolvedTeamId = null;
            if (sAType === 'group.pos' && sAId) {
                const standings = getGroupStandings(sAId);
                resolvedTeamId = standings[sAIndex - 1]?.id;
            } else if ((sAType === 'match.winner' || sAType === 'match.loser') && sAId) {
                const sm = allMatches.find(m => m.id === sAId || m.global_id?.toString() === sAId);
                if (sm && sm.status === 'finished' && sm.winner_team_id) {
                    if (sAType === 'match.winner') resolvedTeamId = sm.winner_team_id;
                    else resolvedTeamId = (sm.visitor_team_id === sm.winner_team_id ? sm.local_team_id : sm.visitor_team_id);
                }
            }
            // Overwrite if different
            if (resolvedTeamId && resolvedTeamId !== match.visitor_team_id) {
                updateData.visitor_team_id = resolvedTeamId;
            }
        }

        if (Object.keys(updateData).length > 0) {
            console.log(`Updating Match ${match.name || match.id}:`, updateData);
            await supabase.from('tournament_matches').update(updateData).eq('id', match.id);
            updatesCount++;
        }
    }

    // 5. AUTO-POPULATE group_name in tournament_teams if missing (User Request)
    const missingGroupTeams = allTeams.filter(t => !t.group_name);
    if (missingGroupTeams.length > 0 && tournament.structure?.phases) {
        const groupUpdates = [];
        for (const team of missingGroupTeams) {
            let foundGroupName = null;
            for (const phase of tournament.structure.phases) {
                if (phase.groups) {
                    for (const group of phase.groups) {
                        if (group.teams?.includes(team.id)) {
                            foundGroupName = group.name;
                            break;
                        }
                    }
                }
                if (foundGroupName) break;
            }
            if (foundGroupName) {
                groupUpdates.push(
                    supabase.from('tournament_teams').update({ group_name: foundGroupName }).eq('id', team.id)
                );
            }
        }
        if (groupUpdates.length > 0) {
            await Promise.all(groupUpdates);
            console.log(`Auto-populated group_name for ${groupUpdates.length} teams.`);
        }
    }

    // 6. Phase Activation logic
    const activePhase = phases.find(p => p.status === 'active');
    if (activePhase) {
        const pMatches = allMatches.filter(m => m.phase_id === activePhase.phase_id || m.stage_id === activePhase.phase_id);
        const finishedCount = pMatches.filter(m => m.status === 'finished').length;

        // Auto-finish criteria: All matches are finished OR manually triggered.
        // We only transition if matches exist and all are done.
        if (pMatches.length > 0 && finishedCount === pMatches.length) {
            const nextIdx = phases.findIndex(p => p.phase_id === activePhase.phase_id) + 1;
            if (nextIdx < phases.length) {
                const nextPhase = phases[nextIdx];
                await supabase.from('tournament_phases').update({ status: 'finished' }).eq('phase_id', activePhase.phase_id);
                await supabase.from('tournament_phases').update({ status: 'active' }).eq('phase_id', nextPhase.phase_id);
                activatedPhaseId = nextPhase.phase_id;
            }
        }
    }

    return { success: true, updates: updatesCount, activatedPhaseId };
};
