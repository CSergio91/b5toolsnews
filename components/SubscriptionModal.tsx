import React, { useState, useEffect } from 'react';
import { X, Check, Star, Zap, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
    const { currentTier, loading, handleUpdatePlan } = useSubscription();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
            <div className="w-full max-w-5xl bg-[#0f0e1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative my-auto">

                {/* Header */}
                <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Mejora tu Experiencia</h2>
                        <p className="text-white/40 text-sm">Elige el plan que mejor se adapte a tu club.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Plans Grid */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <SubscriptionPlans
                        currentTier={currentTier}
                        onUpdate={handleUpdatePlan}
                        loading={loading}
                        mode="modal"
                    />
                </div>
            </div>
        </div>
    );
};

// --- Reusable Logic Hook ---
export const useSubscription = () => {
    const [currentTier, setCurrentTier] = useState<string>('basic');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkSubscription();
        window.addEventListener('subscription-updated', checkSubscription);
        return () => window.removeEventListener('subscription-updated', checkSubscription);
    }, []);

    const checkSubscription = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single();
            if (data) setCurrentTier(data.subscription_tier);
        }
    };

    const handleUpdatePlan = async (tier: 'basic' | 'pro' | 'ultra') => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('profiles')
                .update({ subscription_tier: tier })
                .eq('id', user.id);
            setCurrentTier(tier);
            window.dispatchEvent(new Event('subscription-updated'));
        }
        setLoading(false);
    };

    return { currentTier, loading, handleUpdatePlan };
};

// --- Reusable UI Component ---
interface SubscriptionPlansProps {
    currentTier: string;
    onUpdate: (tier: 'basic' | 'pro' | 'ultra') => void;
    loading: boolean;
    mode?: 'modal' | 'inline'; // 'modal' = 3 cols, 'inline' = 1 col (list)
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ currentTier, onUpdate, loading, mode = 'modal' }) => {
    const gridClass = mode === 'modal'
        ? 'grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto'
        : 'flex flex-col gap-4';

    return (
        <div className={gridClass}>
            {/* Basic Plan */}
            <div className={`relative group p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-all flex flex-col ${mode === 'inline' ? 'order-3 opacity-50' : ''}`}>
                <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white mb-4">
                        <Star size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">BFiveBasic</h3>
                    <div className="text-sm text-white/40 mb-4">Para iniciarse</div>
                    <div className="text-3xl font-bold text-white">Gratis</div>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                    <FeatureItem text="Partidos Rapidos sin Bases de datos" />
                    <FeatureItem text="Estadísticas básicas" />
                    <FeatureItem text="Exportación PDF limitada" />
                </div>

                <button
                    onClick={() => onUpdate('basic')}
                    className={`w-full py-3 rounded-xl border transition-colors ${currentTier === 'basic' ? 'border-white/20 text-white font-bold bg-white/5 cursor-default' : 'border-white/20 text-white/50 hover:bg-white/5 hover:text-white'}`}
                    disabled={currentTier === 'basic' || loading}
                >
                    {currentTier === 'basic' ? 'Plan Actual' : 'Cambiar a Basic'}
                </button>
            </div>

            {/* Pro Plan (Recommended) */}
            <div className={`relative p-6 rounded-2xl bg-gradient-to-b from-purple-900/20 to-indigo-900/20 border border-purple-500/50 shadow-2xl flex flex-col transition-transform duration-300 ${mode === 'modal' ? 'transform md:-translate-y-4 md:hover:-translate-y-5' : 'order-1 ring-1 ring-purple-500'}`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-1 rounded-full shadow-lg">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> Recomendado
                    </span>
                </div>

                <div className="mb-4 pt-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-900/50">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">BFivePro</h3>
                    <div className="text-sm text-purple-300 mb-4">Para clubes en crecimiento</div>
                    <div className="flex items-baseline gap-1">
                        <div className="text-4xl font-black text-white">3.99€</div>
                        <div className="text-sm text-white/40">/mes</div>
                    </div>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                    <FeatureItem text="Todo lo de Basic" highlight />
                    <FeatureItem text="Estadísticas avanzadas" />
                    <FeatureItem text="Hasta 5 Equipos" />
                    <FeatureItem text="Modo Torneo" />
                    <FeatureItem text="Exportación completa" />
                    <FeatureItem text="Sin anuncios" />
                </div>

                <button
                    onClick={() => onUpdate('pro')}
                    disabled={currentTier === 'pro' || loading}
                    className={`w-full py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-wide
                        ${currentTier === 'pro'
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50 cursor-default'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                        }`}
                >
                    {currentTier === 'pro' ? 'Plan Actual' : 'Mejorar Ahora'}
                </button>
            </div>

            {/* Ultra Plan */}
            <div className={`relative group p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-yellow-500/30 transition-all flex flex-col ${mode === 'inline' ? 'order-2' : ''}`}>
                <div className="mb-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4">
                        <Crown size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">BFiveUltra</h3>
                    <div className="text-sm text-white/40 mb-4">Para profesionales</div>
                    <div className="flex items-baseline gap-1">
                        <div className="text-3xl font-bold text-white">7.99€</div>
                        <div className="text-sm text-white/40">/mes</div>
                    </div>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                    <FeatureItem text="Todo lo de Pro" />
                    <FeatureItem text="Equipos ilimitados" />
                    <FeatureItem text="Análisis con IA" />
                    <FeatureItem text="API de datos en vivo" />
                    <FeatureItem text="Transmisiones en vivo" />
                    <FeatureItem text="Soporte Prioritario 24/7" />
                    <FeatureItem text="Branding personalizado" />
                </div>

                <button
                    onClick={() => onUpdate('ultra')}
                    disabled={currentTier === 'ultra' || loading}
                    className={`w-full py-3 rounded-xl border transition-colors font-bold
                            ${currentTier === 'ultra'
                            ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500 cursor-default'
                            : 'border-white/20 text-white hover:border-yellow-500/50 hover:text-yellow-500 hover:bg-yellow-500/5'
                        }`}
                >
                    {currentTier === 'ultra' ? 'Plan Actual' : 'Cambiar a Ultra'}
                </button>
            </div>

        </div>
    );
};

const FeatureItem: React.FC<{ text: string, highlight?: boolean }> = ({ text, highlight }) => (
    <div className={`flex items-center gap-3 ${highlight ? 'text-white' : 'text-white/60'}`}>
        <div className={`p-0.5 rounded-full ${highlight ? 'bg-green-500 text-black' : 'bg-white/10 text-white/60'}`}>
            <Check size={10} strokeWidth={4} />
        </div>
        <span className="text-sm font-medium">{text}</span>
    </div>
);
