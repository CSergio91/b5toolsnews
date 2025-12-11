import React, { useState, useEffect } from 'react';
import { X, Camera, Lock, User, Mail, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, userEmail }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setMsg(null);
            setAvatarFile(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePasswordReset = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
                redirectTo: `${window.location.origin}/dashboard` // Or a specific reset page
            });
            if (error) throw error;
            setMsg({ type: 'success', text: 'Se ha enviado un correo para restablecer tu contraseña.' });
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setLoading(true);
        setMsg(null);
        try {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update User Metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            setMsg({ type: 'success', text: 'Foto de perfil actualizada correctamente.' });
            // Ideally trigger a refresh in parent, but for now just show success
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message || 'Error al subir la imagen.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#0f0e1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                    <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'general' ? 'border-purple-500 text-purple-400 bg-white/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'security' ? 'border-purple-500 text-purple-400 bg-white/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        Seguridad
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {msg && (
                        <div className={`mb-4 p-3 rounded-xl text-sm border ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                            {msg.text}
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-4 py-4">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 border-2 border-dashed border-white/20 overflow-hidden">
                                        {avatarFile ? (
                                            <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={40} />
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-500 transition-colors shadow-lg">
                                        <Camera size={14} className="text-white" />
                                        <input type="file" className="hidden" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-white">{userEmail}</p>
                                    <p className="text-xs text-white/40">Cambiar foto de perfil</p>
                                </div>
                                {avatarFile && (
                                    <button
                                        onClick={handleAvatarUpload}
                                        disabled={loading}
                                        className="px-4 py-2 bg-purple-600 rounded-lg text-xs font-bold text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Subiendo...' : 'Guardar Nueva Foto'}
                                    </button>
                                )}
                            </div>

                            {/* Placeholder for Name/Club editing */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="opacity-50 pointer-events-none">
                                    <label className="block text-xs font-medium text-white/40 mb-1">Nombre Mostrado</label>
                                    <input type="text" value="Usuario" disabled className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white/60 text-sm" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1">Contraseña</h3>
                                        <p className="text-xs text-white/50 mb-4 leading-relaxed">
                                            Te enviaremos un enlace a tu correo electrónico ({userEmail}) para que puedas establecer una nueva contraseña segura.
                                        </p>
                                        <button
                                            onClick={handlePasswordReset}
                                            disabled={loading}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Mail size={14} />
                                            {loading ? 'Enviando...' : 'Enviar correo de cambio'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
