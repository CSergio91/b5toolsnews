import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLoading } from '../context/LoadingContext';
import { Eye, EyeOff, Upload, Check, X } from 'lucide-react';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
    const { startLoading, stopLoading } = useLoading();

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [clubName, setClubName] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [phone, setPhone] = useState('');
    const [hasWhatsapp, setHasWhatsapp] = useState(false);

    // Visibility
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Feedback
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (regPassword !== regConfirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setIsLoading(true);
        startLoading(); // Global spinner too? Maybe just local for modal
        setError(null);

        try {
            // Check if email already exists using secure RPC
            const { data: emailExists, error: rpcError } = await supabase
                .rpc('check_email_exists', { email_check: regEmail });

            if (rpcError) throw rpcError;

            if (emailExists) {
                throw new Error('Este correo ya está registrado.');
            }

            // 1. Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: regEmail,
                password: regPassword,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        club_name: clubName
                    }
                }
            });

            if (authError) throw authError;

            // 2. Upload Logo if present
            let logoUrl = null;
            if (logoFile && authData.user) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${authData.user.id}/club_logo.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, logoFile);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);
                    logoUrl = publicUrl;
                }
            }

            // 3. Update Profile with additional details
            if (authData.user) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        phone: phone,
                        has_whatsapp: hasWhatsapp,
                        club_logo_url: logoUrl
                    })
                    .eq('id', authData.user.id);

                if (updateError) throw updateError;
            }

            setSuccessMsg('¡Cuenta creada! Revisa tu correo para confirmar.');

            // Clear form
            setFirstName('');
            setLastName('');
            setRegEmail('');
            setRegPassword('');
            setRegConfirmPassword('');
            setClubName('');
            setPhone('');
            setHasWhatsapp(false);
            setLogoFile(null);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            stopLoading();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Únete Gratis Hoy</h2>
                        <p className="text-sm text-slate-400">Sin tarjeta de crédito. Acceso inmediato.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {error}
                        </div>
                    )}

                    {successMsg ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">¡Bienvenido a B5Tools!</h3>
                            <p className="text-slate-300 mb-6">{successMsg}</p>
                            <button onClick={onClose} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                                Entendido
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300 ml-1">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300 ml-1">Apellido</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-300 ml-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="ejemplo@correo.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300 ml-1">Contraseña</label>
                                    <div className="relative">
                                        <input
                                            type={showRegPassword ? "text" : "password"}
                                            required
                                            value={regPassword}
                                            onChange={(e) => setRegPassword(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none pr-8"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                            onClick={() => setShowRegPassword(!showRegPassword)}
                                        >
                                            {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300 ml-1">Confirmar</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={regConfirmPassword}
                                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                                            className={`w-full px-3 py-2.5 rounded-lg bg-black/40 border text-white focus:ring-2 outline-none pr-8 ${regConfirmPassword && regPassword !== regConfirmPassword
                                                ? 'border-red-500/50 focus:ring-red-500'
                                                : 'border-white/10 focus:ring-purple-500'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Optional Fields Toggle or Just list them */}
                            <div className="pt-2 pb-1 border-b border-white/5 mb-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Opcionales</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-300 ml-1">Nombre del Club</label>
                                <input
                                    type="text"
                                    value={clubName}
                                    onChange={(e) => setClubName(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-300 ml-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-white/10 bg-black/20 cursor-pointer hover:bg-black/30 transition-colors w-full h-[42px]">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${hasWhatsapp ? 'bg-green-500 border-green-500' : 'border-white/30'}`}>
                                            {hasWhatsapp && <Check size={10} className="text-black" strokeWidth={3} />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={hasWhatsapp} onChange={e => setHasWhatsapp(e.target.checked)} />
                                        <span className="text-xs font-medium text-slate-300">Tiene WhatsApp</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-all mt-4"
                            >
                                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta Gratis'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
            {/* Styles for Modal Scrollbar */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};
