export interface Tournament {
    id: string;
    user_id: string;
    name: string;
    location: string;
    start_date: string;
    end_date: string;
    start_time: string;
    created_at: string;
    status: 'draft' | 'active' | 'completed';

    // Config
    logo_url?: string;
    organizer_name?: string;
    contact_email?: string;
    tournament_type?: 'open' | 'invitational' | 'club' | 'group_stage' | 'knockout' | 'double_elimination';
    cost_per_team?: number;
    currency?: string;
    points_for_win?: number;
    points_for_loss?: number;
    sets_per_match?: 1 | 3;
    custom_rules?: string[];
    number_of_groups?: number;
    tiebreaker_rules?: TieBreakerRule[];
    structure?: any;
    fields_config?: any;
}

export type TieBreakerType = 'direct_match' | 'run_diff' | 'runs_scored' | 'random';

export interface TieBreakerRule {
    type: TieBreakerType;
    order: number;
    active: boolean;
}

export interface TournamentStage {
    id: string;
    tournament_id: string;
    name: string;
    type: 'group' | 'bracket' | 'round_robin';
    order: number;
    bracket_size?: number;
    number_of_groups?: number;
    teams_per_group?: number;
    created_at: string;
}

export interface TournamentTeam {
    id: string;
    tournament_id: string;
    name: string;
    short_name?: string;
    logo_url?: string;
    group_name?: string; // "A"
    seed?: number;
    wins: number;
    losses: number;
    runs_scored: number;
    runs_allowed: number;
    gp?: number;
    pts?: number;
    // Calculated Stats
    stats_ab?: number;
    stats_h?: number;
    stats_r?: number;
    stats_e_def?: number;
    stats_e_of?: number;
}

export interface TournamentRoster {
    id: string;
    team_id: string;
    player_id?: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
    number?: string;
    gender?: string;
    role: 'player' | 'coach' | 'staff';
    ab?: number;
    h?: number;
    r?: number;
    rbi?: number;
    avg?: number;
}

export interface TournamentMatch {
    id: string;
    tournament_id: string;
    stage_id: string;
    visitor_team_id?: string;
    local_team_id?: string;
    visitor_source_match_id?: string; // "Winner of Match X"
    local_source_match_id?: string;
    start_time?: string;
    set_number?: string;
    field?: string;
    status: 'scheduled' | 'live' | 'finished' | 'suspended';
    winner_team_id?: string;
    score_text?: string;
    referee_id?: string;
    visitor_team?: TournamentTeam;
    local_team?: TournamentTeam;
    location?: string;
}

export interface TournamentField {
    id: string;
    tournament_id: string;
    name: string;
    start_time?: string;
    properties?: any;
}

export interface TournamentSet {
    id: string;
    match_id: string;
    set_number: number;
    visitor_runs: number;
    local_runs: number;
    visitor_hits: number;
    local_hits?: number;
    visitor_errors?: number;
    local_errors?: number;
    data?: any; // detailed stats
    status?: string;
    // Extended Score Columns
    vis_inn1?: number; vis_inn2?: number; vis_inn3?: number; vis_inn4?: number; vis_inn5?: number;
    vis_ex6?: number; vis_ex7?: number; vis_ex8?: number; vis_ex9?: number; vis_ex10?: number;
    loc_inn1?: number; loc_inn2?: number; loc_inn3?: number; loc_inn4?: number; loc_inn5?: number;
    loc_ex6?: number; loc_ex7?: number; loc_ex8?: number; loc_ex9?: number; loc_ex10?: number;
    away_score?: number; home_score?: number;
    away_hits?: number; home_hits?: number;
    away_errors?: number; home_errors?: number;
}

export interface RefereeProfile {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    level?: string;
    rating: number;
    avatar_url?: string;
}

export interface TournamentReferee {
    id: string;
    tournament_id: string;
    referee_id: string;
    role: 'umpire' | 'scorer' | 'supervisor';
    status: 'invited' | 'accepted' | 'rejected';
}

export interface TournamentAdmin {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: 'admin' | 'moderator';
    avatar_url?: string;
    permissions?: {
        general_management: boolean;
        manage_players: boolean;
        manage_standings: boolean;
        manage_schedule: boolean;
        manage_public: boolean;
        manage_results: boolean;
    };
}

export interface TournamentInscription {
    id: string;
    tournament_id: string;
    team_name: string;
    contact_name: string;
    contact_email: string;
    status: 'pending' | 'approved' | 'rejected';
    payment_status: 'paid' | 'unpaid';
    roster_data?: any;
}

export interface TournamentAccreditation {
    id: string;
    tournament_id: string;
    person_name: string;
    role: string;
    qr_code: string;
    photo_url?: string;
    access_zones?: string[];
    is_active: boolean;
}

export interface TournamentReminder {
    id: string;
    tournament_id: string;
    user_id: string;
    reminder_type: '7_days' | '3_days' | '1_day' | '1_hour';
    is_sent: boolean;
    scheduled_at: string;
    created_at: string;
}

export type ReminderType = TournamentReminder['reminder_type'];
