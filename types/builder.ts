import { Tournament, TournamentStage, TournamentTeam, TournamentMatch, TournamentReferee, TournamentRoster, RefereeProfile, TournamentAdmin } from './tournament';

export interface BuilderState {
    config: Partial<Tournament>;
    stages: Partial<TournamentStage>[];
    teams: Partial<TournamentTeam>[];
    rosters: Partial<TournamentRoster>[]; // Added for Player Management
    matches: Partial<TournamentMatch>[];
    referees: Partial<RefereeProfile>[]; // Changed from TournamentReferee to Profile for Draft Creation
    admins: Partial<TournamentAdmin>[];

    // Wizard UI State
    currentStep: number;
    isDirty: boolean;
    lastSaved?: Date;
}

export const initialBuilderState: BuilderState = {
    config: {
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
    teams: [],
    rosters: [],
    matches: [],
    referees: [],
    admins: [],
    currentStep: 0,
    isDirty: false
};
