import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, PlayCircle, Bell, Loader2, Pencil, Trash2, Trophy, MonitorPlay, Timer } from 'lucide-react';
import { Tournament, ReminderType } from '../types/tournament';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';

const TournamentCountdown = ({ startDate, startTime }: { startDate: string, startTime?: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const start = new Date(`${startDate}T${startTime || '00:00'}`);
            const now = new Date();
            const difference = start.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft(null);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [startDate, startTime]);

    if (!timeLeft) return null;

    return (
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-bold text-blue-400 animate-pulse">
            <Timer size={10} />
            <span>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
        </div>
    );
};

interface TournamentCardProps {
    tournament: Tournament;
    onEdit: (tournament: Tournament) => void;
    onDelete: (id: string, name: string) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [reminders, setReminders] = useState<ReminderType[]>([]);
    const [loadingReminders, setLoadingReminders] = useState<Record<string, boolean>>({});
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

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
                await supabase
                    .from('tournament_reminders')
                    .delete()
                    .eq('tournament_id', tournament.id)
                    .eq('user_id', user.id)
                    .eq('reminder_type', type);

                setReminders(prev => prev.filter(r => r !== type));
            } else {
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

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Sin fecha';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Fecha inválida';
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        } catch (e) {
            return 'Error de fecha';
        }
    };

    const formatTime = (timeStr: string | null | undefined) => {
        if (!timeStr) return '';
        try {
            return timeStr.substring(0, 5);
        } catch (e) {
            return '';
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const { error } = await supabase
                .from('tournaments')
                .update({ status: 'active' })
                .eq('id', tournament.id);

            if (error) throw error;

            addToast(`¡Felicidades! Has creado el Torneo ${tournament.name} con éxito.`, 'success');
            // Small delay to let the toast be seen before reload
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            addToast(`Error al publicar: ${error.message}`, 'error');
        } finally {
            setIsPublishing(false);
            setIsPublishModalOpen(false);
        }
    };

    return (
        <div className="w-full bg-slate-900/50 border border-white/10 rounded-lg overflow-hidden hover:border-blue-500/30 transition-all group relative">
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>

            <div className="absolute top-2 right-2 flex flex-col items-end gap-1 transition-opacity z-20">
                <TournamentCountdown startDate={tournament.start_date} startTime={tournament.start_time} />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onDelete(tournament.id, tournament.name)}
                        className="p-1 rounded bg-slate-800/80 backdrop-blur-sm hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-white/5 hover:border-red-500/30 transition-all"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
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

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(tournament)}
                            className="w-10 h-8 flex items-center justify-center bg-slate-800 hover:bg-blue-500/20 hover:text-blue-300 text-slate-400 border border-white/5 rounded-lg active:scale-95 transition-all shadow-lg"
                            title="Editar información básica"
                        >
                            <Pencil size={14} />
                        </button>

                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (tournament.status === 'draft') {
                                    setIsPublishModalOpen(true);
                                } else {
                                    navigate(`/dashboard/torneos/B5ToolsBuilder/${tournament.id}`);
                                }
                            }}
                            className={`flex-1 py-1.5 font-bold rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 text-[10px] ${tournament.status === 'draft'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
                                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-orange-500/20'
                                }`}
                        >
                            {tournament.status === 'draft' ? <Trophy size={11} className="text-yellow-400" /> : <PlayCircle size={14} />}
                            {tournament.status === 'draft' ? 'Publicar Ahora' : 'B5 Builder'}
                        </button>

                        <div className="flex gap-0.5 ml-auto">
                            {(['7_days', '3_days', '1_day'] as ReminderType[]).map((type) => {
                                const labels = { '7_days': '7d', '3_days': '3d', '1_day': '1d', '1_hour': '1h' };
                                const isActive = reminders.includes(type);
                                const isLoading = loadingReminders[type];

                                return (
                                    <button
                                        key={type}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleReminder(type);
                                        }}
                                        disabled={isLoading}
                                        title={`Recordar ${labels[type]} antes`}
                                        className={`relative w-6 h-6 rounded border transition-all flex items-center justify-center ${isActive
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                            : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                                            }`}
                                    >
                                        {isLoading ? <Loader2 size={8} className="animate-spin" /> : <Bell size={10} className={isActive ? 'fill-blue-300' : ''} />}
                                        {isActive && <span className="absolute top-0 right-0 w-1 h-1 bg-blue-400 rounded-full"></span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {tournament.status === 'active' && (
                        <button
                            onClick={() => {
                                navigate(`/dashboard/torneos/${tournament.id}/Start`);
                            }}
                            className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border border-green-500/20 hover:border-green-500/50 text-white font-bold rounded-lg active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 text-[11px] group/start"
                        >
                            <PlayCircle size={16} className="group-hover/start:scale-110 transition-transform" />
                            Comenzar Torneo
                        </button>
                    )}

                    {tournament.status === 'draft' && (
                        <button
                            onClick={() => {
                                navigate(`/dashboard/torneos/B5ToolsBuilder/${tournament.id}`);
                            }}
                            className="w-full py-2 bg-gradient-to-r from-[#1a1a20] to-[#252530] hover:from-[#252530] hover:to-[#2a2a35] border border-orange-500/20 hover:border-orange-500/50 text-orange-400 font-bold rounded-lg active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 text-[11px] group/btn"
                        >
                            <MonitorPlay size={16} className="group-hover/btn:scale-110 transition-transform" />
                            Editar con B5ToolsBuilder
                        </button>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={isPublishModalOpen}
                onClose={() => setIsPublishModalOpen(false)}
                onConfirm={handlePublish}
                title="Publicar Torneo"
                message={`¿Estás seguro de que deseas publicar el torneo "${tournament.name}"? Una vez publicado, dejará de ser un borrador y estará disponible para la gestión oficial.`}
                confirmText={isPublishing ? "Publicando..." : "Publicar Ahora"}
                variant="info"
            />
        </div>
    );
};
