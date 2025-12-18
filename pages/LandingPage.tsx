import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Check, Upload, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ParticlesBackground } from '../components/ParticlesBackground';
import { CustomSpinner } from '../components/CustomSpinner';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    
    // View Mode: Controls the animation choreography
    // 'login': Auth Card Right, Info Left
    // 'register': Auth Card Left, Info Right (flipped)
    // 'forgot': Auth Card Center (flipped/slide)
    const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');

    // Page Loading
    const [pageLoading, setPageLoading] = useState(true);

    // Auth Form State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [forgotEmail, setForgotEmail] = useState('');
    
    // Register Form State
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [clubName, setClubName] = useState('');
    const [phone, setPhone] = useState('');
    const [hasWhatsapp, setHasWhatsapp] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // Visible Password Toggles
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Feedback
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setPageLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    // --- Actions ---

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/dashboard` }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(null);
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
        setLoading(true); setError(null); setSuccessMsg(null);
        try {
             // 1. Check if email exists in DB
            const { data: emailExists, error: rpcError } = await supabase.rpc('check_email_exists', { email_check: forgotEmail });
            if (rpcError) throw rpcError;
            if (!emailExists) throw new Error('Este correo no está registrado.');

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
        setLoading(true); setError(null);
        
        if (regPassword !== regConfirmPassword) {
            setError('Las contraseñas no coinciden.');
            setLoading(false); return;
        }

        try {
            const { data: emailExists, error: rpcError } = await supabase.rpc('check_email_exists', { email_check: regEmail });
            if (rpcError) throw rpcError;
            if (emailExists) throw new Error('Este correo ya está registrado. Por favor inicia sesión.');

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
                        logo_url: '' // Future upload logic
                    }
                }
            });
            if (error) throw error;
            setSuccessMsg('¡Registro exitoso! Por favor revisa tu correo para confirmar.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Scroll Helper for Portrait Mode
    const scrollToAuth = () => {
        document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (pageLoading) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
                <ParticlesBackground />
                <div className="relative z-10 scale-75 md:scale-100"><CustomSpinner size="large" /></div>
            </div>
        );
    }

    // --- Dynamic Classes for Logic ---

    // Auth Section Positioning (Landscape)
    const getAuthLandscapeClass = () => {
        switch (viewMode) {
            case 'login': return 'landscape:left-[50%] landscape:translate-x-0'; // Right Half
            case 'register': return 'landscape:left-0 landscape:translate-x-0'; // Left Half
            case 'forgot': return 'landscape:left-[25%]'; // Center (assuming w-1/2) -> Visual Center
            default: return 'landscape:left-[50%]';
        }
    };

    // Info Section Positioning (Landscape)
    const getInfoLandscapeClass = () => {
         switch (viewMode) {
            case 'login': return 'landscape:left-0 landscape:opacity-100'; // Left Half
            case 'register': return 'landscape:left-[50%] landscape:opacity-100'; // Right Half
            case 'forgot': return 'landscape:left-0 landscape:opacity-20 pointer-events-none'; // Folded back
            default: return 'landscape:left-0';
        }       
    };

    return (
        <div className="h-[100dvh] w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black text-white relative overflow-hidden">
            <ParticlesBackground />
            
            {/* === FIXED NAVBAR === */}
            {/* Kept outside the scroll/snap wrapper so it never moves */}
            <nav className="absolute top-0 left-0 w-full z-50 p-4 md:p-6 flex items-center justify-between shrink-0 pointer-events-none">
                {/* Pointer events auto so buttons work, but nav background doesn't block clicks if transparent */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    <img src="/logo.png" alt="B5Tools Logo" className="h-10 md:h-12 w-auto shadow-lg rounded-full" />
                    <span className="font-bold text-xl tracking-tight drop-shadow-md">B5Tools</span>
                </div>
                <div className="pointer-events-auto">
                    <LanguageSwitcher />
                </div>
            </nav>

            {/* Main Wrapper: Flex for Desktop, Snap for Portrait Mobile, Relative for Landscape Mobile */}
            <div className="
                w-full h-full relative
                xl:flex xl:flex-row xl:items-center xl:justify-center xl:gap-12 xl:p-6
                snap-y snap-mandatory overflow-y-auto scroll-smooth
                landscape:snap-none landscape:overflow-hidden
            ">

                {/* === INFO SECTION === */}
                <section className={`
                    /* Base & Transitions */
                    flex flex-col p-6 text-center xl:text-left transition-all duration-700 ease-in-out z-20
                    
                    /* Desktop (XL) */
                    xl:w-1/2 xl:relative xl:h-auto xl:opacity-100 xl:translate-x-0 xl:left-auto xl:justify-center

                    /* Mobile Portrait */
                    w-full h-[100dvh] snap-start shrink-0 relative justify-center items-center pt-20 /* Padding Top for Navbar */

                    /* Mobile Landscape (Absolute) */
                    landscape:absolute landscape:top-0 landscape:h-full landscape:w-1/2 landscape:justify-center landscape:items-center landscape:pt-0
                    
                    /* Dynamic State */
                    ${getInfoLandscapeClass()}
                `}>
                    
                    <div className="max-w-xl mx-auto xl:mx-0 flex flex-col items-center xl:items-start mt-4 md:mt-12 xl:mt-0">
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                            {t('landing.hero_tag')}
                        </div>

                         <h1 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tight leading-tight mb-4 md:mb-6">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-indigo-200">
                                {t('landing.hero_title_1')}
                            </span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
                                {t('landing.hero_title_2')}
                            </span>
                        </h1>

                        <p className="text-sm md:text-lg text-white/60 leading-relaxed mb-8 max-w-lg">
                            {t('landing.hero_desc')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <button
                                onClick={() => navigate('/anotaciongratisbeisbol5')}
                                className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
                            >
                                <Zap className="text-yellow-500 fill-current" size={20} />
                                <span>{t('landing.cta_start')}</span>
                            </button>
                            
                            {/* Mobile Portrait Only Button to Scroll Down */}
                            <button 
                                onClick={() => {
                                    setViewMode('register');
                                    scrollToAuth();
                                }}
                                className="px-8 py-3 bg-white/10 border border-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all xl:hidden landscape:hidden"
                            >
                                Login / Registro <ArrowRight className="inline ml-2 rotate-90" size={16} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* === AUTH SECTION === */}
                <section id="auth-section" className={`
                    /* Base */
                    flex items-center justify-center p-4 transition-all duration-700 ease-in-out z-30
                    
                    /* Desktop (XL) */
                    xl:w-1/2 xl:relative xl:h-[650px] xl:translate-x-0 xl:left-auto

                    /* Mobile Portrait */
                    w-full h-[100dvh] snap-start shrink-0 relative

                    /* Mobile Landscape (Absolute) */
                    landscape:absolute landscape:top-0 landscape:h-full landscape:w-1/2
                    
                    /* Dynamic State */
                    ${getAuthLandscapeClass()}
                `}>
                    {/* 3D Card Wrapper */}
                    <div className="w-full max-w-sm md:max-w-md h-[500px] md:h-[600px] perspective-[2000px]">
                        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d
                            ${viewMode === 'register' ? 'rotate-y-180' : ''}
                        `}>

                            {/* --- FRONT FACE (LOGIN) --- */}
                            <div className="absolute inset-0 backface-hidden">
                                <div className="h-full bg-slate-900/40 backdrop-blur-xl border border-white/10 px-6 py-6 md:px-8 md:py-8 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none"></div>

                                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                                        
                                        {/* View: Forgot Password */}
                                        {viewMode === 'forgot' ? (
                                             <div className="animate-in fade-in slide-in-from-right duration-500">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <button onClick={() => { setViewMode('login'); setError(null); }} className="text-white/50 hover:text-white transition-colors">
                                                        <ArrowRight size={20} className="rotate-180" />
                                                    </button>
                                                    <h3 className="text-xl font-bold">{t('landing.recover_title')}</h3>
                                                </div>
                                                <p className="text-white/40 text-sm mb-6">{t('landing.recover_desc')}</p>
                                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                                    <input type="email" placeholder={t('landing.email')} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-all outline-none" required />
                                                    {error && <div className="text-red-300 text-xs bg-red-500/10 p-2 rounded">{error}</div>}
                                                    {successMsg && <div className="text-green-300 text-xs bg-green-500/10 p-2 rounded">{successMsg}</div>}
                                                    <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">{loading ? '...' : t('landing.recover_btn')}</button>
                                                </form>
                                            </div>
                                        ) : (
                                            /* View: Login Form */
                                            <div className="animate-in fade-in duration-500">
                                                <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('landing.login_welcome')}</h2>
                                                <p className="text-white/40 text-sm mb-6">{t('landing.login_subtitle')}</p>

                                                <button onClick={handleGoogleLogin} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 mb-6 shadow-lg">
                                                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                                    <span>{t('landing.google_login')}</span>
                                                </button>

                                                <div className="relative mb-6">
                                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f0e1a] px-2 text-white/30">{t('landing.or_email')}</span></div>
                                                </div>

                                                <form onSubmit={handleLogin} className="space-y-4">
                                                    <input type="email" placeholder={t('landing.email')} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-all outline-none" required />
                                                    <div className="relative">
                                                        <input type={showLoginPassword ? "text" : "password"} placeholder={t('landing.password')} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-all outline-none pr-10" required />
                                                        <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">{showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <button type="button" onClick={() => setViewMode('forgot')} className="text-xs text-purple-400 hover:text-purple-300">{t('landing.forgot_pass')}</button>
                                                    </div>
                                                    {error && <div className="text-red-300 text-xs bg-red-500/10 p-2 rounded">{error}</div>}
                                                    <button type="submit" disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">{loading ? '...' : t('landing.login_btn')}</button>
                                                </form>
                                                
                                                <div className="mt-6 pt-4 text-center border-t border-white/10">
                                                    <p className="text-sm text-white/50">
                                                        {t('landing.no_account')} <button onClick={() => setViewMode('register')} className="text-purple-400 hover:text-purple-300 font-bold ml-1">{t('landing.register_link')}</button>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* --- BACK FACE (REGISTER) --- */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180">
                                <div className="h-full bg-slate-900/40 backdrop-blur-xl border border-white/10 px-4 py-4 md:px-8 md:py-8 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/10 to-transparent pointer-events-none"></div>

                                    <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('landing.register_title')}</h2>
                                        <p className="text-white/40 text-sm mb-6">{t('landing.register_subtitle')}</p>

                                        <form onSubmit={handleRegister} className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" placeholder={t('landing.name')} value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-purple-500 outline-none" required />
                                                <input type="text" placeholder={t('landing.lastname')} value={lastName} onChange={e => setLastName(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-purple-500 outline-none" required />
                                            </div>
                                            <input type="email" placeholder={t('landing.email')} value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-purple-500 outline-none" required />
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="relative">
                                                     <input type={showRegPassword ? "text" : "password"} placeholder={t('landing.password')} value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-purple-500 outline-none pr-8" required />
                                                     <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"><Eye size={12} /></button>
                                                </div>
                                                <input type={showConfirmPassword ? "text" : "password"} placeholder={t('landing.confirm')} value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-purple-500 outline-none" required />
                                            </div>
                                            
                                            <input type="text" placeholder={t('landing.club_info')} value={clubName} onChange={e => setClubName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-purple-500 outline-none" />
                                            <input type="tel" placeholder={t('landing.phone_placeholder')} value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-purple-500 outline-none" required />

                                            {error && <div className="text-red-300 text-xs bg-red-500/10 p-2 rounded">{error}</div>}
                                            {successMsg && <div className="text-green-300 text-xs bg-green-500/10 p-2 rounded">{successMsg}</div>}
                                            
                                            <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all mt-2">{loading ? '...' : t('landing.register_btn')}</button>
                                        </form>

                                        <div className="mt-4 pt-4 text-center border-t border-white/10">
                                            <p className="text-sm text-white/50">
                                                {t('landing.have_account')} <button onClick={() => setViewMode('login')} className="text-indigo-400 font-bold ml-1">{t('landing.login_btn')}</button>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </div>
            
            <style>{`
                .perspective-[2000px] { perspective: 2000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .rotate-y-0 { transform: rotateY(0deg); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};
