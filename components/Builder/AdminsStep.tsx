import React, { useState, useEffect } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { supabase } from '../../lib/supabase';
import { User, Plus, Trash2, Edit2, CheckCircle, XCircle, ChevronDown, ChevronUp, Search, Loader2, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import { TournamentAdmin } from '../../types/tournament';

export const AdminsStep = () => {
    const { admins, addAdmin, updateAdmin, removeAdmin } = useBuilder();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false); // Collapsed by default on mobile

    // Lookup States
    const [isSearching, setIsSearching] = useState(false);
    const [foundProfile, setFoundProfile] = useState<{ id: string, avatar_url?: string } | null>(null);

    // Debounced Search Effect
    useEffect(() => {
        const lookupUser = async () => {
            if (!email.trim() || !email.includes('@')) {
                setFoundProfile(null);
                return;
            }

            setIsSearching(true);
            try {
                // Search in public profiles
                // Assuming 'profiles' table has 'email' column exposed or manageable
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url')
                    .eq('email', email.trim())
                    .single();

                if (data && !error) {
                    setFoundProfile({ id: data.id, avatar_url: data.avatar_url });
                    // Auto-fill name if found
                    const foundName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
                    if (foundName) setFullName(foundName);
                } else {
                    setFoundProfile(null);
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

        addAdmin({
            id: foundProfile?.id || crypto.randomUUID(), // Use real ID if found, else random
            first_name: first,
            last_name: last,
            email: email.trim(),
            role: 'admin', // Default role
            avatar_url: foundProfile?.avatar_url // Store avatar if found
        });
        setFullName('');
        setEmail('');
        setFoundProfile(null);
        setIsFormOpen(false); // Auto-close on mobile after add
    };

    const handleEditStart = (admin: Partial<TournamentAdmin>) => {
        setIsEditing(admin.id!);
        // Need to set temp values for inputs? NO, we use direct input access or controllable inputs
        // For simplicity in this specialized list, we can just use the controlled inputs pattern or direct DOM access
        // The implementation below uses DOM access for the edit inputs
    };

    const handleUpdate = (id: string, name: string, mail: string) => {
        if (!name.trim() || !mail.trim()) return;
        const parts = name.trim().split(' ');
        const first = parts[0];
        const last = parts.slice(1).join(' ') || '';

        updateAdmin(id, {
            first_name: first,
            last_name: last,
            email: mail
        });
        setIsEditing(null);
    };

    const deleteAdmin = (id: string) => {
        if (confirm('¿Eliminar administrador?')) {
            removeAdmin(id);
        }
    };

    return (
        <div className="h-full overflow-hidden flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 h-full">

                {/* 1. Add Admin Form (Collapsible on Mobile) */}
                <div className={`lg:col-span-4 flex flex-col bg-[#1a1a20] border border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${isFormOpen ? 'max-h-[1200px] mb-2 lg:mb-0' : 'max-h-[60px] lg:max-h-none lg:h-[fit-content] mb-2 lg:mb-0'}`}>

                    {/* Header Toggle */}
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="w-full px-6 py-5 bg-gradient-to-r from-[#1a1a20] to-[#222] flex items-center justify-between lg:cursor-default"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <ShieldAlert className="text-orange-400" size={20} />
                            <span className="lg:hidden">{isFormOpen ? 'Gestión de Admins' : 'Añadir Nuevo Admin'}</span>
                            <span className="hidden lg:inline">Nuevo Administrador</span>
                        </h3>
                        <div className="lg:hidden text-white/50">
                            {isFormOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </button>

                    {/* Form Content */}
                    <div className={`px-4 pb-4 lg:px-6 lg:pb-6 space-y-5 ${isFormOpen ? 'block' : 'hidden lg:block'}`}>

                        {/* Email Input First (Logic Flow) */}
                        <div className="space-y-2">
                            <label className="text-xs text-white/50 uppercase font-bold pl-1 block tracking-wider flex items-center justify-between">
                                Correo Electrónico
                                {isSearching && <span className="text-orange-400 flex items-center gap-1 text-[10px]"><Loader2 size={10} className="animate-spin" /> Buscando...</span>}
                                {foundProfile && !isSearching && <span className="text-green-400 flex items-center gap-1 text-[10px]"><CheckCircle size={10} /> Usuario B5Tools</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    className={`w-full bg-black/40 border ${foundProfile ? 'border-green-500/50 focus:ring-green-500/50' : 'border-white/10 focus:ring-orange-500/50'} rounded-xl p-4 text-white placeholder-white/20 focus:ring-2 outline-none transition-all font-medium pl-10`}
                                    placeholder="admin@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                            </div>
                            <p className="text-[10px] text-white/30 px-1">
                                {foundProfile
                                    ? "Usuario encontrado en la base de datos. Se enviará una notificación."
                                    : "Se enviará una invitación para que se una a tu torneo como admin."
                                }
                            </p>
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
                                    className={`w-full bg-black/40 border ${foundProfile ? 'border-green-500/30 text-green-100' : 'border-white/10 text-white'} rounded-xl p-4 placeholder-white/20 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all font-medium`}
                                    placeholder="Ej: Laura Gómez"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAdd}
                            disabled={!fullName.trim() || !email.trim()}
                            className={`w-full ${foundProfile ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400'} text-white font-bold py-3 lg:py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-orange-900/20 mt-2 text-sm lg:text-base`}
                        >
                            <Plus size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="lg:hidden">{foundProfile ? 'Añadir' : 'Añadir'}</span>
                            <span className="hidden lg:inline">{foundProfile ? 'Añadir Admin Verificado' : 'Añadir Admin Invitado'}</span>
                        </button>
                    </div>
                </div>

                {/* 2. Admin List Panel */}
                <div className="lg:col-span-8 bg-[#1a1a20] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl relative">
                    <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#1a1a20] to-[#222] flex items-center justify-between sticky top-0 z-10">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <ShieldAlert className="text-orange-400" size={24} />
                            Lista de Administradores
                        </h3>
                        <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">
                            {admins?.length || 0} Admins.
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                        {(!admins || admins.length === 0) ? (
                            <div className="text-center py-20 opacity-30 flex flex-col items-center">
                                <ShieldAlert size={64} className="mb-4" />
                                <p className="text-lg font-medium">No hay administradores asignados</p>
                                <p className="text-sm mt-2">Añade usuarios para gestionar el torneo.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 lg:pb-0">
                                {admins.map((admin) => (
                                    <div
                                        key={admin.id}
                                        className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/10 hover:bg-black/30 transition-all group relative overflow-hidden"
                                    >
                                        {/* Actions */}
                                        <div className="flex items-center gap-2 absolute top-0 right-0 p-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            {isEditing === admin.id ? (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            const name = (document.getElementById(`edit-name-${admin.id}`) as HTMLInputElement).value;
                                                            const mail = (document.getElementById(`edit-email-${admin.id}`) as HTMLInputElement).value;
                                                            handleUpdate(admin.id!, name, mail);
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
                                                        onClick={() => {
                                                            // Future integration: Call Edge Function to send Magic Link
                                                            // supabase.functions.invoke('invite-admin', { body: { email: admin.email } })
                                                            alert(`Invitación Magic Link enviada a ${admin.email} (Simulación)`);
                                                        }}
                                                        className="p-2 bg-blue-500/10 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all"
                                                        title="Enviar Invitación Magic Link"
                                                    >
                                                        <LinkIcon size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditStart(admin)}
                                                        className="p-2 text-white/40 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteAdmin(admin.id!)}
                                                        className="p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Avatar & Main Info */}
                                        <div className="flex items-center gap-4">
                                            {admin.avatar_url ? (
                                                <img
                                                    src={admin.avatar_url}
                                                    alt="Avatar"
                                                    className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/10 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-lg font-bold text-white shadow-lg border border-white/10 flex-shrink-0">
                                                    {admin.first_name?.[0]}{admin.last_name?.[0]}
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 pt-1">
                                                {isEditing === admin.id ? (
                                                    <div className="space-y-2 pr-8">
                                                        <input
                                                            id={`edit-name-${admin.id}`}
                                                            defaultValue={`${admin.first_name} ${admin.last_name}`}
                                                            className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-green-500 outline-none"
                                                        />
                                                        <input
                                                            id={`edit-email-${admin.id}`}
                                                            defaultValue={admin.email}
                                                            className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white/70 focus:border-green-500 outline-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="pr-12">
                                                        <h4 className="font-bold text-white text-lg truncate leading-tight">
                                                            {admin.first_name} <span className="text-white/60">{admin.last_name}</span>
                                                        </h4>
                                                        <p className="text-xs text-white/40 truncate mt-0.5 font-mono">{admin.email}</p>

                                                        {admin.role && (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/50 uppercase tracking-wide border border-white/5">
                                                                    {admin.role === 'admin' ? 'Administrador' : 'Moderador'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
