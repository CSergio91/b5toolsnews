import React, { useState } from 'react';
import { Trophy, Calendar, Bell, Sliders, ChevronRight, Check, X } from 'lucide-react';

interface TournamentsOnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TournamentsOnboardingModal: React.FC<TournamentsOnboardingModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);

    if (!isOpen) return null;

    const steps = [
        {
            icon: Trophy,
            title: "Gestiona tus Torneos",
            description: "Bienvenido a tu panel de torneos. Aquí podrás crear, organizar y controlar todas tus competiciones de Béisbol Five.",
            color: "text-blue-400",
            bg: "bg-blue-500/20"
        },
        {
            icon: Calendar,
            title: "Planificación Completa",
            description: "Define fechas, sedes y horarios. Nuestro sistema organizará cronológicamente todos tus eventos para un fácil acceso.",
            color: "text-orange-400",
            bg: "bg-orange-500/20"
        },
        {
            icon: Bell,
            title: "Recordatorios Inteligentes",
            description: "Activa notificaciones automáticas (1 semana, 3 días, 1 hora antes) para no perder detalle de ningún evento importante.",
            color: "text-cyan-400",
            bg: "bg-cyan-500/20"
        },
        {
            icon: Sliders,
            title: "Control Total",
            description: "Edita detalles sobre la marcha o elimina torneos antiguos. Todo el poder de gestión al alcance de un clic.",
            color: "text-purple-400",
            bg: "bg-purple-500/20"
        }
    ];

    const currentStep = steps[step];
    const Icon = currentStep.icon;

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(prev => prev + 1);
        } else {
            onClose();
            // Optional: Save "seen" state in localStorage if requested later
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm relative overflow-hidden shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    ></div>
                </div>

                <div className="p-8 pb-6 flex flex-col items-center text-center">
                    <div className={`w-20 h-20 rounded-2xl ${currentStep.bg} flex items-center justify-center mb-6 border border-white/5 shadow-[0_0_30px_-5px_var(--tw-shadow-color)] ${currentStep.color.replace('text', 'shadow')}`}>
                        <Icon size={40} className={currentStep.color} />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300" key={currentStep.title}>
                        {currentStep.title}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500" key={currentStep.description}>
                        {currentStep.description}
                    </p>
                </div>

                <div className="p-6 pt-0">
                    <button
                        onClick={handleNext}
                        className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {step === steps.length - 1 ? (
                            <>
                                <Check size={18} />
                                ¡Entendido!
                            </>
                        ) : (
                            <>
                                Siguiente
                                <ChevronRight size={18} />
                            </>
                        )}
                    </button>

                    <div className="flex justify-center gap-1.5 mt-4">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-white w-4' : 'bg-white/20'}`}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
