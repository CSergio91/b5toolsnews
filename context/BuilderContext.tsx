import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BuilderState, initialBuilderState } from '../types/builder';
import { TournamentTeam, TournamentRoster, RefereeProfile, TournamentAdmin } from '../types/tournament';
import { supabase } from '../lib/supabase';

interface BuilderContextType {
    state: BuilderState;
    teams: Partial<TournamentTeam>[];
    rosters: Partial<TournamentRoster>[];
    referees: Partial<RefereeProfile>[];
    admins: Partial<TournamentAdmin>[];
    updateConfig: (key: string, value: any) => void;
    addTeam: (team: Partial<TournamentTeam>) => void;
    updateTeam: (id: string, updates: Partial<TournamentTeam>) => void;
    removeTeam: (id: string) => void;
    addPlayer: (player: Partial<TournamentRoster>) => void;
    updatePlayer: (id: string, updates: Partial<TournamentRoster>) => void;
    removePlayer: (id: string) => void;
    addReferee: (referee: Partial<RefereeProfile>) => void;
    updateReferee: (id: string, updates: Partial<RefereeProfile>) => void;
    removeReferee: (id: string) => void;
    addAdmin: (admin: Partial<TournamentAdmin>) => void;
    updateAdmin: (id: string, updates: Partial<TournamentAdmin>) => void;
    removeAdmin: (id: string) => void;
    setStep: (step: number) => void;
    updateStructure: (structure: import('../types/structure').TournamentStructure) => void;
    saveTournament: () => Promise<string | null>;
    resetBuilder: () => void;
    uploadImageIfNeeded: (urlOrBase64: string | undefined, bucket: 'team-logos' | 'player-photos') => Promise<string | undefined>;
    sendInvitation: (email: string, role: string) => Promise<boolean>;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export const BuilderProvider: React.FC<{ children: ReactNode; initialId?: string; initialState?: BuilderState }> = ({ children, initialId, initialState }) => {
    const [state, setState] = useState<BuilderState>(initialState || initialBuilderState);

    // ... (Existing useEffects)

    // New Function: Send Invitation
    const sendInvitation = async (email: string, role: string) => {
        try {
            console.log("Sending invitation to:", email);
            const { data, error } = await supabase.functions.invoke('invite-user', {
                body: {
                    email,
                    role,
                    tournament_name: state.config.name || 'Torneo Sin Nombre',
                    url: window.location.origin
                }
            });

            console.log("Edge Function Response:", { data, error });

            if (error) throw error;
            return { success: true, data }; // Return data for debugging
        } catch (err: any) {
            console.error("Failed to send invitation:", err);
            throw err;
        }
    };


    // Initial Load: Fetch Tournament Data if ID is present
    React.useEffect(() => {
        // If we have an explicit initial state (e.g., Preview Mode), we skip loading from LS/DB
        if (initialState) return;

        const loadInitialData = async () => {
            // Prioritize ID passed via Prop (URL), fallback to localStorage only if no prop
            const currentId = initialId || localStorage.getItem('b5_builder_current_id');

            if (currentId === 'new') {
                setState(initialBuilderState);
                return;
            }

            // Check for LocalStorage State Dump
            const savedState = localStorage.getItem('b5_builder_state');
            if (!currentId && savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    // Ensure we have a valid object
                    if (parsed && parsed.config) {
                        setState(parsed);
                        return; // Found local state, skip DB
                    }
                } catch (e) {
                    console.error("Error loading local state", e);
                }
            }

            if (currentId) {
                // Fetch Everything in parallel
                const [
                    { data: t, error: tErr },
                    { data: phases, error: sErr },
                    { data: teams, error: teamsErr },
                    { data: _unusedRosters, error: rErr },
                    { data: matches, error: mErr },
                    { data: refs, error: refErr },
                    { data: admins, error: aErr }
                ] = await Promise.all([
                    supabase.from('tournaments').select('*').eq('id', currentId).single(),
                    supabase.from('tournament_phases').select('*').eq('tournament_id', currentId).order('phase_order', { ascending: true }),
                    supabase.from('tournament_teams').select('*').eq('tournament_id', currentId),
                    // Rosters do not have tournament_id, we must fetch them via teams later... or we can skip parallel fetch for rosters
                    // Let's defer roster fetching for a moment
                    Promise.resolve({ data: [], error: null }),
                    supabase.from('tournament_matches').select('*').eq('tournament_id', currentId),
                    supabase.from('tournament_referees').select('*').eq('tournament_id', currentId),
                    supabase.from('tournament_admins').select('*').eq('tournament_id', currentId),
                    supabase.from('tournament_fields').select('*').eq('tournament_id', currentId)
                ]);

                // Fetch Sets for the matches
                let setsData: any[] = [];
                if (matches && matches.length > 0) {
                    const matchIds = matches.map(m => m.id);
                    const { data: sData, error: sErr } = await supabase
                        .from('tournament_sets')
                        .select('*')
                        .in('match_id', matchIds);
                    if (sData) setsData = sData;
                }

                // Fetch Rosters based on Teams found
                let rosters: any[] = [];
                if (teams && teams.length > 0) {
                    const teamIds = teams.map(t => t.id);
                    const { data: rData, error: rErr2 } = await supabase
                        .from('tournament_rosters')
                        .select('*')
                        .in('team_id', teamIds);

                    if (rData) rosters = rData;
                    if (rErr2) console.error("Error fetching rosters", rErr2);
                }

                // Fetch Referee Profiles based on IDs found
                let fullReferees: any[] = [];
                if (refs && refs.length > 0) {
                    const refereeIds = refs.map((r: any) => r.referee_id);
                    if (refereeIds.length > 0) {
                        const { data: pData, error: pErr } = await supabase
                            .from('referee_profiles')
                            .select('*')
                            .in('id', refereeIds);

                        if (pData) fullReferees = pData;
                        if (pErr) console.error("Error fetching referee profiles", pErr);
                    }
                }

                if (t && !tErr) {
                    setState(prev => ({
                        ...prev,
                        config: {
                            ...prev.config,
                            id: t.id,
                            name: t.name,
                            location: t.location,
                            organizer_name: t.organizer_name || '',
                            start_date: t.start_date,
                            end_date: t.end_date,
                            start_time: t.start_time,
                            points_for_win: t.points_for_win || 3,
                            points_for_loss: t.points_for_loss || 0,
                            sets_per_match: t.sets_per_match || 3,
                            cost_per_team: t.cost_per_team || 0,
                            currency: t.currency || 'USD',
                            tournament_type: t.structure?.format_type || t.tournament_type || 'open',
                            number_of_groups: t.number_of_groups, // Persistence for Groups count
                            tiebreaker_rules: t.tiebreaker_rules || [],
                            custom_rules: t.custom_rules || [],
                            fields_config: t.fields_config || [],
                            fields: t.fields_config || [] // Map to 'fields' as UI likely expects this from local state pattern
                        },
                        structure: t.structure || prev.structure,
                        stages: (phases || []).map(p => ({
                            id: p.phase_id,
                            name: p.name,
                            type: p.type,
                            order: p.phase_order,
                            tournament_id: p.tournament_id
                        })),
                        teams: (teams || []).map(tm => ({
                            ...tm,
                            group_id: (tm as any).group_name // Mapping back
                        })),
                        rosters: rosters || [],
                        matches: (matches || []).map(m => ({
                            ...m,
                            sets: setsData.filter(s => s.match_id === m.id).sort((a, b) => a.set_number - b.set_number)
                        })),
                        referees: (refs || []).map((refLink: any) => {
                            const profile = fullReferees.find((p: any) => p.id === refLink.referee_id);
                            return {
                                id: refLink.referee_id,
                                first_name: refLink.first_name || profile?.first_name || 'Arbitro',
                                last_name: refLink.last_name || profile?.last_name || '.',
                                email: refLink.email || profile?.email || null,
                                phone: refLink.phone || profile?.phone || null,
                                avatar_url: profile?.avatar_url || null,
                                rating: profile?.rating || 0
                            };
                        }),
                        admins: (admins || []).map(a => ({
                            ...a,
                            permissions: (a as any).permissions || {}
                        })),
                        isDirty: false
                    }));
                }
            }
        };
        loadInitialData();
    }, [initialId]);

    // -- LocalStorage Persistence --
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            try {
                // 1. Master State (for Builder Reload)
                // We keep ONLY the master state to avoid QuotaExceededError.
                // Sub-keys are redundant as they are derived from state.
                localStorage.setItem('b5_builder_state', JSON.stringify(state));
                if (state.config.id) localStorage.setItem('b5_builder_current_id', state.config.id);

                // 2. Section Sub-JSONs (Optimized/Consolidated if needed for other components)
                // If other parts of the app NEED these specific keys, we update them but DRY.
                // For now, let's keep them but remove the heavy 'structure' from 'b5_builder_matches'
                // since it's already in state.
                localStorage.setItem('b5_builder_info', JSON.stringify(state.config));
                localStorage.setItem('b5_builder_teams', JSON.stringify(state.teams));
                localStorage.setItem('b5_builder_matches', JSON.stringify({
                    matches: state.matches,
                    // structure: state.structure, // REMOVED TO SAVE SPACE
                    fields: (state.config as any).fields || []
                }));
                localStorage.setItem('b5_builder_participants', JSON.stringify({ rosters: state.rosters, referees: state.referees, admins: state.admins }));
            } catch (e) {
                console.warn("Storage quota exceeded, clearing legacy keys...", e);
                // try to clear old/other keys to make space
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('b5_scorekeeper_') || key.startsWith('b5_builder_') && key !== 'b5_builder_state') {
                        // localStorage.removeItem(key); // Be careful here
                    }
                });
            }
        }, 1000);
        return () => clearTimeout(timeout);
    }, [state]);

    const updateConfig = (key: string, value: any) => {
        setState(prev => ({
            ...prev,
            config: { ...prev.config, [key]: value },
            isDirty: true
        }));
    };

    const addTeam = (team: Partial<TournamentTeam>) => {
        setState(prev => ({
            ...prev,
            teams: [...prev.teams, team],
            isDirty: true
        }));
    };

    const updateTeam = (id: string, updates: Partial<TournamentTeam>) => {
        setState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === id ? { ...t, ...updates } : t),
            isDirty: true
        }));
    };

    const removeTeam = (id: string) => {
        setState(prev => ({
            ...prev,
            teams: prev.teams.filter(t => t.id !== id),
            isDirty: true
        }));
    };

    const addPlayer = (player: Partial<TournamentRoster>) => {
        setState(prev => ({
            ...prev,
            rosters: [...prev.rosters, player],
            isDirty: true
        }));
    };

    const updatePlayer = (id: string, updates: Partial<TournamentRoster>) => {
        setState(prev => ({
            ...prev,
            rosters: prev.rosters.map(p => p.id === id ? { ...p, ...updates } : p),
            isDirty: true
        }));
    };

    const removePlayer = (id: string) => {
        setState(prev => ({
            ...prev,
            rosters: prev.rosters.filter(p => p.id !== id),
            isDirty: true
        }));
    };

    const addReferee = (referee: Partial<RefereeProfile>) => {
        setState(prev => ({
            ...prev,
            referees: [...prev.referees, referee],
            isDirty: true
        }));
    };

    const updateReferee = (id: string, updates: Partial<RefereeProfile>) => {
        setState(prev => ({
            ...prev,
            referees: prev.referees.map(r => r.id === id ? { ...r, ...updates } : r),
            isDirty: true
        }));
    };

    const removeReferee = (id: string) => {
        setState(prev => ({
            ...prev,
            referees: prev.referees.filter(r => r.id !== id),
            isDirty: true
        }));
    };

    const addAdmin = (admin: Partial<TournamentAdmin>) => {
        setState(prev => ({
            ...prev,
            admins: [...prev.admins, admin],
            isDirty: true
        }));
    };

    const updateAdmin = (id: string, updates: Partial<TournamentAdmin>) => {
        setState(prev => ({
            ...prev,
            admins: prev.admins.map(a => a.id === id ? { ...a, ...updates } : a),
            isDirty: true
        }));
    };

    const removeAdmin = (id: string) => {
        setState(prev => ({
            ...prev,
            admins: prev.admins.filter(a => a.id !== id),
            isDirty: true
        }));
    };

    const setStep = (step: number) => {
        setState(prev => ({ ...prev, currentStep: step }));
    };

    const resetBuilder = () => {
        setState(initialBuilderState);
    };

    const uploadImageIfNeeded = async (urlOrBase64: string | undefined, bucket: 'team-logos' | 'player-photos'): Promise<string | undefined> => {
        if (!urlOrBase64) return undefined;
        if (urlOrBase64.startsWith('http')) return urlOrBase64; // Already remote

        if (urlOrBase64.startsWith('data:image')) {
            try {
                // Convert Base64 to Blob
                const res = await fetch(urlOrBase64);
                const blob = await res.blob();
                const fileExt = blob.type.split('/')[1] || 'png';
                const fileName = `${crypto.randomUUID()}.${fileExt}`;

                const { data, error } = await supabase.storage
                    .from(bucket)
                    .upload(fileName, blob);

                if (error) throw error;

                const { data: publicUrlData } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(fileName);

                return publicUrlData.publicUrl;
            } catch (error) {
                console.error(`Failed to upload image to ${bucket}:`, error);
                return undefined;
            }
        }
        return undefined;
    };

    const saveTournament = async () => {
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        setState(prev => ({ ...prev, isSaving: true, savingStep: 'Iniciando proceso de guardado...', savingProgress: 0 }));
        await delay(800);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user authenticated");

            // 0. Process Images (Teams & Players)
            setState(prev => ({ ...prev, savingStep: 'Procesando imágenes y recursos multimedia...', savingProgress: 10 }));
            const teamsToSave = await Promise.all(state.teams.map(async (team) => {
                const logo = await uploadImageIfNeeded(team.logo_url, 'team-logos');
                return { ...team, logo_url: logo };
            }));

            const rostersToSave = await Promise.all(state.rosters.map(async (player) => {
                const photo = await uploadImageIfNeeded(player.photo_url, 'player-photos');
                return { ...player, photo_url: photo };
            }));

            // Update State with new URLs to prevent re-upload
            setState(prev => ({
                ...prev,
                teams: teamsToSave,
                rosters: rostersToSave
            }));
            await delay(800);

            // 1. Insert/Update Tournament
            setState(prev => ({ ...prev, savingStep: 'Guardando configuración general del torneo...', savingProgress: 25 }));

            // Filter only valid columns for 'tournaments' table
            // Sanitize tournament_type for DB constraint (only allows 'open', 'invitational', 'club')
            // If user selected a format (e.g. 'groups', 'knockout'), we save it in structure.format_type
            // and act as 'open' for the DB column
            const validDbTypes = ['open', 'invitational', 'club'];
            const currentType = state.config.tournament_type || 'open';
            const dbType = validDbTypes.includes(currentType) ? currentType : 'open';

            // Inject the real format type into structure to persist it
            const structureWithFormat = {
                ...(state.structure || {}),
                format_type: currentType
            };

            const tournamentData: any = {
                name: state.config.name || 'Sin Nombre',
                location: state.config.location || 'Sin Ubicación',
                start_date: state.config.start_date || new Date().toISOString().split('T')[0],
                end_date: state.config.end_date || new Date().toISOString().split('T')[0],
                start_time: state.config.start_time || '09:00:00',
                organizer_name: state.config.organizer_name || null,
                contact_email: state.config.contact_email || null,
                tournament_type: dbType,
                number_of_groups: state.config.number_of_groups, // Now strictly saved
                cost_per_team: state.config.cost_per_team,
                currency: state.config.currency,
                points_for_win: state.config.points_for_win,
                points_for_loss: state.config.points_for_loss,
                sets_per_match: state.config.sets_per_match,
                tiebreaker_rules: state.config.tiebreaker_rules || [],
                custom_rules: state.config.custom_rules || [],
                structure: structureWithFormat,
                fields_config: (state.config as any).fields || state.config.fields_config || [],
                user_id: user.id,
                status: 'draft'
            };

            // Only include ID if it's a valid UUID
            if (state.config.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(state.config.id)) {
                tournamentData.id = state.config.id;
            }

            const { data: tournament, error: tError } = await supabase
                .from('tournaments')
                .upsert([tournamentData])
                .select()
                .single();

            if (tError) throw tError;
            if (tError) throw tError;
            await delay(1000);

            // --- SYNC & CLEANUP (New Logic) ---
            setState(prev => ({ ...prev, savingStep: 'Sincronizando y limpiando datos obsoletos...', savingProgress: 30 }));

            // 1. Clean Phases (Normalized)
            if (tournament.id) {
                const { data: dbPhases } = await supabase.from('tournament_phases').select('phase_id').eq('tournament_id', tournament.id);
                if (dbPhases) {
                    const currentPhaseIds = (state.structure?.phases || []).map(p => p.id).filter(id => id && /^[0-9a-f]{8}-/i.test(id));
                    const toDelete = dbPhases.filter(p => !currentPhaseIds.includes(p.phase_id)).map(p => p.phase_id);
                    if (toDelete.length > 0) {
                        await supabase.from('tournament_phases').delete().in('phase_id', toDelete);
                    }
                }
            }

            // 2. Clean Teams
            if (tournament.id) {
                const { data: dbTeams } = await supabase.from('tournament_teams').select('id').eq('tournament_id', tournament.id);
                if (dbTeams) {
                    const currentTeamIds = teamsToSave.map(t => t.id).filter(id => id && /^[0-9a-f]{8}-/i.test(id));
                    const toDelete = dbTeams.filter(t => !currentTeamIds.includes(t.id)).map(t => t.id);
                    if (toDelete.length > 0) {
                        await supabase.from('tournament_teams').delete().in('id', toDelete);
                    }
                }
            }

            // 3. Clean Rosters
            // Fetch ALL rosters for the remaining teams to ensure deep cleanup
            const validTeamIds = teamsToSave.map(t => t.id).filter(id => id && /^[0-9a-f]{8}-/i.test(id));
            if (validTeamIds.length > 0) {
                const { data: dbRosters } = await supabase.from('tournament_rosters').select('id').in('team_id', validTeamIds);
                if (dbRosters) {
                    const currentRosterIds = rostersToSave.map(r => r.id).filter(id => id && /^[0-9a-f]{8}-/i.test(id));
                    const toDelete = dbRosters.filter(r => !currentRosterIds.includes(r.id)).map(r => r.id);
                    if (toDelete.length > 0) {
                        await supabase.from('tournament_rosters').delete().in('id', toDelete);
                    }
                }
            }

            // 4. Clean Fields
            if (tournament.id) {
                const { data: dbFields } = await supabase.from('tournament_fields').select('id').eq('tournament_id', tournament.id);
                const currentFields = (state.config as any).fields || state.config.fields_config || [];
                if (dbFields) {
                    const currentFieldIds = currentFields.map((f: any) => f.id).filter((id: string) => id && /^[0-9a-f]{8}-/i.test(id));
                    const toDelete = dbFields.filter(f => !currentFieldIds.includes(f.id)).map(f => f.id);
                    if (toDelete.length > 0) {
                        await supabase.from('tournament_fields').delete().in('id', toDelete);
                    }
                }
            }

            // --- END SYNC ---

            // 1.5 Save Phases (New Normalized)
            setState(prev => ({ ...prev, savingStep: 'Estructurando fases del torneo...', savingProgress: 40 }));

            // Save to NEW Normalized 'public.tournament_phases'
            if (state.structure?.phases && state.structure.phases.length > 0) {
                const { error: phasesError } = await supabase
                    .from('tournament_phases')
                    .upsert(state.structure.phases.map(p => ({
                        phase_id: p.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id) ? p.id : undefined,
                        tournament_id: tournament.id,
                        name: p.name || 'Fase',
                        type: p.type || 'group',
                        phase_order: p.order || 0
                    })), { onConflict: 'phase_id' }); // Strict upsert
                if (phasesError) console.error("Error saving normalized phases:", phasesError);
            }
            await delay(800);

            // 2. Save Teams
            setState(prev => ({ ...prev, savingStep: `Sincronizando ${teamsToSave.length} equipos...`, savingProgress: 55 }));
            if (teamsToSave.length > 0) {
                // Map group names from structure if not present in team object
                const teamsWithGroups = teamsToSave.map(t => {
                    let groupName = (t as any).group_name || (t as any).group_id;

                    // Fallback: If groupName is null/empty, look it up in the structure
                    if (!groupName && state.structure?.phases) {
                        for (const phase of state.structure.phases) {
                            if (phase.groups) {
                                for (const group of phase.groups) {
                                    if (group.teams?.includes(t.id!)) {
                                        groupName = group.name;
                                        break;
                                    }
                                }
                            }
                            if (groupName) break;
                        }
                    }

                    return {
                        id: t.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id) ? t.id : undefined,
                        tournament_id: tournament.id,
                        name: t.name || 'Equipo sin nombre',
                        short_name: t.short_name,
                        logo_url: t.logo_url,
                        group_name: groupName, // Match DB column 'group_name'
                        wins: t.wins || 0,
                        losses: t.losses || 0,
                        runs_scored: t.runs_scored || 0,
                        runs_allowed: t.runs_allowed || 0,
                        gp: t.gp || 0,
                        w: t.w || 0,
                        l: t.l || 0,
                        pts: t.pts || 0,
                        stats_ab: (t as any).stats_ab || 0,
                        stats_h: (t as any).stats_h || 0,
                        stats_r: (t as any).stats_r || 0,
                        stats_e_def: (t as any).stats_e_def || 0,
                        stats_e_of: (t as any).stats_e_of || 0
                    };
                });

                const { error: teamsError } = await supabase
                    .from('tournament_teams')
                    .upsert(teamsWithGroups);

                if (teamsError) throw teamsError;
            }
            await delay(800);

            // 3. Save Rosters
            setState(prev => ({ ...prev, savingStep: `Registrando ${rostersToSave.length} jugadores en los rosters...`, savingProgress: 70 }));
            if (rostersToSave.length > 0) {
                const { error: rosterError } = await supabase
                    .from('tournament_rosters')
                    .upsert(rostersToSave.map(r => ({
                        id: r.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.id) ? r.id : undefined,
                        // tournament_id: tournament.id, // Column does not exist
                        team_id: r.team_id,
                        first_name: r.first_name || 'Nombre',
                        last_name: r.last_name || 'Apellido',
                        number: r.number,
                        gender: r.gender,
                        role: r.role,
                        ab: r.ab || 0,
                        h: r.h || 0,
                        r: r.r || 0,
                        rbi: r.rbi || 0,
                        avg: r.avg || 0,
                        hr: r.hr || 0,
                        k: r.k || 0,
                        bb: r.bb || 0,
                        e_def: r.e_def || 0,
                        e_of: r.e_of || 0
                    })));

                if (rosterError) throw rosterError;
            }
            await delay(800);

            // 4. Save Referees (Manual Sync Strategy to bypass 409s)
            setState(prev => ({ ...prev, savingStep: 'Syncing referees...', savingProgress: 80 }));

            // 4.1 Get valid unique referees from state
            const uniqueRefereesFromState = state.referees
                .filter(r => r.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.id))
                .reduce((acc, current) => {
                    const x = acc.find(item => item.id === current.id);
                    if (!x) return acc.concat([current]);
                    else return acc;
                }, [] as any[]);
            const stateRefIds = uniqueRefereesFromState.map(r => r.id);

            // 4.1.1 Ensure Profiles Exist (Fix for 23503, bypassing RLS via RPC)
            if (uniqueRefereesFromState.length > 0) {
                // Use RPC to bypass RLS policies on referee_profiles
                const profilePromises = uniqueRefereesFromState.map(r => {
                    let firstName = r.first_name || 'Arbitro';
                    let lastName = r.last_name || '.';
                    if (!r.first_name && r.name && r.name !== 'Nuevo Árbitro') {
                        const parts = r.name.trim().split(' ');
                        firstName = parts[0];
                        lastName = parts.slice(1).join(' ') || '.';
                    }

                    return supabase.rpc('upsert_referee_profile_secure', {
                        p_id: r.id,
                        p_first_name: firstName,
                        p_last_name: lastName,
                        p_email: r.email || null,
                        p_avatar_url: r.avatar_url || null
                    });
                });

                // Run in parallel
                const results = await Promise.all(profilePromises);
                results.forEach(({ error }) => {
                    if (error) console.warn("Error creating referee profile via RPC", error);
                });
            }

            // 4.2 Fetch EXISTING refs for this tournament
            const { data: existingRefs, error: fetchError } = await supabase
                .from('tournament_referees')
                .select('referee_id')
                .eq('tournament_id', tournament.id);

            if (fetchError) {
                console.error("Error fetching existing referees", fetchError);
            } else {
                const existingRefIds = (existingRefs || []).map((r: any) => r.referee_id);

                // Helper to build payload
                const allActiveRefIds = uniqueRefereesFromState.map(r => r.id);
                // Fetch profiles for ALL active referees (to insert OR update)
                // This ensures we always have the latest profile data (email, name)
                const { data: profileData, error: profileFetchError } = await supabase
                    .from('referee_profiles')
                    .select('id, first_name, last_name, email, phone')
                    .in('id', allActiveRefIds);

                if (profileFetchError) console.error("Error fetching profile data", profileFetchError);

                const profileMap = new Map((profileData || []).map((p: any) => [p.id, p]));

                const buildRefereePayload = (r: any) => {
                    const profile = profileMap.get(r.id);
                    let firstName = profile?.first_name || r.first_name || 'Arbitro';
                    let lastName = profile?.last_name || r.last_name || '.';
                    let email = profile?.email || r.email || null;
                    let phone = profile?.phone || r.phone || null;

                    if (!profile && !r.first_name && r.name && r.name !== 'Nuevo Árbitro') {
                        const parts = r.name.trim().split(' ');
                        firstName = parts[0];
                        lastName = parts.slice(1).join(' ') || '.';
                    }
                    return {
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        phone: phone
                    };
                };

                // 4.3 Determine INSERTS (In State but NOT in DB)
                const toInsert = uniqueRefereesFromState.filter(r => !existingRefIds.includes(r.id));
                if (toInsert.length > 0) {
                    const insertPayload = toInsert.map(r => ({
                        tournament_id: tournament.id,
                        referee_id: r.id,
                        status: 'accepted',
                        ...buildRefereePayload(r)
                    }));
                    const { error: insertError } = await supabase.from('tournament_referees').insert(insertPayload);
                    if (insertError) console.error("Error inserting new referees", insertError);
                }

                // 4.3.5 UPDATE EXISTING (Fix for "Corrupted/Missing Columns" data)
                // Update existing referees to ensure they have the latest profile columns
                const toUpdate = uniqueRefereesFromState.filter(r => existingRefIds.includes(r.id));
                if (toUpdate.length > 0) {
                    const updatePromises = toUpdate.map(r => {
                        const payload = buildRefereePayload(r);
                        return supabase
                            .from('tournament_referees')
                            .update(payload)
                            .eq('tournament_id', tournament.id)
                            .eq('referee_id', r.id);
                    });
                    await Promise.all(updatePromises);
                }

                // 4.4 Determine DELETES (In DB but NOT in State)
                const toDeleteIds = existingRefIds.filter(id => !stateRefIds.includes(id));
                if (toDeleteIds.length > 0) {
                    const { error: deleteError } = await supabase
                        .from('tournament_referees')
                        .delete()
                        .eq('tournament_id', tournament.id)
                        .in('referee_id', toDeleteIds);
                    if (deleteError) console.error("Error deleting removed referees", deleteError);
                }
            }
            await delay(600);

            // 5. Save Admins
            setState(prev => ({ ...prev, savingStep: 'Asignando permisos de administración...', savingProgress: 85 }));
            if (state.admins.length > 0) {
                const { error: adminError } = await supabase
                    .from('tournament_admins')
                    .upsert(state.admins.map(a => ({
                        id: a.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a.id) ? a.id : undefined,
                        tournament_id: tournament.id,
                        first_name: a.first_name || 'Admin',
                        last_name: a.last_name || 'Admin',
                        email: a.email,
                        role: a.role,
                        avatar_url: a.avatar_url,
                        status: 'invited',
                        permissions: a.permissions // Save detailed permissions
                    })));

                if (adminError) throw adminError;
            }
            await delay(600);

            // 6. Save Matches (Normalized Schema)
            setState(prev => ({ ...prev, savingStep: 'Guardando calendario y partidos...', savingProgress: 90 }));

            const matchesToSaveRelational: any[] = [];
            const setsToSaveRelational: any[] = [];

            // Extract from state.structure (True Source of Truth for B5 Builder)
            if (state.structure?.phases) {
                state.structure.phases.forEach(phase => {
                    const phaseId = phase.id;

                    const processMatch = (m: any) => {
                        const mId = m.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id) ? m.id : undefined;
                        if (!mId) return null;

                        // Find which field contains this match in items
                        const fieldConfig = (state.config as any).fields || state.config.fields_config || [];
                        let resolvedStartTime: string | null = null;
                        let parentField = null;

                        for (const f of fieldConfig) {
                            if (!f.items) continue;
                            const matchItem = f.items.find((i: any) => i.matchId === mId);
                            if (matchItem) {
                                parentField = f;
                                // Calculate the start time based on position in items for THAT date
                                const itemsOnSameDate = f.items.filter((i: any) => i.date === matchItem.date);
                                const matchIdx = itemsOnSameDate.findIndex((i: any) => i.id === matchItem.id);

                                let currentMinutes = 0;
                                for (let k = 0; k < matchIdx; k++) {
                                    currentMinutes += itemsOnSameDate[k].durationMinutes || 60;
                                }

                                // Helper function conceptually (inline here for BuilderContext)
                                const [baseH, baseM] = (f.startTime || '09:00').split(':').map(Number);
                                const totalMin = baseH * 60 + baseM + currentMinutes;
                                const resH = Math.floor(totalMin / 60) % 24;
                                const resM = totalMin % 60;
                                const timeStr = `${String(resH).padStart(2, '0')}:${String(resM).padStart(2, '0')}:00`;

                                resolvedStartTime = `${matchItem.date}T${timeStr}`;
                                break;
                            }
                        }

                        matchesToSaveRelational.push({
                            id: mId,
                            tournament_id: tournament.id,
                            phase_id: phaseId,
                            stage_id: phaseId, // Legacy compatibility
                            name: m.name,
                            set_number: m.location, // Renamed from location. Holds "1 Set" / "3 Sets" string from Builder
                            round_index: m.roundIndex,
                            global_id: m.globalId,
                            source_home_id: m.sourceHome?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.sourceHome.id) ? m.sourceHome.id : null,
                            source_home_type: m.sourceHome?.type,
                            source_home_index: m.sourceHome?.index,
                            source_away_id: m.sourceAway?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.sourceAway.id) ? m.sourceAway.id : null,
                            source_away_type: m.sourceAway?.type,
                            source_away_index: m.sourceAway?.index,
                            local_team_id: m.sourceHome?.type === 'team' && m.sourceHome.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.sourceHome.id) ? m.sourceHome.id : null,
                            visitor_team_id: m.sourceAway?.type === 'team' && m.sourceAway.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.sourceAway.id) ? m.sourceAway.id : null,
                            referee_id: m.refereeId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.refereeId) ? m.refereeId : null,
                            status: m.status || 'scheduled',
                            start_time: resolvedStartTime || m.start_time,
                            field: parentField ? parentField.id : (m.court || m.field) // Prefer resolved Field ID
                        });

                        if (m.sets) {
                            m.sets.forEach((s: any) => {
                                setsToSaveRelational.push({
                                    match_id: mId,
                                    set_number: s.set_number,
                                    status: s.status || 'pending',
                                    home_score: s.home_score || 0,
                                    away_score: s.away_score || 0,
                                    // The instruction implies replacing local_runs with home_score and visitor_runs with away_score.
                                    // Since home_score and away_score are already present, we will remove the redundant local_runs and visitor_runs.
                                    // If the intention was to rename the existing fields, it would lead to duplicate keys.
                                    // Assuming the instruction means to ensure these fields are correctly named and populated.
                                    // The original code had:
                                    // local_runs: s.home_score || 0,
                                    // visitor_runs: s.away_score || 0,
                                    // By removing these, we rely on the `home_score` and `away_score` fields above.
                                    data: s.data || {}
                                });
                            });
                        }
                    };

                    if (phase.matches) phase.matches.forEach(processMatch);
                    if (phase.groups) phase.groups.forEach(g => g.matches?.forEach(processMatch));
                });
            }

            // CLEAN Matches (Sync) - Must happen BEFORE upsert to avoid conflicts
            if (tournament.id) {
                const { data: dbMatches } = await supabase.from('tournament_matches').select('id').eq('tournament_id', tournament.id);
                if (dbMatches) {
                    const currentMatchIds = matchesToSaveRelational.map(m => m.id);
                    const toDelete = dbMatches.filter(m => !currentMatchIds.includes(m.id)).map(m => m.id);
                    if (toDelete.length > 0) {
                        // This will cascade delete Sets potentially
                        await supabase.from('tournament_matches').delete().in('id', toDelete);
                    }
                }
            }

            // Save Matches to public schema (relational columns)
            if (matchesToSaveRelational.length > 0) {
                const { error: mRelError } = await supabase
                    .from('tournament_matches')
                    .upsert(matchesToSaveRelational);
                if (mRelError) console.error("Error saving normalized matches:", mRelError);
            }

            // Save Sets to public schema (relational columns)
            if (setsToSaveRelational.length > 0) {
                const { error: sRelError } = await supabase
                    .from('tournament_sets')
                    .upsert(setsToSaveRelational, { onConflict: 'match_id,set_number' });
                if (sRelError) console.error("Error saving normalized sets:", sRelError);
            }

            await delay(600);
            await delay(600);

            // 7. Save Fields (Relational)
            setState(prev => ({ ...prev, savingStep: 'Guardando configuración de campos...', savingProgress: 95 }));
            const fields = (state.config as any).fields || state.config.fields_config;
            if (fields && fields.length > 0) {
                const { error: fieldError } = await supabase
                    .from('tournament_fields')
                    .upsert(fields.map((f: any) => ({
                        id: f.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.id) ? f.id : undefined,
                        tournament_id: tournament.id,
                        name: f.name,
                        start_time: f.startTime || f.start_time || '09:00',
                        properties: f.properties || {}
                    })));
                if (fieldError) throw fieldError;
            }
            await delay(1000);

            await delay(1000);

            setState(prev => ({ ...prev, savingStep: '¡Todo listo! Finalizando guardado...', savingProgress: 100 }));
            await delay(1000);

            setState(prev => ({ ...prev, isSaving: false, savingStep: undefined, savingProgress: 0, isDirty: false, lastSaved: new Date() }));
            return tournament.id;
        } catch (error: any) {
            console.error("Error saving tournament - Full Error:", error);
            if (error.details) console.error("Error Details:", error.details);
            if (error.hint) console.error("Error Hint:", error.hint);
            if (error.message) console.error("Error Message:", error.message);
            setState(prev => ({ ...prev, isSaving: false, savingStep: undefined, savingProgress: 0 }));
            return null;
        }
    };

    const updateStructure = (structure: import('../types/structure').TournamentStructure) => {
        setState(prev => ({
            ...prev,
            structure,
            isDirty: true
        }));
    };

    return (
        <BuilderContext.Provider value={{
            state,
            teams: state.teams,
            rosters: state.rosters,
            referees: state.referees,
            updateConfig,
            addTeam,
            updateTeam,
            removeTeam,
            addPlayer,
            updatePlayer,
            removePlayer,
            addReferee,
            updateReferee,
            removeReferee,
            admins: state.admins,
            addAdmin,
            updateAdmin,
            removeAdmin,
            setStep,
            updateStructure,
            saveTournament,
            resetBuilder,
            uploadImageIfNeeded,
            sendInvitation
        }}>
            {children}
        </BuilderContext.Provider>
    );
};

export const useBuilder = () => {
    const context = useContext(BuilderContext);
    if (!context) throw new Error("useBuilder must be used within a BuilderProvider");
    return context;
};
