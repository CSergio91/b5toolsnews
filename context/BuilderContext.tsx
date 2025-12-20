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
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export const BuilderProvider: React.FC<{ children: ReactNode; initialId?: string; initialState?: BuilderState }> = ({ children, initialId, initialState }) => {
    const [state, setState] = useState<BuilderState>(initialState || initialBuilderState);

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
                const { data: t, error } = await supabase
                    .from('tournaments')
                    .select('*')
                    .eq('id', currentId)
                    .single();

                if (t && !error) {
                    setState(prev => ({
                        ...prev,
                        config: {
                            ...prev.config,
                            name: t.name,
                            location: t.location,
                            organizer_name: t.organizer || '',
                            start_date: t.start_date,
                            end_date: t.end_date,
                            points_for_win: t.points_for_win || 3,
                            points_for_loss: t.points_for_loss || 0,
                            sets_per_match: t.sets_per_match || 3,
                            cost_per_team: t.cost || 0,
                            tournament_type: t.tournament_type || 'open'
                        },
                        // Ensure lists are initialized if not present in previous state
                        teams: prev.teams || [],
                        rosters: prev.rosters || [],
                        matches: prev.matches || [],
                        referees: prev.referees || [],
                        admins: prev.admins || [],
                        isDirty: false // Reset dirty flag after initial load
                    }));
                }
            }
        };
        loadInitialData();
    }, [initialId]);

    // -- LocalStorage Persistence --
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            // 1. Master State (for Builder Reload)
            localStorage.setItem('b5_builder_state', JSON.stringify(state));
            if (state.config.id) localStorage.setItem('b5_builder_current_id', state.config.id);

            // 2. Section Sub-JSONs (for Preview Consumption as requested)
            localStorage.setItem('b5_builder_info', JSON.stringify(state.config));
            localStorage.setItem('b5_builder_teams', JSON.stringify(state.teams));
            // Include 'fields' from config in the matches JSON as requested for the Calendar logic
            localStorage.setItem('b5_builder_matches', JSON.stringify({
                matches: state.matches,
                structure: state.structure,
                fields: (state.config as any).fields || []
            }));
            localStorage.setItem('b5_builder_participants', JSON.stringify({ rosters: state.rosters, referees: state.referees, admins: state.admins }));
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

        setState(prev => ({ ...prev, isSaving: true, savingStep: 'Iniciando proceso de guardado...' }));
        await delay(800);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user authenticated");

            // 0. Process Images (Teams & Players)
            setState(prev => ({ ...prev, savingStep: 'Procesando imágenes y recursos multimedia...' }));
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
            setState(prev => ({ ...prev, savingStep: 'Guardando configuración general del torneo...' }));

            // Filter only valid columns for 'tournaments' table
            const tournamentData: any = {
                name: state.config.name || 'Sin Nombre',
                location: state.config.location || 'Sin Ubicación',
                start_date: state.config.start_date || new Date().toISOString().split('T')[0],
                end_date: state.config.end_date || new Date().toISOString().split('T')[0],
                start_time: state.config.start_time || '09:00:00',
                organizer_name: state.config.organizer_name || null,
                contact_email: state.config.contact_email || null,
                tournament_type: state.config.tournament_type,
                cost_per_team: state.config.cost_per_team,
                currency: state.config.currency,
                points_for_win: state.config.points_for_win,
                points_for_loss: state.config.points_for_loss,
                sets_per_match: state.config.sets_per_match,
                tiebreaker_rules: state.config.tiebreaker_rules || [],
                custom_rules: state.config.custom_rules || [],
                structure: state.structure,
                fields_config: (state.config as any).fields || state.config.fields_config || [],
                user_id: user.id,
                status: 'draft',
                debug_info: 'antigravity_v3' // Debug key to verify code version
            };

            console.log("ANTIGRAVITY DEBUG - Tournament data to save:", tournamentData);
            console.log("ANTIGRAVITY DEBUG - state.config:", state.config);

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
            await delay(1000);

            // 1.5 Save Stages
            setState(prev => ({ ...prev, savingStep: 'Estructurando fases del torneo...' }));
            if (state.stages && state.stages.length > 0) {
                const { error: stagesError } = await supabase
                    .from('tournament_stages')
                    .upsert(state.stages.map(s => ({
                        id: s.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id) ? s.id : undefined,
                        tournament_id: tournament.id,
                        name: s.name || 'Fase',
                        type: s.type || 'group',
                        order: s.order || 0,
                        bracket_size: s.bracket_size,
                        number_of_groups: s.number_of_groups,
                        teams_per_group: s.teams_per_group
                    })));

                if (stagesError) throw stagesError;
            }
            await delay(800);

            // 2. Save Teams
            setState(prev => ({ ...prev, savingStep: `Sincronizando ${teamsToSave.length} equipos...` }));
            if (teamsToSave.length > 0) {
                const { error: teamsError } = await supabase
                    .from('tournament_teams')
                    .upsert(teamsToSave.map(t => ({
                        id: t.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id) ? t.id : undefined,
                        tournament_id: tournament.id,
                        name: t.name || 'Equipo sin nombre',
                        short_name: t.short_name,
                        logo_url: t.logo_url,
                        group_name: (t as any).group_name || (t as any).group_id, // Match DB column 'group_name'
                        wins: t.wins || 0,
                        losses: t.losses || 0,
                        runs_scored: t.runs_scored || 0,
                        runs_allowed: t.runs_allowed || 0
                    })));

                if (teamsError) throw teamsError;
            }
            await delay(800);

            // 3. Save Rosters
            setState(prev => ({ ...prev, savingStep: `Registrando ${rostersToSave.length} jugadores en los rosters...` }));
            if (rostersToSave.length > 0) {
                const { error: rosterError } = await supabase
                    .from('tournament_rosters')
                    .upsert(rostersToSave.map(r => ({
                        id: r.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.id) ? r.id : undefined,
                        tournament_id: tournament.id,
                        team_id: r.team_id,
                        first_name: r.first_name || 'Nombre',
                        last_name: r.last_name || 'Apellido',
                        number: r.number,
                        gender: r.gender,
                        role: r.role
                    })));

                if (rosterError) throw rosterError;
            }
            await delay(800);

            // 4. Save Referees
            setState(prev => ({ ...prev, savingStep: 'Configurando panel de oficiales y árbitros...' }));
            // Note: DB table 'tournament_referees' only has referee_id (link to profile).
            // For now we skip or just save the link if referee_id is present.
            if (state.referees.length > 0) {
                const { error: refError } = await supabase
                    .from('tournament_referees')
                    .upsert(state.referees.filter(r => r.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.id)).map(r => ({
                        id: r.id,
                        tournament_id: tournament.id,
                        referee_id: r.id, // Assuming ID is the profile ID
                        status: 'accepted'
                    })));

                if (refError) console.warn("Error saving referee links", refError);
            }
            await delay(600);

            // 5. Save Admins
            setState(prev => ({ ...prev, savingStep: 'Asignando permisos de administración...' }));
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
                        status: 'invited'
                    })));

                if (adminError) throw adminError;
            }
            await delay(600);

            // 6. Save Matches / Fixture
            setState(prev => ({ ...prev, savingStep: 'Generando calendario y encuentros (Fixture)...' }));
            if (state.matches && state.matches.length > 0) {
                const { error: matchError } = await supabase
                    .from('tournament_matches')
                    .upsert(state.matches.map(m => ({
                        id: m.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id) ? m.id : undefined,
                        tournament_id: tournament.id,
                        stage_id: m.stage_id,
                        local_team_id: m.local_team_id,
                        visitor_team_id: m.visitor_team_id,
                        local_source_match_id: m.local_source_match_id,
                        visitor_source_match_id: m.visitor_source_match_id,
                        // Fix: start_time in DB is timestamp with TZ, ensure valid format
                        start_time: m.start_time,
                        field: m.field,
                        status: m.status || 'scheduled',
                        location: m.location
                    })));

                if (matchError) throw matchError;
            }
            await delay(1000);

            setState(prev => ({ ...prev, savingStep: '¡Todo listo! Finalizando guardado...' }));
            await delay(500);

            setState(prev => ({ ...prev, isSaving: false, savingStep: undefined, isDirty: false, lastSaved: new Date() }));
            return tournament.id;
        } catch (error: any) {
            console.error("Error saving tournament - Full Error:", error);
            if (error.details) console.error("Error Details:", error.details);
            if (error.hint) console.error("Error Hint:", error.hint);
            if (error.message) console.error("Error Message:", error.message);
            setState(prev => ({ ...prev, isSaving: false, savingStep: undefined }));
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
            resetBuilder
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
