import React from 'react';
import { AlertTriangle, Check, X, Info } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'warning' | 'danger' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'warning'
}) => {
    if (!isOpen) return null;

    const colors = {
        warning: {
            bg: 'bg-yellow-500/20',
            text: 'text-yellow-500',
            button: 'bg-yellow-500 hover:bg-yellow-400 text-black',
            shadow: 'shadow-yellow-500/20'
        },
        danger: {
            bg: 'bg-red-500/20',
            text: 'text-red-500',
            button: 'bg-red-500 hover:bg-red-400 text-white',
            shadow: 'shadow-red-500/20'
        },
        info: {
            bg: 'bg-blue-500/20',
            text: 'text-blue-500',
            button: 'bg-blue-600 hover:bg-blue-500 text-white',
            shadow: 'shadow-blue-500/20'
        }
    };

    const variantStyles = colors[variant];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a20] border border-white/10 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 pb-2 text-center">
                    <div className={`w-12 h-12 rounded-full ${variantStyles.bg} flex items-center justify-center ${variantStyles.text} mb-4 mx-auto border border-white/5`}>
                        {variant === 'danger' ? <AlertTriangle size={24} /> : variant === 'info' ? <Info size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>

                <div className="p-6 pt-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 py-3 px-4 ${variantStyles.button} text-sm font-bold rounded-xl shadow-lg ${variantStyles.shadow} transition-all flex items-center justify-center gap-2`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
