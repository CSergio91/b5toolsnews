import React from 'react';
import { X, Hammer, Star, Zap, Crown } from 'lucide-react';

interface FeatureComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: string;
    featureName?: string;
}

export const FeatureComingSoonModal: React.FC<FeatureComingSoonModalProps> = ({
    isOpen,
    onClose,
    plan,
    featureName = "esta funcionalidad"
}) => {
    if (!isOpen) return null;

    const getPlanIcon = () => {
        switch (plan) {
            case 'ultra': return <Crown size={32} className="text-yellow-500" />;
            case 'pro': return <Zap size={32} className="text-purple-400" />;
            default: return <Star size={32} className="text-white" />;
        }
    };

    const getPlanName = () => {
        switch (plan) {
            case 'ultra': return 'BFiveUltra';
            case 'pro': return 'BFivePro';
            default: return 'BFiveBasic';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#0f0e1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">

                {/* Close Button */}
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center text-center">

                    {/* Icon & Plan Badge */}
                    <div className="mb-6 relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 mb-4">
                            <Hammer size={40} className="text-indigo-400 animate-pulse" />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 px-3 py-1 rounded-full flex items-center gap-2 shadow-xl whitespace-nowrap">
                            {getPlanIcon()}
                            <span className="text-sm font-bold text-white uppercase tracking-wider">{getPlanName()}</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3 mt-4">
                        ¡Próximamente!
                    </h2>

                    <p className="text-white/60 mb-6 leading-relaxed">
                        Genial, ya tienes el plan <strong className="text-white">{getPlanName()}</strong>. <br />
                        Estamos trabajando duro para implementar <strong>{featureName}</strong> y que puedas disfrutarla muy pronto.
                    </p>

                    <div className="w-full p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-sm text-white/40 mb-6">
                        🚧 En construcción por el equipo de desarrollo
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
