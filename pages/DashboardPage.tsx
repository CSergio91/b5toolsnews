import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { UserNavbar } from '../components/UserNavbar';
import { ParticlesBackground } from '../components/ParticlesBackground';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { FeatureComingSoonModal } from '../components/FeatureComingSoonModal';
import { PlayCircle, Trophy, Users, Video, ShieldCheck } from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState('');
    const [subscriptionTier, setSubscriptionTier] = useState<string>('basic');
    const [invitationCount, setInvitationCount] = useState(0);

    useEffect(() => {
        fetchSubscription();
        fetchInvitationsCount();

        const handleSubscriptionUpdate = () => {
            fetchSubscription();
        };

        window.addEventListener('subscription-updated', handleSubscriptionUpdate);
        return () => window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
    }, []);

    const fetchSubscription = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();
            if (data) setSubscriptionTier(data.subscription_tier);
        }
    };

    const isPremium = subscriptionTier === 'pro' || subscriptionTier === 'ultra';

    const isUltra = subscriptionTier === 'ultra';

    const fetchInvitationsCount = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const userEmail = user.email || user.user_metadata?.email;
        if (!userEmail) return;

        // Count Admin Invites
        const { count: adminCount } = await supabase
            .from('tournament_admins')
            .select('*', { count: 'exact', head: true })
            .eq('email', userEmail);

        // Count Referee Invites
        // Need to find referee profile first
        const { data: refProfile } = await supabase
            .from('referee_profiles')
            .select('id')
            .eq('email', userEmail)
            .single();

        let refCount = 0;
        if (refProfile) {
            const { count } = await supabase
                .from('tournament_referees')
                .select('*', { count: 'exact', head: true })
                .eq('referee_id', refProfile.id);
            refCount = count || 0;
        }

        setInvitationCount((adminCount || 0) + refCount);
    };

    const handleFeatureClick = (featureName: string) => {
        // Special restriction for Live Stream
        if (featureName === 'Transmitir en Vivo') {
            if (!isUltra) {
                setIsSubscriptionModalOpen(true);
                return;
            }
        }

        // General Premium restriction
        if (!isPremium) {
            setIsSubscriptionModalOpen(true);
        } else {
            if (featureName === 'Mis Torneos') {
                navigate('/dashboard/torneos');
            } else {
                setSelectedFeature(featureName);
                setIsComingSoonModalOpen(true);
            }
        }
    };

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black text-white selection:bg-purple-500 selection:text-white flex flex-col relative overflow-hidden">
            {/* Reuse Particles for consistency */}
            <ParticlesBackground />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
            </div>

            <UserNavbar />

            <main className="flex-1 relative z-10 p-6 md:p-12 max-w-7xl mx-auto w-full pt-24 md:pt-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    <DashboardCard
                        title="Juego Rápido"
                        icon={PlayCircle}
                        description="Inicia un partido amistoso sin guardar estadísticas a largo plazo."
                        color="purple"
                        onClick={() => navigate('/dashboard/game')}
                    />
                    <DashboardCard
                        title="Mis Torneos"
                        icon={Trophy}
                        description="Gestiona tus competiciones y ligas."
                        color="blue"
                        badge={!isPremium ? "Mejorar Plan" : undefined}
                        onClick={() => handleFeatureClick("Mis Torneos")}
                    />
                    <DashboardCard
                        title="Administrar Club"
                        icon={Users}
                        description="Gestiona jugadores y equipos."
                        color="indigo"
                        badge={!isPremium ? "Mejorar Plan" : undefined}
                        onClick={() => handleFeatureClick("Administrar Club")}
                    />
                    <DashboardCard
                        title="Transmitir en Vivo"
                        icon={Video}
                        description="Conecta con tus fans en tiempo real"
                        color="indigo"
                        badge={!isUltra ? "Mejorar Plan" : undefined} // Only Ultra
                        onClick={() => handleFeatureClick("Transmitir en Vivo")}
                    />
                    <DashboardCard
                        title="Torneos Invitados"
                        icon={ShieldCheck}
                        description="Participa como Administrador o Árbitro."
                        color="blue"
                        bubbleCount={invitationCount}
                        onClick={() => navigate('/dashboard/torneosinvitados')}
                    />
                </div>
            </main>

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
        </div>
    );
};

interface DashboardCardProps {
    title: string;
    icon: any;
    description: string;
    color: 'purple' | 'blue' | 'indigo';
    onClick?: () => void;
    badge?: string;
    bubbleCount?: number;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon: Icon, description, color, onClick, badge, bubbleCount }) => {
    const colorClasses = {
        purple: 'bg-purple-600/20 text-purple-400 group-hover:bg-purple-600/30',
        blue: 'bg-blue-600/20 text-blue-400 group-hover:bg-blue-600/30',
        indigo: 'bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600/30'
    };

    return (
        <div
            onClick={onClick}
            className="relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl"
        >
            {badge && (
                <div className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-pulse">
                    {badge}
                </div>
            )}
            {bubbleCount !== undefined && bubbleCount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    {bubbleCount}
                </div>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colorClasses[color]}`}>
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold mb-1 text-white">{title}</h3>
            <p className="text-sm text-white/40">{description}</p>
        </div>
    );
};
