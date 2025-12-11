import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, PlayCircle, Bell, Loader2 } from 'lucide-react';
import { Tournament, ReminderType, TournamentReminder } from '../types/tournament';
import { supabase } from '../lib/supabase';
import { useLoading } from '../context/LoadingContext';

interface TournamentCardProps {
    tournament: Tournament;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
    const [reminders, setReminders] = useState<ReminderType[]>([]);
    const [loadingReminders, setLoadingReminders] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchReminders();
    }, [tournament.id]);

    const fetchReminders = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('tournament_reminders')
            .select('reminder_type')
            .eq('tournament_id', tournament.id)
            .eq('user_id', user.id);

        if (data) {
            setReminders(data.map((r: any) => r.reminder_type));
        }
    };

    const toggleReminder = async (type: ReminderType) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setLoadingReminders(prev => ({ ...prev, [type]: true }));

        try {
            const isSet = reminders.includes(type);

            if (isSet) {
                // Delete reminder
                await supabase
                    .from('tournament_reminders')
                    .delete()
                    .eq('tournament_id', tournament.id)
                    .eq('user_id', user.id)
                    .eq('reminder_type', type);

                setReminders(prev => prev.filter(r => r !== type));
            } else {
                // Create reminder
                // Calculate scheduled_at roughly based on type relative to start_date
                // This is a simplification; a real backend would calculate precise execution time
                let scheduledAt = new Date(tournament.start_date + 'T' + tournament.start_time);

                if (type === '7_days') scheduledAt.setDate(scheduledAt.getDate() - 7);
                if (type === '3_days') scheduledAt.setDate(scheduledAt.getDate() - 3);
                if (type === '1_day') scheduledAt.setDate(scheduledAt.getDate() - 1);
                if (type === '1_hour') scheduledAt.setHours(scheduledAt.getHours() - 1);

                const { error } = await supabase
                    .from('tournament_reminders')
                    .insert([{
                        tournament_id: tournament.id,
                        user_id: user.id,
                        reminder_type: type,
                        scheduled_at: scheduledAt.toISOString()
                    }]);

                if (error) throw error;
                setReminders(prev => [...prev, type]);
            }
        } catch (error) {
            console.error('Error toggling reminder', error);
        } finally {
            setLoadingReminders(prev => ({ ...prev, [type]: false }));
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    const formatTime = (timeStr: string) => {
        return timeStr.substring(0, 5);
    };

    return (
        <div className="w-full bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group">
            {/* Top Bar with Status Color */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{tournament.name}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <MapPin size={14} />
                            <span>{tournament.location}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        <Calendar size={14} className="text-orange-400" />
                        <span className="text-sm font-medium text-slate-200">
                            {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        <Clock size={14} className="text-blue-400" />
                        <span className="text-sm font-medium text-slate-200">
                            {formatTime(tournament.start_time)}
                        </span>
                    </div>
                </div>

                <button className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mb-6">
                    <PlayCircle size={18} />
                    Generar Torneo
                </button>

                {/* Reminders Section */}
                <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        <Bell size={12} />
                        Recordatorios
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {(['7_days', '3_days', '1_day', '1_hour'] as ReminderType[]).map((type) => {
                            const labels = { '7_days': '1 sem', '3_days': '3 días', '1_day': '1 día', '1_hour': '1 hora' };
                            const isActive = reminders.includes(type);
                            const isLoading = loadingReminders[type];

                            return (
                                <button
                                    key={type}
                                    onClick={() => toggleReminder(type)}
                                    disabled={isLoading}
                                    className={`
                                        px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1
                                        ${isActive
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'}
                                    `}
                                >
                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                                    {isLoading ? <Loader2 size={10} className="animate-spin" /> : labels[type]}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
