import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, Lock, User, Check, Eye, EyeOff, Upload } from 'lucide-react';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Profile Data
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [clubName, setClubName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Password Data
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadProfile();
        } else {
            // Reset state on close
            setSuccess(null);
            setError(null);
            setNewPassword('');
            setConfirmPassword('');
            setAvatarFile(null);
        }
    }, [isOpen]);

    const loadProfile = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setEmail(user.email || '');
            // Get data from profile table
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setFirstName(profile.first_name || '');
                setLastName(profile.last_name || '');
                setClubName(profile.club_name || '');
                setAvatarUrl(profile.avatar_url || user.user_metadata.avatar_url || null);
            } else {
                // Fallback to meta data if profile empty (legacy)
                setFirstName(user.user_metadata.first_name || '');
                setLastName(user.user_metadata.last_name || '');
                setClubName(user.user_metadata.club_name || '');
                setAvatarUrl(user.user_metadata.avatar_url || null);
            }
        }
        setLoading(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            let finalAvatarUrl = avatarUrl;

            // 1. Upload Avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                finalAvatarUrl = publicUrl;
            }

            const updates: any = {
                first_name: firstName,
                last_name: lastName,
                club_name: clubName,
                avatar_url: finalAvatarUrl,
                updated_at: new Date()
            };

            // 2. Update Profile Table
            const { error: profileError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 3. Update Auth Metadata
            await supabase.auth.updateUser({
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    club_name: clubName,
                    avatar_url: finalAvatarUrl
                }
            });

            // 4. Update Password if provided
            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    throw new Error('Las contraseñas no coinciden.');
                }
                if (newPassword.length < 6) {
                    throw new Error('La contraseña debe tener al menos 6 caracteres.');
                }

                const { error: pwdError } = await supabase.auth.updateUser({
                    password: newPassword
                });

                if (pwdError) throw pwdError;
            }

            setSuccess('Perfil actualizado correctamente.');
            window.dispatchEvent(new Event('subscription-updated')); // Trigger navbar refresh

            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-[#1a1a20] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <User className="text-purple-400" size={24} />
                    Editar Perfil
                </h2>

                <form onSubmit={handleUpdate} className="space-y-4">

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative w-24 h-24 rounded-full bg-indigo-600/30 border-2 border-white/10 flex items-center justify-center overflow-hidden group cursor-pointer mb-2">
                            {avatarFile ? (
                                <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                            ) : avatarUrl ? (
                                <img src={avatarUrl} alt="Current" className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="text-indigo-400" />
                            )}

                            <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload size={20} className="text-white mb-1" />
                                <span className="text-[9px] text-white font-bold uppercase tracking-wider">Cambiar</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setAvatarFile(e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-white/90">{email}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Cuenta de Usuario</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-white/50 uppercase block mb-1">Nombre</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:bg-black/30 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-white/50 uppercase block mb-1">Apellidos</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:bg-black/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-white/50 uppercase block mb-1">Nombre del Club</label>
                        <input
                            type="text"
                            value={clubName}
                            onChange={e => setClubName(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:bg-black/30 outline-none transition-all"
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
                            <Lock size={14} className="text-indigo-400" /> Cambiar Contraseña
                        </h3>
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nueva Contraseña"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:bg-black/30 outline-none transition-all pr-10"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            {newPassword && (
                                <input
                                    type="password"
                                    placeholder="Confirmar Contraseña"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className={`w-full bg-black/20 border ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:bg-black/30 outline-none transition-all`}
                                />
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-200 text-xs flex items-center gap-2">
                            <Check size={14} /> {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Save size={18} /> Guardar Cambios</>}
                    </button>

                </form>
            </div>
        </div>
    );
};
