import { supabase } from '../lib/supabase';

/**
 * Logs an activity to the tournament's activity_log
 * @param tournamentId The ID of the tournament
 * @param type Examples: 'match_start', 'match_end', 'set_start', 'set_end', 'admin_update'
 * @param message Human readable message
 * @param payload detailed data
 */
export const logTournamentActivity = async (
    tournamentId: string,
    type: string,
    message: string,
    payload: any = {}
) => {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            message,
            payload
        };

        // We use a custom RPC or raw SQL usually, but for JSONB arrays:
        // Supabase/Postgres allows generic append. 
        // Ideally we would have an RPC 'append_tournament_log', but let's try a direct read-write or simply rely on an RPC if we can make one.
        // For simplicity without RPC, we can't atomically append easily without race conditions in a simple client call efficiently on high volume, 
        // BUT for this app volume, reading current -> appending -> writing is "okay" specifically if we are the only writer or low concurrency.
        // A better approach is often a separate table 'tournament_activities' but the requirement was a JSON column in tournament table.

        // Let's implement a safe-ish read-modify-write for now.

        const { data: t, error: fetchError } = await supabase
            .from('tournaments')
            .select('activity_log')
            .eq('id', tournamentId)
            .single();

        if (fetchError) throw fetchError;

        const currentLog = t?.activity_log && Array.isArray(t.activity_log) ? t.activity_log : [];
        const newLog = [...currentLog, logEntry];

        const { error: updateError } = await supabase
            .from('tournaments')
            .update({ activity_log: newLog })
            .eq('id', tournamentId);

        if (updateError) throw updateError;

        // console.log("Activity Logged:", message);

    } catch (error) {
        console.error("Failed to log tournament activity:", error);
    }
};
