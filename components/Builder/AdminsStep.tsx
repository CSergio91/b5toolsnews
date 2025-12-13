import React, { useState, useEffect } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { supabase } from '../../lib/supabase';
import { User, Plus, Trash2, Edit2, CheckCircle, XCircle, ChevronDown, ChevronUp, Search, Loader2, Link as LinkIcon, ShieldAlert, AlertTriangle, X, Copy, Check } from 'lucide-react';
import { TournamentAdmin } from '../../types/tournament';

export const AdminsStep = () => {
    const { admins, addAdmin, updateAdmin, removeAdmin } = useBuilder();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false); // Collapsed by default on mobile
    const [permissions, setPermissions] = useState({
        general_management: false,
        manage_players: false,
        manage_standings: false,
        manage_schedule: false,
        manage_public: false,
        manage_results: false
    });

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
                    setShowEmailError(true);
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

    const handleSave = () => {
        if (!fullName.trim() || !email.trim()) return;

        const parts = fullName.trim().split(' ');
        const first = parts[0];
        const last = parts.slice(1).join(' ') || '';

        if (isEditing) {
            // UPDATE EXISTING
            updateAdmin(isEditing, {
                first_name: first,
                last_name: last,
                email: email.trim(),
                permissions: permissions
            });
            setIsEditing(null);
        } else {
            // ADD NEW
            addAdmin({
                id: foundProfile?.id || crypto.randomUUID(),
                first_name: first,
                last_name: last,
                email: email.trim(),
                role: 'admin',
                avatar_url: foundProfile?.avatar_url,
                permissions: permissions
            });
        }

        // Reset Form
        setFullName('');
        setEmail('');
        setPermissions({
            general_management: false,
            manage_players: false,
            manage_standings: false,
            manage_schedule: false,
            manage_public: false,
            manage_results: false
        });
        setFoundProfile(null);
        setIsFormOpen(false);
    };

    const handleEditStart = (admin: Partial<TournamentAdmin>) => {
        setIsEditing(admin.id!);
        // Populate Form
        setFullName(`${admin.first_name || ''} ${admin.last_name || ''}`.trim());
        setEmail(admin.email || '');
        if (admin.permissions) {
            setPermissions(admin.permissions);
        } else {
            // Reset if undefined
            setPermissions({
                general_management: false,
                manage_players: false,
                manage_standings: false,
                manage_schedule: false,
                manage_public: false,
                manage_results: false
            });
        }

        // Open Form and try to verify user again if needed (skip logic for now)
        setIsFormOpen(true);
        // Scroll to form (optional, simple logic handled by state)
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setFullName('');
        setEmail('');
        setPermissions({
            general_management: false,
            manage_players: false,
            manage_standings: false,
            manage_schedule: false,
            manage_public: false,
            manage_results: false
        });
        setFoundProfile(null);
    };

    const deleteAdmin = (id: string) => {
        if (confirm('¿Eliminar administrador?')) {
            removeAdmin(id);
        }
    };

    return (
        <div className="h-full overflow-y-auto lg:overflow-hidden flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 h-auto lg:h-full">

                {/* 1. Add Admin Form (Collapsible on Mobile) */}
                <div className={`lg:col-span-4 flex flex-col bg-[#1a1a20] border border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${isFormOpen ? 'max-h-[2000px] mb-4 lg:mb-0' : 'max-h-[60px] lg:max-h-none lg:h-[fit-content] mb-2 lg:mb-0'}`}>

                    {/* Header Toggle */}
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="w-full px-6 py-5 bg-gradient-to-r from-[#1a1a20] to-[#222] flex items-center justify-between lg:cursor-default"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <ShieldAlert className="text-orange-400" size={20} />
                            <span className="lg:hidden">{isFormOpen ? (isEditing ? 'Editar Admin' : 'Gestión de Admins') : (isEditing ? 'Editar Admin' : 'Añadir Nuevo Admin')}</span>
                            <span className="hidden lg:inline">{isEditing ? 'Editar Administrador' : 'Nuevo Administrador'}</span>
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
                                    Solo puedes añadir usuarios que ya estén registrados en <span className="font-bold text-yellow-200">B5Tools</span>.
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
                            <div className="text-[10px] text-white/30 px-1">
                                {foundProfile
                                    ? "Usuario encontrado en la base de datos. Se enviará una notificación."
                                    : (
                                        showEmailError ? (
                                            <div className="mt-2 text-red-400 space-y-2">
                                                <p>No encontramos el correo escrito. Por favor verifica que esté bien escrito.</p>
                                                <p>Si no tiene cuenta, envíale este enlace para que se registre. Una vez registrado, inténtalo de nuevo:</p>

                                                <div className="flex items-center gap-2 bg-black/40 border border-red-500/30 rounded-lg p-2 mt-1 group hover:border-red-500/50 transition-colors">
                                                    <div className="flex-1 font-mono text-blue-400 truncate text-xs select-all">
                                                        {window.location.origin}
                                                    </div>
                                                    <button
                                                        onClick={handleCopyLink}
                                                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors flex-shrink-0 relative"
                                                        title="Copiar enlace"
                                                    >
                                                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : "Se enviará una invitación para que se una a tu torneo como admin."
                                    )
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
                                    className={`w-full bg-black/40 border ${foundProfile ? 'border-green-500/30 text-green-100' : 'border-white/10 text-white'} rounded-xl p-4 placeholder-white/20 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all font-medium`}
                                    placeholder="Ej: Laura Gómez"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Permissions Toggles */}
                        <div className="space-y-3 pt-2 border-t border-white/5">
                            <label className="text-xs text-white/50 uppercase font-bold pl-1 block tracking-wider">Permisos de Acceso</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { key: 'general_management', label: 'Gestión General' },
                                    { key: 'manage_players', label: 'Gestionar Jugadores' },
                                    { key: 'manage_standings', label: 'Gestionar Clasificación' },
                                    { key: 'manage_schedule', label: 'Gestionar Programa' },
                                    { key: 'manage_public', label: 'Gestionar Público' },
                                    { key: 'manage_results', label: 'Gestionar Resultados' }
                                ].map((perm) => (
                                    <div key={perm.key} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                        <span className="text-sm text-slate-300">{perm.label}</span>
                                        <button
                                            onClick={() => setPermissions(prev => ({ ...prev, [perm.key]: !prev[perm.key as keyof typeof permissions] }))}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${permissions[perm.key as keyof typeof permissions] ? 'bg-green-500' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${permissions[perm.key as keyof typeof permissions] ? 'left-6' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={handleSave}
                                disabled={!fullName.trim() || !email.trim()}
                                className={`flex-1 ${foundProfile ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400'} text-white font-bold py-3 lg:py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-orange-900/20 text-sm lg:text-base`}
                            >
                                <Plus size={20} className={`group-hover:scale-110 transition-transform ${isEditing ? 'rotate-0' : ''}`} />
                                <span className="lg:hidden">{isEditing ? 'Actualizar' : 'Añadir'}</span>
                                <span className="hidden lg:inline">{isEditing ? 'Actualizar Permisos' : (foundProfile ? 'Añadir Admin Verificado' : 'Añadir Admin Invitado')}</span>
                            </button>

                            {isEditing && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                                    title="Cancelar Edición"
                                >
                                    <XCircle size={20} />
                                </button>
                            )}
                        </div>
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
                                                <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-[10px] animate-pulse border border-yellow-500/30 font-bold uppercase tracking-wider">
                                                    Editando...
                                                </span>
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

                                                    {/* Permissions Display */}
                                                    {admin.permissions && (
                                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                                            {admin.permissions.general_management && <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30">General</span>}
                                                            {admin.permissions.manage_players && <span className="px-1.5 py-0.5 rounded text-[9px] bg-green-500/20 text-green-300 border border-green-500/30">Jugadores</span>}
                                                            {admin.permissions.manage_standings && <span className="px-1.5 py-0.5 rounded text-[9px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Clasificación</span>}
                                                            {admin.permissions.manage_schedule && <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30">Programa</span>}
                                                            {admin.permissions.manage_public && <span className="px-1.5 py-0.5 rounded text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/30">Público</span>}
                                                            {admin.permissions.manage_results && <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-500/20 text-orange-300 border border-orange-500/30">Resultados</span>}
                                                        </div>
                                                    )}
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
        </div >
    );
};
