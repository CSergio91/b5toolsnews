import React, { useState, useEffect } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { supabase } from '../../lib/supabase';
import { User, Plus, Trash2, Edit2, CheckCircle, XCircle, ChevronDown, ChevronUp, Search, Loader2, Link as LinkIcon, AlertTriangle, X, Copy, Check } from 'lucide-react';
import { RefereeProfile } from '../../types/tournament';
import { useToast } from '../../context/ToastContext';

export const RefereesStep = () => {
    const { referees, addReferee, updateReferee, removeReferee, sendInvitation } = useBuilder();
    const { addToast } = useToast();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false); // Collapsed by default on mobile

    // Lookup States
    const [isSearching, setIsSearching] = useState(false);
    const [foundProfile, setFoundProfile] = useState<{ id: string, avatar_url?: string } | null>(null);
    const [showEmailError, setShowEmailError] = useState(false);
    const [showWarning, setShowWarning] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.origin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Debounced Search Effect
    useEffect(() => {
        const lookupUser = async () => {
            if (!email.trim() || !email.includes('@')) {
                setFoundProfile(null);
                setShowEmailError(false);
                return;
            }

            setIsSearching(true);
            setShowEmailError(false);
            try {
                // 1. Search in referee_profiles (Existing Referee Database)
                const { data: refData, error: refError } = await supabase
                    .from('referee_profiles')
                    .select('*')
                    .eq('email', email.trim())
                    .maybeSingle(); // Use maybeSingle to avoid 406 if multiple (shouldn't happen) or 0

                if (refData) {
                    // Start: Found in referee_profiles
                    setFoundProfile({ id: refData.id, avatar_url: undefined, source: 'profile' });
                    setFullName(`${refData.first_name || ''} ${refData.last_name || ''}`.trim());
                    // End: Found in referee_profiles
                } else {
                    // 2. Search via Secure RPC to bypass RLS (Registered Users)
                    const { data, error } = await supabase
                        .rpc('search_users_by_email', { query_email: email.trim() });

                    if (data && !error && data.length > 0) {
                        const profile = data[0];
                        setFoundProfile({ id: profile.id, avatar_url: profile.avatar_url, source: 'user' });
                        // Auto-fill name if found
                        const foundName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                        if (foundName) setFullName(foundName);
                    } else {
                        setFoundProfile(null);
                        setShowEmailError(true);
                    }
                }
            } catch (err) {
                console.error("Error looking up user:", err);
                setFoundProfile(null);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(lookupUser, 600);
        return () => clearTimeout(timeoutId);
    }, [email]);

    const handleAdd = () => {
        if (!fullName.trim() || !email.trim()) return;

        // Simple name parsing
        const parts = fullName.trim().split(' ');
        const first = parts[0];
        const last = parts.slice(1).join(' ') || '';

        const newId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2) + Date.now().toString(36);

        try {
            addReferee({
                id: foundProfile?.id || newId, // Use real ID if found, else random
                first_name: first,
                last_name: last,
                email: email.trim(),
                rating: 0,
                avatar_url: foundProfile?.avatar_url // Store avatar if found
            });
        } catch (e: any) {
            alert("Error in addReferee: " + e.message);
            return;
        }

        // Send Invitation if manual entry (User not found) OR if requested by user logic
        if (!foundProfile) {
            sendInvitation(email.trim(), 'referee')
                .then(() => addToast('Invitación enviada por correo', 'success'))
                .catch((err) => {
                    console.error("Invitation Error:", err);
                    addToast('Error enviando invitación', 'error');
                });
        } else {
            // "Si existe... notificaras"
            addToast('Usuario añadido. Recibirá una notificación.', 'info');
        }

        setFullName('');
        setEmail('');
        setFoundProfile(null);
        setIsFormOpen(false); // Auto-close on mobile after add
    };

    const handleUpdate = (id: string, newName: string, newEmail: string) => {
        const parts = newName.trim().split(' ');
        const first = parts[0];
        const last = parts.slice(1).join(' ') || '';

        updateReferee(id, {
            first_name: first,
            last_name: last,
            email: newEmail.trim()
        });
        setIsEditing(null);
    };

    const handleEditStart = (referee: Partial<RefereeProfile>) => {
        if (!referee.id) return;
        setIsEditing(referee.id);
    };

    const deleteReferee = (id: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este árbitro?')) {
            removeReferee(id);
            addToast('Árbitro eliminado', 'success');
        }
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in overflow-hidden">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4 lg:mb-6 flex-shrink-0">
                Gestión de Árbitros
            </h2>

            {/* Content Container - Fixed height, no window scroll */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-8 h-full min-h-0">

                {/* 1. Add Referee Form - Mobile Collapsible */}
                <div className={`bg-[#1a1a20] rounded-2xl border border-white/10 shadow-lg flex-shrink-0 lg:h-min lg:sticky lg:top-0 transition-all duration-300 ${isFormOpen ? 'mb-4' : 'mb-0 lg:mb-0'}`}>
                    {/* Header / Toggle */}
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="w-full p-4 lg:p-6 flex items-center justify-between text-left lg:cursor-default"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <User className="text-blue-400" size={20} />
                            <span className="lg:hidden">{isFormOpen ? 'Gestión de Árbitros' : 'Añadir Nuevo Árbitro'}</span>
                            <span className="hidden lg:inline">Nuevo Árbitro</span>
                        </h3>
                        <div className="lg:hidden text-white/50">
                            {isFormOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </button>

                    {/* Form Content */}
                    <div className={`px-4 pb-4 lg:px-6 lg:pb-6 space-y-5 ${isFormOpen ? 'block' : 'hidden lg:block'}`}>

                        {/* Warning Box */}
                        {showWarning && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-3 relative animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                                <p className="text-xs text-yellow-200/80 pr-4">
                                    Puedes añadir usuarios usando el correo aunque no este registrado, se enviara un correo para unirse a <span className="font-bold text-yellow-200">B5Tools</span>, asegurate que el correo sea correcto.
                                </p>
                                <button
                                    onClick={() => setShowWarning(false)}
                                    className="absolute top-2 right-2 text-yellow-500/50 hover:text-yellow-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Email Input First (Logic Flow) */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/50 uppercase font-bold pl-1 block tracking-wider flex items-center justify-between">
                                Correo Electrónico
                                {isSearching && <span className="text-blue-400 flex items-center gap-1 text-[10px]"><Loader2 size={10} className="animate-spin" /> Buscando...</span>}
                                {foundProfile && !isSearching && <span className="text-green-400 flex items-center gap-1 text-[10px]"><CheckCircle size={10} /> Usuario B5Tools</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    className={`w-full bg-black/40 border ${foundProfile ? 'border-green-500/50 focus:ring-green-500/50' : 'border-white/10 focus:ring-blue-500/50'} rounded-xl p-4 text-white placeholder-white/20 focus:ring-2 outline-none transition-all font-medium pl-10`}
                                    placeholder="ejemplo@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                            </div>
                            <div className="text-[10px] text-white/30 px-1">
                                {foundProfile
                                    ? "Usuario encontrado en la base de datos. Se enviará una notificación."
                                    : "Se enviará una invitación para que se una a tu torneo como Arbitro."
                                }
                            </div>
                        </div>

                        {/* Name Input (Auto-filled) */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/50 uppercase font-bold pl-1 block tracking-wider">Nombre Completo</label>
                            <div className="flex gap-2">
                                {/* Avatar Preview if Found */}
                                {foundProfile && (
                                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-green-500/30 flex-shrink-0 overflow-hidden relative">
                                        {foundProfile.avatar_url ? (
                                            <img src={foundProfile.avatar_url} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-green-900/20 text-green-400 font-bold">
                                                {fullName[0]}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl"></div>
                                    </div>
                                )}

                                <input
                                    type="text"
                                    className={`w-full bg-black/40 border ${foundProfile ? 'border-green-500/30 text-green-100' : 'border-white/10 text-white'} rounded-xl p-4 placeholder-white/20 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-medium`}
                                    placeholder="Ej: Juan Pérez"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                // Optional: Disable if found? User requested "auto-fill", usually editable is better in case of typos in DB
                                // readOnly={!!foundProfile} 
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAdd}
                            disabled={!fullName.trim() || !email.trim()}
                            className={`w-full ${foundProfile ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'} text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-blue-900/20 mt-2`}
                        >
                            <Plus size={20} className="group-hover:scale-110 transition-transform" />
                            {foundProfile ? 'Añadir Usuario Verificado' : 'Añadir Árbitro Invitado'}
                        </button>
                    </div>
                </div>

                {/* 2. Referees List - Scrollable Area */}
                <div className="lg:col-span-2 flex flex-col min-h-0 bg-[#1a1a20] rounded-2xl border border-white/10 shadow-xl overflow-hidden h-full">
                    {/* List Header */}
                    <div className="p-4 lg:p-6 border-b border-white/5 bg-[#1a1a20]/50 backdrop-blur-sm z-10 flex-shrink-0">
                        <h3 className="text-lg font-bold text-white flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <User className="text-purple-400" size={20} /> Lista de Árbitros
                                <span className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded-full">{referees.length}</span>
                            </span>
                        </h3>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 space-y-4">
                        {referees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-white/30 border-2 border-dashed border-white/5 rounded-xl bg-black/20 min-h-[200px]">
                                <User size={48} className="mb-4 opacity-30" />
                                <p className="text-sm font-medium">No hay árbitros añadidos aún.</p>
                                <p className="text-xs text-white/20 mt-1">Pulsa en "Añadir Nuevo" para empezar.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 lg:pb-0">
                                {referees.map((ref) => (
                                    <div
                                        key={ref.id}
                                        className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/10 hover:bg-black/30 transition-all group relative overflow-hidden"
                                    >
                                        {/* Actions */}
                                        <div className="flex items-center gap-2 absolute top-0 right-0 p-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            {isEditing === ref.id ? (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            const name = (document.getElementById(`edit-name-${ref.id}`) as HTMLInputElement).value;
                                                            const mail = (document.getElementById(`edit-email-${ref.id}`) as HTMLInputElement).value;
                                                            handleUpdate(ref.id!, name, mail);
                                                        }}
                                                        className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors border border-transparent hover:border-green-500/30"
                                                        title="Guardar"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditing(null)}
                                                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                                        title="Cancelar"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={async () => {
                                                            if (!ref.email) return addToast("Este árbitro no tiene email", "error");

                                                            const loadingToast = addToast("Iniciando envío...", "info"); // Optional: if you have a loading mechanism

                                                            try {
                                                                await sendInvitation(ref.email, 'referee');
                                                                addToast(`Invitación enviada a ${ref.email}`, 'success');
                                                            } catch (error: any) {
                                                                addToast(`Error: ${error.message}`, 'error');
                                                            }
                                                        }}
                                                        className="p-2 bg-blue-500/10 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all border border-transparent hover:border-blue-500/30"
                                                        title="Enviar Invitación Magic Link"
                                                    >
                                                        <LinkIcon size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditStart(ref)}
                                                        className="p-2 text-white/40 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteReferee(ref.id!)}
                                                        className="p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>      {/* Avatar & Main Info */}
                                        <div className="flex items-center gap-4">
                                            {ref.avatar_url ? (
                                                <img
                                                    src={ref.avatar_url}
                                                    alt="Avatar"
                                                    className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/10 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg border border-white/10 flex-shrink-0">
                                                    {ref.first_name?.[0]}{ref.last_name?.[0]}
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 pt-1">
                                                {isEditing === ref.id ? (
                                                    <div className="space-y-2 pr-8">
                                                        <input
                                                            className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                                            defaultValue={`${ref.first_name} ${ref.last_name}`}
                                                            id={`edit-name-${ref.id}`}
                                                            placeholder="Nombre"
                                                        />
                                                        <input
                                                            className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-xs text-white/80 focus:ring-1 focus:ring-blue-500 outline-none"
                                                            defaultValue={ref.email}
                                                            id={`edit-email-${ref.id}`}
                                                            placeholder="Email"
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="font-bold text-white text-lg truncate pr-14 leading-tight">{ref.first_name} {ref.last_name}</div>
                                                        <div className="text-sm text-white/40 truncate mt-0.5">{ref.email || 'Sin correo'}</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer / Status */}
                                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                                    Invitado
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
