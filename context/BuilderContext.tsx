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
    saveTournament: () => Promise<string | null>;
    resetBuilder: () => void;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export const BuilderProvider: React.FC<{ children: ReactNode; initialId?: string }> = ({ children, initialId }) => {
    const [state, setState] = useState<BuilderState>(initialBuilderState);

    // Initial Load: Fetch Tournament Data if ID is present
    React.useEffect(() => {
        const loadInitialData = async () => {
            // Prioritize ID passed via Prop (URL), fallback to localStorage only if no prop
            const currentId = initialId || localStorage.getItem('b5_builder_current_id');

            if (currentId === 'new') {
                setState(initialBuilderState);
                return;
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
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user authenticated");

            // 0. Process Images (Teams & Players)
            // We clone state to avoid mutating UI while saving
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

            // 1. Insert/Update Tournament
            const { data: tournament, error: tError } = await supabase
                .from('tournaments')
                .upsert([{
                    ...state.config,
                    user_id: user.id,
                    status: 'draft'
                }])
                .select()
                .single();

            if (tError) throw tError;

            // 2. Save Teams
            // Note: In a real app we would use upsert with a conflict key or delete-then-insert.
            // For draft simplicity, let's assume we can upsert if we keep IDs stable.
            const { error: teamsError } = await supabase
                .from('tournament_teams')
                .upsert(teamsToSave.map(t => ({
                    id: t.id,
                    tournament_id: tournament.id,
                    name: t.name,
                    short_name: t.short_name,
                    logo_url: t.logo_url,
                    group_id: t.group_id
                })));

            if (teamsError) console.error("Error saving teams", teamsError);

            // 3. Save Rosters
            const { error: rosterError } = await supabase
                .from('tournament_rosters')
                .upsert(rostersToSave.map(r => ({
                    id: r.id,
                    tournament_id: tournament.id,
                    team_id: r.team_id,
                    first_name: r.first_name,
                    last_name: r.last_name,
                    number: r.number,
                    gender: r.gender,
                    photo_url: r.photo_url,
                    role: r.role
                })));

            if (rosterError) console.error("Error saving rosters", rosterError);


            if (rosterError) console.error("Error saving rosters", rosterError);

            // 4. Save Referees
            const { error: refError } = await supabase
                .from('tournament_referees')
                .upsert(state.referees.map(r => ({
                    id: r.id,
                    tournament_id: tournament.id,
                    first_name: r.first_name,
                    last_name: r.last_name,
                    email: r.email,
                    rating: r.rating,
                    avatar_url: r.avatar_url
                })));

            if (refError) console.error("Error saving referees", refError);

            // 5. Save Admins
            const { error: adminError } = await supabase
                .from('tournament_admins')
                .upsert(state.admins.map(a => ({
                    id: a.id,
                    tournament_id: tournament.id,
                    first_name: a.first_name,
                    last_name: a.last_name,
                    email: a.email,
                    role: a.role,
                    avatar_url: a.avatar_url
                })));

            if (adminError) console.error("Error saving admins", adminError);

            console.log("Tournament Fully Saved:", tournament.id);

            setState(prev => ({ ...prev, isDirty: false, lastSaved: new Date() }));
            return tournament.id;
        } catch (error) {
            console.error("Error saving tournament:", error);
            return null;
        }
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
