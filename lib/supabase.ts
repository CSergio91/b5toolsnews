
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase Environment Variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export const checkConnection = async () => {
    try {
        const { error } = await supabase.from('cualquier_tabla_existente_o_health_check').select('count', { count: 'exact', head: true });
        // Even if table doesn't exist, we get a response, checking if we can reach Supabase.
        // A better check is usually auth or just a simple query if we know the schema.
        // For now, let's just check if we can make a call without a network error.

        // Actually, just checking session is a good proxy for "can talk to auth service"
        const { data, error: authError } = await supabase.auth.getSession()
        if (authError) throw authError

        return true
    } catch (error) {
        console.error('Supabase connection check failed:', error)
        return false
    }
}
