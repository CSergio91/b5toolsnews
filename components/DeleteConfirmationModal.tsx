import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    tournamentName: string;
    isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    tournamentName,
    isDeleting = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl shadow-red-500/10">
                {/* Header */}
                <div className="p-6 pb-2">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 mb-4 mx-auto border border-red-500/20">
                        <AlertTriangle size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white text-center mb-2">¿Eliminar Torneo?</h2>
                    <p className="text-slate-400 text-center text-sm leading-relaxed">
                        Estás a punto de eliminar <span className="text-white font-bold">"{tournamentName}"</span>.
                    </p>
                </div>

                {/* Warning Content */}
                <div className="px-6 py-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <h3 className="text-red-300 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                            <AlertTriangle size={12} />
                            Advertencia de pérdida de datos
                        </h3>
                        <p className="text-red-200/80 text-xs leading-relaxed">
                            Esta acción es <strong>irreversible</strong>. Se eliminarán permanentemente:
                        </p>
                        <ul className="text-red-200/80 text-xs list-disc list-inside mt-2 space-y-1 ml-1">
                            <li>Resultados de partidos</li>
                            <li>Calendarios generados</li>
                            <li>Configuraciones de equipos</li>
                            <li>Estadísticas asociadas</li>
                        </ul>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-2 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? (
                            'Eliminando...'
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Sí, Eliminar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
