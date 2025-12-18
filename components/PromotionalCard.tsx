import React, { useState, useEffect } from 'react';
import { X, Zap, RotateCcw, Eye, EyeOff, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PromotionalCardProps {
    isVisible: boolean;
    onClose: () => void;
}

export const PromotionalCard: React.FC<PromotionalCardProps> = ({ isVisible, onClose }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [showRegPassword, setShowRegPassword] = useState(false);

    // Feedback
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Animation mount/unmount logic
    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
        } else {
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsFlipped(false); // Reset flip on close
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (regPassword !== regConfirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check if email exists
            const { data: emailExists, error: rpcError } = await supabase
                .rpc('check_email_exists', { email_check: regEmail });

            if (rpcError) throw rpcError;
            if (emailExists) throw new Error('Este correo ya está registrado.');

            // Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: regEmail,
                password: regPassword,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: { first_name: firstName, last_name: lastName }
                }
            });

            if (authError) throw authError;

            // Handle success
            setSuccessMsg('Revisa tu correo para verificar la cuenta. Luego inicia sesión y ve a "Juego Rápido" para continuar tu partido.');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed bottom-0 md:bottom-6 right-0 md:right-6 z-[9999] w-full md:w-[360px] perspective-1000 transition-all duration-500 ease-out transform ${isVisible ? 'translate-y-0 md:translate-x-0 opacity-100' : 'translate-y-[120%] md:translate-x-[120%] opacity-0'}`}
        >
            {/* Card Container with 3D Transform */}
            <div className={`relative w-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* === FRONT FACE === */}
                <div className="relative w-full bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden backface-hidden">
                    {/* Decorative Blurs */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/20 rounded-full blur-[50px] pointer-events-none"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none"></div>

                    <div className="relative p-5">
                        <button onClick={onClose} className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors z-20 bg-black/20 hover:bg-black/50 rounded-full p-1">
                            <X size={16} />
                        </button>

                        {/* Image */}
                        <div className="mb-4 rounded-xl overflow-hidden aspect-[16/9] relative shadow-lg group border border-white/5">
                            <img src="/assets/b5tools_promo_card.png" alt="B5Tools Premium" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>

                            {/* Floating Badge */}
                            <div className="absolute bottom-3 left-3 flex flex-col items-start gap-1">
                                <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">
                                    Gratis
                                </span>
                            </div>
                        </div>

                        {/* Copy */}
                        <div className="space-y-1 mb-5">
                            <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                                Registrate y Gestiona tu Club
                            </h3>
                            <p className="text-sm text-gray-400 font-medium">
                                Crea tu Primer Torneo Ahora con B5Tools.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-900/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 group"
                            >
                                <Zap size={16} className="fill-current group-hover:scale-110 transition-transform" />
                                Registrate Gratis
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl text-xs font-semibold active:scale-95 transition-colors"
                            >
                                Ahora no
                            </button>
                        </div>
                    </div>
                </div>

                {/* === BACK FACE (FORM) === */}
                <div className="absolute top-0 left-0 w-full h-full md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden backface-hidden rotate-y-180 flex flex-col">
                    {/* Background Image on Back */}
                    <div className="absolute inset-0 z-0">
                        <img src="/assets/b5tools_promo_card.png" alt="Background" className="w-full h-full object-cover opacity-40 blur-[2px]" />
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
                    </div>

                    {/* Header Back */}
                    <div className="relative z-10 px-4 py-3 flex justify-between items-center border-b border-white/10 bg-black/20 shrink-0">
                        <button onClick={() => setIsFlipped(false)} className="text-teal-400 hover:text-teal-300 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors">
                            <RotateCcw size={12} /> Volver
                        </button>
                        <button onClick={onClose} className="text-white/40 hover:text-white"><X size={16} /></button>
                    </div>

                    {/* Compact Form */}
                    <div className="relative z-10 p-4 flex-1 flex flex-col justify-center">
                        {successMsg ? (
                            <div className="text-center">
                                <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-in zoom-in duration-300">
                                    <Check size={24} />
                                </div>
                                <h3 className="text-base font-bold text-white mb-1">¡Todo listo!</h3>
                                <p className="text-[10px] text-slate-300 mb-4 px-2">{successMsg}</p>
                                <button onClick={onClose} className="w-full py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-gray-100 text-xs transition-colors">Entendido</button>
                            </div>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-2">
                                {error && (
                                    <div className="p-2 rounded bg-red-500/40 border border-red-500/50 text-white text-[10px] font-medium text-center animate-in slide-in-from-top-1">
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <input type="text" placeholder="Nombre" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:ring-1 focus:ring-teal-500 outline-none placeholder:text-white/40 transition-all hover:bg-black/40 focus:bg-black/50" />
                                    <input type="text" placeholder="Apellido" required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:ring-1 focus:ring-teal-500 outline-none placeholder:text-white/40 transition-all hover:bg-black/40 focus:bg-black/50" />
                                </div>

                                <input type="email" placeholder="Email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:ring-1 focus:ring-teal-500 outline-none placeholder:text-white/40 transition-all hover:bg-black/40 focus:bg-black/50" />

                                <div className="relative">
                                    <input type={showRegPassword ? "text" : "password"} placeholder="Contraseña" required value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:ring-1 focus:ring-teal-500 outline-none pr-8 placeholder:text-white/40 transition-all hover:bg-black/40 focus:bg-black/50" />
                                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1" onClick={() => setShowRegPassword(!showRegPassword)}>
                                        {showRegPassword ? <EyeOff size={10} /> : <Eye size={10} />}
                                    </button>
                                </div>

                                <input type={showRegPassword ? "text" : "password"} placeholder="Confirmar" required value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} className={`w-full px-3 py-2 rounded-lg bg-black/30 border text-white text-xs focus:ring-1 outline-none placeholder:text-white/40 transition-all hover:bg-black/40 focus:bg-black/50 ${regConfirmPassword && regPassword !== regConfirmPassword ? 'border-red-500/50 focus:ring-red-500' : 'border-white/10 focus:ring-teal-500'}`} />

                                <button type="submit" disabled={isLoading} className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all disabled:opacity-50 hover:brightness-110 border border-white/10">
                                    {isLoading ? '...' : 'CREAR CUENTA GRATIS'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Global Styles for 3D & Scrollbar */}
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                
                /* Custom scrollbar for form area */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};
