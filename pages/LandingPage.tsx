import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn, UserPlus, Zap, Check, Upload, Smartphone, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ParticlesBackground } from '../components/ParticlesBackground';
import { CustomSpinner } from '../components/CustomSpinner';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    // isLogin true = showing Front (Login), false = showing Back (Register)
    const [isLogin, setIsLogin] = useState(true);
    const [isForgot, setIsForgot] = useState(false); // New state for forgot password view

    // Page Loading State
    const [pageLoading, setPageLoading] = useState(true);

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

    useEffect(() => {
        // Simulate initial loading
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

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



    if (pageLoading) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
                <ParticlesBackground />
                <div className="relative z-10 scale-75 md:scale-100">
                    <CustomSpinner size="large" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black text-white selection:bg-purple-500 selection:text-white flex flex-col relative overflow-hidden">

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
                <LanguageSwitcher />
            </nav>

            <main className="flex-1 relative z-10 flex flex-col xl:flex-row items-center justify-center p-4 md:p-6 gap-6 md:gap-12 max-w-7xl mx-auto w-full overflow-hidden">

                {/* Hero Section - Visible on all devices, scaled for mobile */}
                <div className="flex flex-col flex-1 text-center xl:text-left space-y-4 md:space-y-6 max-w-2xl justify-center z-20 xl:mb-0 mb-4 h-auto shrink-0 md:shrink-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-medium text-purple-300 mb-0 md:mb-2 mx-auto xl:mx-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        {t('landing.hero_tag')}
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tight leading-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-indigo-200">
                            {t('landing.hero_title_1')} <br />
                        </span>
                        <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500 md:ml-2">
                            {t('landing.hero_title_2')}
                        </span>
                    </h1>

                    <p className="text-sm md:text-lg text-white/60 max-w-xl mx-auto xl:mx-0 leading-relaxed hidden md:block">
                        {t('landing.hero_desc')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center xl:justify-start">
                        <button
                            onClick={() => navigate('/anotaciongratisbeisbol5')}
                            className="group relative px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
                        >
                            <Zap className="text-yellow-500 fill-current" size={20} />
                            <span>{t('landing.cta_start')}</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* 3D Auth Card Container - Adjusted height for mobile/tablet */}
                <div className="w-full max-w-sm md:max-w-md perspective-[2000px] h-[510px] md:h-[650px] flex items-center justify-center shrink-0 z-30">
                    {/* The Flipping Card Wrapper */}
                    <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${!isLogin ? 'rotate-y-180' : ''}`}>

                        {/* --- FRONT FACE (LOGIN) --- */}
                        <div className="absolute inset-0 backface-hidden">
                            <div className="h-full bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none"></div>

                                <div className="relative z-10 flex-1 flex flex-col justify-center">
                                    <h2 className="text-3xl font-bold mb-2">{t('landing.login_welcome')}</h2>
                                    <p className="text-white/40 text-sm mb-8">{t('landing.login_subtitle')}</p>

                                    {isForgot ? (
                                        <div className="animate-in fade-in slide-in-from-right duration-300">
                                            <div className="flex items-center gap-2 mb-6">
                                                <button onClick={() => { setIsForgot(false); setError(null); setSuccessMsg(null); }} className="text-white/50 hover:text-white transition-colors">
                                                    <ArrowRight size={20} className="rotate-180" />
                                                </button>
                                                <h3 className="text-xl font-bold">{t('landing.recover_title')}</h3>
                                            </div>

                                            <p className="text-white/40 text-sm mb-6">{t('landing.recover_desc')}</p>

                                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                                <input
                                                    type="email" placeholder={t('landing.email')} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:bg-black/40 transition-all outline-none" required
                                                />
                                                {error && <div className="text-red-300 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
                                                {successMsg && <div className="text-green-300 text-xs bg-green-500/10 p-2 rounded border border-green-500/20">{successMsg}</div>}

                                                <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 active:scale-95 transition-all">
                                                    {loading ? t('landing.recover_sending') : t('landing.recover_btn')}
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
                                                <span>{t('landing.google_login')}</span>
                                            </button>

                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f0e1a] px-2 text-white/30">{t('landing.or_email')}</span></div>
                                            </div>

                                            <form onSubmit={handleLogin} className="space-y-4">
                                                <input
                                                    type="email" placeholder={t('landing.email')} value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:bg-black/40 transition-all outline-none" required
                                                />
                                                <div className="relative">
                                                    <input
                                                        type={showLoginPassword ? "text" : "password"}
                                                        placeholder={t('landing.password')}
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
                                                        {t('landing.forgot_pass')}
                                                    </button>
                                                </div>
                                                {error && <div className="text-red-300 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
                                                <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 active:scale-95 transition-all">
                                                    {loading ? t('landing.loading') : t('landing.login_btn')}
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </div>

                                <div className="mt-auto pt-6 text-center border-t border-white/10 relative z-10">
                                    <p className="text-sm text-white/50">
                                        {t('landing.no_account')} <button onClick={() => setIsLogin(false)} className="text-purple-400 hover:text-purple-300 font-bold ml-1">{t('landing.register_link')}</button>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* --- BACK FACE (REGISTER) --- */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180">
                            <div className="h-full bg-slate-900/40 backdrop-blur-xl border border-white/10 p-4 md:p-8 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none"></div>

                                <div className="relative z-10 flex-1">
                                    <h2 className="text-3xl font-bold mb-2">{t('landing.register_title')}</h2>
                                    <p className="text-white/40 text-sm mb-6">{t('landing.register_subtitle')}</p>

                                    <form onSubmit={handleRegister} className="space-y-2 md:space-y-3">
                                        {/* Names */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text" placeholder={t('landing.name')} value={firstName} onChange={e => setFirstName(e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-purple-500 outline-none" required
                                            />
                                            <input
                                                type="text" placeholder={t('landing.lastname')} value={lastName} onChange={e => setLastName(e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-purple-500 outline-none" required
                                            />
                                        </div>

                                        {/* Email */}
                                        <input
                                            type="email" placeholder={t('landing.email')} value={regEmail} onChange={e => setRegEmail(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-purple-500 outline-none" required
                                        />

                                        {/* Passwords */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="relative">
                                                <input
                                                    type={showRegPassword ? "text" : "password"} placeholder={t('landing.password')} value={regPassword} onChange={e => setRegPassword(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-purple-500 outline-none pr-8" required
                                                />
                                                <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                                                    {showRegPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"} placeholder={t('landing.confirm')} value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)}
                                                    className={`w-full bg-black/20 border ${regConfirmPassword && regPassword !== regConfirmPassword ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-3 py-2 text-white text-xs md:text-sm outline-none pr-8`} required
                                                />
                                            </div>
                                        </div>

                                        {/* Club & Logo - Condensed */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text" placeholder={t('landing.club_info')} value={clubName} onChange={e => setClubName(e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-purple-500 outline-none"
                                            />
                                            <label className="flex items-center justify-center gap-2 px-2 py-2 rounded-xl border border-dashed border-white/20 bg-white/5 cursor-pointer hover:bg-white/10">
                                                <Upload size={14} className="text-purple-400" />
                                                <span className="text-[10px] md:text-xs text-white/60 truncate max-w-[80px]">{logoFile ? logoFile.name : 'Logo'}</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                                            </label>
                                        </div>

                                        {/* Phone & Whatsapp - Condensed */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="tel" placeholder={t('landing.phone_placeholder')} value={phone} onChange={e => setPhone(e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-xs md:text-sm focus:border-purple-500 outline-none" required
                                            />
                                            <label className="flex items-center gap-2 px-2 py-2 rounded-xl border border-white/10 bg-black/20 cursor-pointer hover:bg-black/30">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${hasWhatsapp ? 'bg-green-500 border-green-500' : 'border-white/30'}`}>
                                                    {hasWhatsapp && <Check size={10} className="text-black" strokeWidth={3} />}
                                                </div>
                                                <input type="checkbox" className="hidden" checked={hasWhatsapp} onChange={e => setHasWhatsapp(e.target.checked)} />
                                                <span className="text-[10px] md:text-xs text-white/80">{t('landing.whatsapp_label')}</span>
                                            </label>
                                        </div>

                                        {error && <div className="text-red-300 text-[10px] bg-red-500/10 p-1.5 rounded">{error}</div>}
                                        {successMsg && <div className="text-green-300 text-[10px] bg-green-500/10 p-1.5 rounded">{successMsg}</div>}

                                        <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-900/40 active:scale-95 transition-all mt-2">
                                            {loading ? t('landing.loading') : t('landing.register_btn')}
                                        </button>
                                    </form>

                                    <div className="mt-4 pt-4 text-center border-t border-white/10">
                                        <p className="text-xs text-white/50">
                                            {t('landing.have_account')} <button onClick={() => setIsLogin(true)} className="text-indigo-400 font-bold ml-1">{t('landing.login_btn')}</button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </main>

            <footer className="p-6 text-center text-white/20 text-xs relative z-10">
                {t('landing.footer_rights')}
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
