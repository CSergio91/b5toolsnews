import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn, UserPlus, Zap, Check, Upload, Smartphone, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ParticlesBackground } from '../components/ParticlesBackground';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    // isLogin true = showing Front (Login), false = showing Back (Register)
    const [isLogin, setIsLogin] = useState(true);
    const [isForgot, setIsForgot] = useState(false); // New state for forgot password view

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');

    // Register State
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [clubName, setClubName] = useState('');
    const [phone, setPhone] = useState('');
    const [hasWhatsapp, setHasWhatsapp] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // Visibility State
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
            if (error) throw error;
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            // 1. Check if email exists in DB
            // 1. Check if email exists in DB using secure RPC
            const { data: emailExists, error: rpcError } = await supabase
                .rpc('check_email_exists', { email_check: forgotEmail });

            if (rpcError) throw rpcError;

            // Strict check: if email doesn't exist, user not found
            if (!emailExists) {
                throw new Error('Este correo no está registrado.');
            }

            // 2. Send Reset Email
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                redirectTo: `${window.location.origin}/dashboard?reset=true`,
            });
            if (error) throw error;

            setSuccessMsg('Correo de recuperación enviado. Revisa tu bandeja de entrada.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (regPassword !== regConfirmPassword) {
            setError('Las contraseñas no coinciden.');
            setLoading(false);
            return;
        }

        try {
            // Check if email already exists using secure RPC
            const { data: emailExists, error: rpcError } = await supabase
                .rpc('check_email_exists', { email_check: regEmail });

            if (rpcError) throw rpcError;

            if (emailExists) {
                throw new Error('Este correo ya está registrado. Por favor inicia sesión.');
            }

            // Upload logic would go here if buckets were set up
            let logoUrl = '';

            const { error } = await supabase.auth.signUp({
                email: regEmail,
                password: regPassword,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        club_name: clubName,
                        phone: phone,
                        has_whatsapp: hasWhatsapp,
                        logo_url: logoUrl
                    }
                }
            });
            if (error) throw error;
            setSuccessMsg('¡Registro exitoso! Por favor revisa tu correo para confirmar.');
            // Optionally flip back to login or stay here
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black text-white selection:bg-purple-500 selection:text-white flex flex-col relative overflow-hidden">

            {/* Background FX */}
            <ParticlesBackground />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
            </div>

            <nav className="relative z-20 w-full p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="B5Tools Logo" className="h-10 w-auto" />
                    <span className="font-bold text-xl tracking-tight">B5Tools</span>
                </div>
            </nav>

            <main className="flex-1 relative z-10 flex flex-col xl:flex-row items-center justify-center p-6 gap-12 max-w-7xl mx-auto w-full">

                {/* Hero Section */}
                <div className="flex-1 text-center xl:text-left space-y-6 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-2 mx-auto xl:mx-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        La Herramienta del Momento para Beisbol Five
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-indigo-200">
                            Lleva tu juego
                        </span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
                            al siguiente nivel.
                        </span>
                    </h1>

                    <p className="text-lg text-white/60 max-w-xl mx-auto xl:mx-0 leading-relaxed">
                        La plataforma oficial de anotación para Beisbol Five. Gestiona torneos, estadísticas y comparte resultados en tiempo real con una interfaz premium.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center xl:justify-start">
                        <button
                            onClick={() => navigate('/anotaciongratisbeisbol5')}
                            className="group relative px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
                        >
                            <Zap className="text-yellow-500 fill-current" size={20} />
                            <span>Empezar Gratis</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* 3D Auth Card Container */}
                <div className="w-full max-w-md perspective-[2000px] h-[650px] flex items-center justify-center">
                    {/* The Flipping Card Wrapper */}
                    <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${!isLogin ? 'rotate-y-180' : ''}`}>

                        {/* --- FRONT FACE (LOGIN) --- */}
                        <div className="absolute inset-0 backface-hidden">
                            <div className="h-full bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none"></div>

                                <div className="relative z-10 flex-1 flex flex-col justify-center">
                                    <h2 className="text-3xl font-bold mb-2">Bienvenido</h2>
                                    <p className="text-white/40 text-sm mb-8">Inicia sesión para continuar.</p>

                                    {isForgot ? (
                                        <div className="animate-in fade-in slide-in-from-right duration-300">
                                            <div className="flex items-center gap-2 mb-6">
                                                <button onClick={() => { setIsForgot(false); setError(null); setSuccessMsg(null); }} className="text-white/50 hover:text-white transition-colors">
                                                    <ArrowRight size={20} className="rotate-180" />
                                                </button>
                                                <h3 className="text-xl font-bold">Recuperar Contraseña</h3>
                                            </div>

                                            <p className="text-white/40 text-sm mb-6">Ingresa tu correo para recibir un enlace de recuperación.</p>

                                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                                <input
                                                    type="email" placeholder="Correo Electrónico" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:bg-black/40 transition-all outline-none" required
                                                />
                                                {error && <div className="text-red-300 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
                                                {successMsg && <div className="text-green-300 text-xs bg-green-500/10 p-2 rounded border border-green-500/20">{successMsg}</div>}

                                                <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 active:scale-95 transition-all">
                                                    {loading ? 'Enviando...' : 'Enviar Correo'}
                                                </button>
                                            </form>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleGoogleLogin}
                                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 mb-6"
                                            >
                                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                                <span>Continuar con Google</span>
                                            </button>

                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f0e1a] px-2 text-white/30">O con correo</span></div>
                                            </div>

                                            <form onSubmit={handleLogin} className="space-y-4">
                                                <input
                                                    type="email" placeholder="Correo Electrónico" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:bg-black/40 transition-all outline-none" required
                                                />
                                                <div className="relative">
                                                    <input
                                                        type={showLoginPassword ? "text" : "password"}
                                                        placeholder="Contraseña"
                                                        value={loginPassword}
                                                        onChange={e => setLoginPassword(e.target.value)}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:bg-black/40 transition-all outline-none pr-10" required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                                    >
                                                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                                <div className="flex justify-end">
                                                    <button type="button" onClick={() => setIsForgot(true)} className="text-xs text-purple-400 hover:text-purple-300">
                                                        ¿Olvidaste tu contraseña?
                                                    </button>
                                                </div>
                                                {error && <div className="text-red-300 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
                                                <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 active:scale-95 transition-all">
                                                    {loading ? 'Cargando...' : 'Iniciar Sesión'}
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </div>

                                <div className="mt-auto pt-6 text-center border-t border-white/10 relative z-10">
                                    <p className="text-sm text-white/50">
                                        ¿No tienes cuenta? <button onClick={() => setIsLogin(false)} className="text-purple-400 hover:text-purple-300 font-bold ml-1">Regístrate Gratis</button>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* --- BACK FACE (REGISTER) --- */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180">
                            <div className="h-full bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col overflow-y-auto custom-scrollbar relative">
                                <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none"></div>

                                <div className="relative z-10 flex-1">
                                    <h2 className="text-3xl font-bold mb-2">Crear Cuenta</h2>
                                    <p className="text-white/40 text-sm mb-6">Únete a B5Tools hoy.</p>

                                    <form onSubmit={handleRegister} className="space-y-3">
                                        {/* Name Loop */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text" placeholder="Nombre" value={firstName} onChange={e => setFirstName(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:bg-black/40 outline-none transition-all" required
                                            />
                                            <input
                                                type="text" placeholder="Apellidos" value={lastName} onChange={e => setLastName(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:bg-black/40 outline-none transition-all" required
                                            />
                                        </div>
                                        <input
                                            type="email" placeholder="Correo Electrónico" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:bg-black/40 outline-none transition-all" required
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <input
                                                    type={showRegPassword ? "text" : "password"}
                                                    placeholder="Contraseña"
                                                    value={regPassword}
                                                    onChange={e => setRegPassword(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:bg-black/40 outline-none transition-all pr-10" required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRegPassword(!showRegPassword)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                                >
                                                    {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirmar"
                                                    value={regConfirmPassword}
                                                    onChange={e => setRegConfirmPassword(e.target.value)}
                                                    className={`w-full bg-black/20 border ${regConfirmPassword && regPassword !== regConfirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-purple-500'} rounded-xl px-4 py-2.5 text-white text-sm focus:bg-black/40 outline-none transition-all pr-10`} required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        {regConfirmPassword && regPassword !== regConfirmPassword && (
                                            <div className="text-[10px] text-red-300 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 -mt-2 animate-pulse">
                                                Las contraseñas no coinciden
                                            </div>
                                        )}

                                        {/* Club Info */}
                                        <div className="space-y-3 pt-2">
                                            <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Información del Club (Opcional)</p>
                                            <input
                                                type="text" placeholder="Nombre del Club" value={clubName} onChange={e => setClubName(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:bg-black/40 outline-none transition-all"
                                            />

                                            <div className="flex items-center gap-3">
                                                <label className="flex-1 cursor-pointer group">
                                                    <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 bg-white/5 group-hover:bg-white/10 transition-colors">
                                                        <Upload size={16} className="text-purple-400" />
                                                        <span className="text-xs text-white/60 truncate">{logoFile ? logoFile.name : 'Subir Logo'}</span>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Contact */}
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="flex flex-col">
                                                <input
                                                    type="tel" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-t-xl rounded-b-md px-4 py-2.5 text-white text-sm focus:border-purple-500 focus:bg-black/40 outline-none transition-all" required
                                                />
                                                <span className="text-[10px] text-white/40 px-2 py-0.5 bg-white/5 rounded-b-xl border-x border-b border-white/5">
                                                    Ej: +34 600123456 (Incluir prefijo)
                                                </span>
                                            </div>
                                            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-white/10 bg-black/20 cursor-pointer hover:bg-black/30 transition-colors">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasWhatsapp ? 'bg-green-500 border-green-500' : 'border-white/30'}`}>
                                                    {hasWhatsapp && <Check size={12} className="text-black" strokeWidth={3} />}
                                                </div>
                                                <input type="checkbox" className="hidden" checked={hasWhatsapp} onChange={e => setHasWhatsapp(e.target.checked)} />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white/80">WhatsApp</span>
                                                    <span className="text-[9px] text-white/40 leading-none">Disponible</span>
                                                </div>
                                            </label>
                                        </div>

                                        {error && <div className="text-red-300 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
                                        {successMsg && <div className="text-green-300 text-xs bg-green-500/10 p-2 rounded border border-green-500/20">{successMsg}</div>}

                                        <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/40 active:scale-95 transition-all mt-4">
                                            {loading ? 'Creando...' : 'Registrarme'}
                                        </button>
                                    </form>
                                </div>

                                <div className="mt-8 pt-6 text-center border-t border-white/10 relative z-10">
                                    <p className="text-sm text-white/50">
                                        ¿Ya tienes cuenta? <button onClick={() => setIsLogin(true)} className="text-indigo-400 hover:text-indigo-300 font-bold ml-1">Inicia Sesión</button>
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </main>

            <footer className="p-6 text-center text-white/20 text-xs relative z-10">
                &copy; 2025 B5Tools. Desarrollada por B5Tools Development Team. Todos los derechos reservados.
            </footer>

            {/* 3D Styles Injection */}
            <style>{`
        .perspective-[2000px] { perspective: 2000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        /* Custom scrollbar for register form if it gets too long */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
        </div>
    );
};
