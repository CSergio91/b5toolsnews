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
