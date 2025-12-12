import { Tournament, TournamentStage, TournamentTeam, TournamentMatch, TournamentReferee, TournamentRoster } from './tournament';

export interface BuilderState {
    config: Partial<Tournament>;
    stages: Partial<TournamentStage>[];
    teams: Partial<TournamentTeam>[];
    rosters: Partial<TournamentRoster>[]; // Added for Player Management
    matches: Partial<TournamentMatch>[];
    referees: Partial<TournamentReferee>[];

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
    matches: [],
    referees: [],
    currentStep: 0,
    isDirty: false
};
