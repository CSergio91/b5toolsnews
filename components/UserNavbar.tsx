import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, ChevronDown, Award, Settings, Users,
    Trophy, PlayCircle, LogOut, LayoutDashboard, Video
} from 'lucide-react';
import { supabase } from '../lib/supabase';

import { EditProfileModal } from './EditProfileModal';
import { SubscriptionModal } from './SubscriptionModal';
import { FeatureComingSoonModal } from './FeatureComingSoonModal';


interface UserNavbarProps {
    showGameControls?: boolean;
}

export const UserNavbar: React.FC<UserNavbarProps> = ({ showGameControls = false }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const [userEmail, setUserEmail] = useState<string>('Usuario');
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [subscriptionTier, setSubscriptionTier] = useState<string>('basic');

    const fetchSubscription = async (userId: string) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', userId)
            .single();

        if (profile?.subscription_tier) {
            setSubscriptionTier(profile.subscription_tier);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        // Fetch user info
        supabase.auth.getUser().then(async ({ data }) => {
            if (data.user) {
                const { user_metadata, email } = data.user;
                if (user_metadata?.first_name) {
                    setUserEmail(user_metadata.first_name); // Show first name
                } else if (email) {
                    setUserEmail(email.split('@')[0]); // Fallback to email username
                }

                if (user_metadata?.avatar_url) {
                    setUserAvatar(user_metadata.avatar_url);
                }

                // Initial fetch
                fetchSubscription(data.user.id);
            }
        });

        // Listen for manual updates
        const handleSubscriptionUpdate = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) fetchSubscription(user.id);
        };
        window.addEventListener('subscription-updated', handleSubscriptionUpdate);

        // Listen for auth changes to update avatar real-time if possible (basic implementation)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const { user_metadata, email } = session.user;
                if (user_metadata?.first_name) {
                    setUserEmail(user_metadata.first_name);
                } else if (email) {
                    setUserEmail(email.split('@')[0]);
                }

                if (user_metadata?.avatar_url) {
                    setUserAvatar(user_metadata.avatar_url);
                }

                // Also fetch subscription on auth change
                fetchSubscription(session.user.id);
            }

            if (event === 'PASSWORD_RECOVERY') {
                setIsProfileModalOpen(true);
            }
        });

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
            subscription.unsubscribe();
        };
    }, []);

    // Track scroll for sticky behavior
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const isPremium = subscriptionTier === 'pro' || subscriptionTier === 'ultra';
    const isUltra = subscriptionTier === 'ultra';

    const handleFeatureClick = (featureName: string) => {
        // Special restriction for Live Stream
        if (featureName === 'Transmitir en Vivo') {
            if (!isUltra) {
                setIsSubscriptionModalOpen(true);
                return;
            }
        }

        if (!isPremium) {
            setIsSubscriptionModalOpen(true);
        } else {
            setSelectedFeature(featureName);
            setIsComingSoonModalOpen(true);
        }
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl transition-all duration-300 ${isScrolled ? 'py-2 px-6 shadow-lg shadow-black/20' : 'py-4 px-6'}`}>
                {/* Logo Section */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <img src="/logo.png" alt="B5Tools Logo" className={`w-auto transition-all duration-300 ${isScrolled ? 'h-6' : 'h-8'}`} />
                    <span className={`font-bold tracking-tight text-white transition-all duration-300 ${isScrolled ? 'text-base' : 'text-lg'}`}>B5Tools</span>
                </div>

                {/* User Section */}
                <div className="flex items-center gap-4" ref={menuRef}>

                    {/* Game Controls (Minimized Cards) */}
                    {showGameControls && (
                        <div className="hidden lg:flex items-center gap-2 mr-4">
                            <button
                                onClick={() => handleFeatureClick('Administrar Club')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-600/30 transition-colors text-xs font-medium"
                            >
                                <Users size={14} />
                                <span className="hidden xl:inline">Administrar Club</span>
                                <span className="bg-orange-500 text-white text-[9px] font-bold px-1 rounded ml-1">
                                    {!isPremium && 'Mejorar'}
                                </span>
                            </button>
                            <button
                                onClick={() => handleFeatureClick('Mis Torneos')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/20 hover:bg-blue-600/30 transition-colors text-xs font-medium"
                            >
                                <Trophy size={14} />
                                <span className="hidden xl:inline">Mis Torneos</span>
                                <span className="bg-orange-500 text-white text-[9px] font-bold px-1 rounded ml-1">
                                    {!isPremium && 'Mejorar'}
                                </span>
                            </button>
                            <button
                                onClick={() => handleFeatureClick('Transmitir en Vivo')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-600/30 transition-colors text-xs font-medium"
                            >
                                <Video size={14} />
                                <span className="hidden xl:inline">Transmitir</span>
                                <span className="bg-orange-500 text-white text-[9px] font-bold px-1 rounded ml-1">
                                    {!isUltra && 'Mejorar'}
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Plan Badge */}
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                        <Award size={14} className="text-yellow-500" />
                        <span className="text-xs font-bold text-yellow-500 tracking-wide">
                            {subscriptionTier === 'ultra' ? 'BFiveUltra' : subscriptionTier === 'pro' ? 'BFivePro' : 'BFiveBasic'}
                        </span>
                    </div>

                    {/* User Dropdown Trigger */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-3 group focus:outline-none"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{userEmail}</p>
                            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Plan Activo</p>
                        </div>

                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-white/10 group-hover:border-purple-500/50 transition-colors overflow-hidden relative">
                                {userAvatar ? (
                                    <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-white" />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-white/10">
                                <ChevronDown size={12} className={`text-white/60 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-4 w-64 bg-[#0f0e1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-5 duration-200">
                            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                                <p className="text-xs font-bold text-white/40 uppercase mb-2">Mi Cuenta</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 overflow-hidden relative">
                                        {userAvatar ? (
                                            <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={16} />
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-white truncate">{userEmail}</p>
                                        <p className="text-xs text-yellow-500 font-medium">
                                            {subscriptionTier === 'ultra' ? 'BFiveUltra' : subscriptionTier === 'pro' ? 'BFivePro' : 'BFiveBasic'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-2 space-y-1">
                                <MenuItem icon={Settings} label="Editar Perfil" onClick={() => { setIsMenuOpen(false); setIsProfileModalOpen(true); }} />
                                <div className="h-px bg-white/5 my-2 mx-3"></div>
                                <MenuItem icon={PlayCircle} label="Juego Rápido" onClick={() => navigate('/dashboard/game')} />
                                <MenuItem icon={Award} label="Mejorar Plan" highlight onClick={() => { setIsMenuOpen(false); setIsSubscriptionModalOpen(true); }} />

                                <div className="relative">
                                    <MenuItem
                                        icon={Users}
                                        label="Administrar Club"
                                        onClick={() => { setIsMenuOpen(false); handleFeatureClick('Administrar Club'); }}
                                    />
                                    {!isPremium && (
                                        <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded shadow-lg pointer-events-none">
                                            Mejorar Plan
                                        </span>
                                    )}
                                </div>

                                <div className="relative">
                                    <MenuItem
                                        icon={Trophy}
                                        label="Mis Torneos"
                                        onClick={() => { setIsMenuOpen(false); handleFeatureClick('Mis Torneos'); }}
                                    />
                                    {!isPremium && (
                                        <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded shadow-lg pointer-events-none">
                                            Mejorar Plan
                                        </span>
                                    )}
                                </div>

                                <div className="relative">
                                    <MenuItem
                                        icon={Video}
                                        label="Transmitir en Vivo"
                                        onClick={() => { setIsMenuOpen(false); handleFeatureClick('Transmitir en Vivo'); }}
                                    />
                                    {!isPremium && (
                                        <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded shadow-lg pointer-events-none">
                                            Mejorar Plan
                                        </span>
                                    )}
                                </div>

                                <div className="h-px bg-white/5 my-2 mx-3"></div>
                                <MenuItem icon={LogOut} label="Cerrar Sesión" onClick={handleLogout} danger />
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            <EditProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userEmail={userEmail}
            />

            <SubscriptionModal
                isOpen={isSubscriptionModalOpen}
                onClose={() => setIsSubscriptionModalOpen(false)}
            />

            <FeatureComingSoonModal
                isOpen={isComingSoonModalOpen}
                onClose={() => setIsComingSoonModalOpen(false)}
                plan={subscriptionTier}
                featureName={selectedFeature}
            />
            <EditProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </>
    );
};

interface MenuItemProps {
    icon: any;
    label: string;
    onClick?: () => void;
    highlight?: boolean;
    danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, onClick, highlight, danger }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${danger
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                : highlight
                    ? 'text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
            }
        `}
    >
        <Icon size={16} />
        {label}
    </button>
);
