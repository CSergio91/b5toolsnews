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
    location?: string;
    field?: string;
    status: 'scheduled' | 'live' | 'finished' | 'suspended';
    winner_team_id?: string;
    score_text?: string;
}

export interface TournamentSet {
    id: string;
    match_id: string;
    set_number: number;
    visitor_runs: number;
    local_runs: number;
    visitor_hits: number;
    local_hits: number;
    visitor_errors: number;
    local_errors: number;
    data?: any; // detailed stats
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
