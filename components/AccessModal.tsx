import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCog, LogIn, Trophy } from 'lucide-react';

interface AccessModalProps {
    isOpen: boolean;
    onSelectRole: (role: 'admin' | 'referee') => void;
    tournamentName: string;
}

export const AccessModal: React.FC<AccessModalProps> = ({ isOpen, onSelectRole, tournamentName }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[#1a1a20] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                    >
                        {/* Header / Logo Section */}
                        <div className="p-8 text-center bg-white/5 border-b border-white/5">
                            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
                                <Trophy size={40} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">Acceso a Torneo</h2>
                            <p className="text-blue-400 font-bold">{tournamentName}</p>
                        </div>

                        {/* Options Section */}
                        <div className="p-8 space-y-4">
                            <p className="text-center text-white/40 text-sm mb-6">
                                Selecciona el rol con el que deseas acceder hoy. Ten en cuenta que tus permisos variarán según esta elección.
                            </p>

                            <button
                                onClick={() => onSelectRole('admin')}
                                className="w-full flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group"
                            >
                                <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400 group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">Administrador Invitado</h3>
                                    <p className="text-xs text-white/40">Gestionar resultados, equipos y calendario.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => onSelectRole('referee')}
                                className="w-full flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                            >
                                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                                    <UserCog size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">Árbitro / Anotador</h3>
                                    <p className="text-xs text-white/40">Control de mesa y anotación de partidos asignados.</p>
                                </div>
                            </button>
                        </div>

                        <div className="p-4 text-center bg-white/5 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
                            Powered by B5Tools
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
