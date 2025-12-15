import React from 'react';
import { AlertTriangle, LogOut, X } from 'lucide-react';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a20] border border-white/10 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl shadow-yellow-500/10">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 pb-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 mx-auto border border-yellow-500/20">
                        <AlertTriangle size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">¿Salir sin guardar?</h2>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Tienes cambios pendientes. Si sales ahora, <span className="text-white font-bold">se perderán todos los datos no guardados</span>.
                    </p>
                </div>

                <div className="p-6 pt-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 px-4 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} />
                        Salir de todas formas
                    </button>
                </div>
            </div>
        </div>
    );
};
