import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, PlayCircle, Bell, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Tournament, ReminderType } from '../types/tournament';
import { supabase } from '../lib/supabase';

interface TournamentCardProps {
    tournament: Tournament;
    onEdit: (tournament: Tournament) => void;
    onDelete: (id: string, name: string) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onEdit, onDelete }) => {
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
                let scheduledAt = new Date(tournament.start_date + 'T' + (tournament.start_time || '00:00'));

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
        if (!timeStr) return '';
        return timeStr.substring(0, 5);
    };

    return (
        <div className="w-full bg-slate-900/50 border border-white/10 rounded-lg overflow-hidden hover:border-blue-500/30 transition-all group relative">
            {/* Top Bar with Status Color */}
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>

            {/* Admin Controls - Absolute Positioned */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                    onClick={() => onEdit(tournament)}
                    className="p-1 rounded bg-slate-800 hover:bg-blue-500/20 hover:text-blue-300 text-slate-400 border border-white/5 hover:border-blue-500/30 transition-all"
                >
                    <Pencil size={10} />
                </button>
                <button
                    onClick={() => onDelete(tournament.id, tournament.name)}
                    className="p-1 rounded bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-white/5 hover:border-red-500/30 transition-all"
                >
                    <Trash2 size={10} />
                </button>
            </div>

            <div className="p-3">
                <div className="flex justify-between items-start mb-1.5 pr-12">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-0.5 group-hover:text-blue-400 transition-colors leading-tight truncate max-w-[200px]">{tournament.name}</h3>
                        <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                            <MapPin size={10} />
                            <span className="truncate max-w-[150px]">{tournament.location}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        <Calendar size={10} className="text-orange-400" />
                        <span className="text-[10px] font-medium text-slate-200">
                            {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                        </span>
                    </div>
                    {tournament.start_time && (
                        <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                            <Clock size={10} className="text-blue-400" />
                            <span className="text-[10px] font-medium text-slate-200">
                                {formatTime(tournament.start_time)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex-1 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-1 text-[10px]">
                        <PlayCircle size={12} />
                        Generar
                    </button>

                    {/* Reminders - Compact */}
                    <div className="flex gap-0.5">
                        {(['7_days', '3_days', '1_day'] as ReminderType[]).map((type) => {
                            const labels = { '7_days': '7d', '3_days': '3d', '1_day': '1d', '1_hour': '1h' };
                            const isActive = reminders.includes(type);
                            const isLoading = loadingReminders[type];

                            return (
                                <button
                                    key={type}
                                    onClick={() => toggleReminder(type)}
                                    disabled={isLoading}
                                    title={`Recordar ${labels[type]} antes`}
                                    className={`relative
                                        w-6 h-6 rounded border transition-all flex items-center justify-center
                                        ${isActive
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                            : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'}
                                    `}
                                >
                                    {isLoading ? <Loader2 size={8} className="animate-spin" /> : <Bell size={10} className={isActive ? 'fill-blue-300' : ''} />}
                                    {isActive && <span className="absolute top-0 right-0 w-1 h-1 bg-blue-400 rounded-full"></span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
