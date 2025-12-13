import React, { useState, useEffect } from 'react';
import { X, Trophy, MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLoading } from '../context/LoadingContext';
import { Tournament } from '../types/tournament';

interface CreateTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTournamentSaved: () => void;
    initialData?: Tournament | null;
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({ isOpen, onClose, onTournamentSaved, initialData }) => {
    const navigate = useNavigate();
    const { startLoading, stopLoading } = useLoading();
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        start_date: '',
        end_date: '',
        start_time: ''
    });
    const [error, setError] = useState<string | null>(null);

    // Reset or Populate form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    location: initialData.location,
                    start_date: initialData.start_date,
                    end_date: initialData.end_date,
                    start_time: initialData.start_time
                });
            } else {
                setFormData({
                    name: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    start_time: ''
                });
            }
            setError(null);
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!formData.name || !formData.location || !formData.start_date || !formData.end_date || !formData.start_time) {
            setError('Todos los campos son obligatorios');
            return;
        }

        try {
            startLoading();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No usuario autenticado');

            if (initialData) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('tournaments')
                    .update({
                        name: formData.name,
                        location: formData.location,
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        start_time: formData.start_time
                    })
                    .eq('id', initialData.id);

                if (updateError) throw updateError;

            } else {
                // INSERT
                const { data: newTournament, error: insertError } = await supabase
                    .from('tournaments')
                    .insert([{
                        user_id: user.id,
                        name: formData.name,
                        location: formData.location,
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        start_time: formData.start_time,
                        status: 'active'
                    }])
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Create Mode: Just close and refresh
                onTournamentSaved();
                onClose();
            }

            // Note: If Updating (Edit mode), we might just close, 
            // but currently the Edit action from list creates direct navigation anyway.
            // This modal handles Create mostly now.
            if (initialData) {
                onTournamentSaved();
                onClose();
            }

        } catch (err: any) {
            console.error('Error saving tournament:', err);
            setError(err.message || 'Error al guardar el torneo');
        } finally {
            stopLoading();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header Decoration */}
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Trophy size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white">{initialData ? 'Editar Torneo' : 'Nuevo Torneo'}</h2>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Torneo</label>
                            <div className="relative">
                                <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ej. Copa Verano 2024"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lugar / Sede</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Ej. Estadio Latinoamericano"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inicia</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Termina</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hora de Inicio</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {initialData ? 'Actualizar Torneo' : 'Guardar Torneo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
