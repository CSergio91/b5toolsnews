import { Tournament, TournamentStage, TournamentTeam, TournamentMatch, TournamentReferee, TournamentRoster, RefereeProfile, TournamentAdmin } from './tournament';
import { TournamentStructure } from './structure';

export interface BuilderState {
    config: Partial<Tournament>;
    stages: Partial<TournamentStage>[];
    teams: Partial<TournamentTeam>[];
    rosters: Partial<TournamentRoster>[]; // Added for Player Management
    matches: Partial<TournamentMatch>[];
    referees: Partial<RefereeProfile>[]; // Changed from TournamentReferee to Profile for Draft Creation
    admins: Partial<TournamentAdmin>[];
    structure?: TournamentStructure;

    // Wizard UI State
    currentStep: number;
    isDirty: boolean;
    isSaving?: boolean;
    savingStep?: string;
    lastSaved?: Date;
}

export const initialBuilderState: BuilderState = {
    config: {
        name: 'Nuevo Torneo',
        location: 'Por definir',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        start_time: '09:00:00',
        tournament_type: 'open',
        sets_per_match: 3,
        points_for_win: 3,
        points_for_loss: 0,
        currency: 'USD',
        cost_per_team: 0
    },
    stages: [],
    teams: [],
    rosters: [],
    matches: [],
    referees: [],
    admins: [],
    currentStep: 0,
    isDirty: false
};
