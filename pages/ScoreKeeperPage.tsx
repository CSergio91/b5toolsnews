import React, { useState } from 'react';
import { ScoreCard } from '../components/ScoreCard';
import { useNavigate } from 'react-router-dom';
import { Home, Zap } from 'lucide-react';
import { RegistrationModal } from '../components/RegistrationModal';

export const ScoreKeeperPage: React.FC = () => {
    const navigate = useNavigate();
    const [isConnected, setIsConnected] = React.useState<boolean | null>(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [showLocalModeAlert, setShowLocalModeAlert] = useState(true);

    React.useEffect(() => {
        import('../lib/supabase').then(({ checkConnection }) => {
            checkConnection().then(setIsConnected);
        });
    }, []);

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-purple-950 to-slate-950 text-white selection:bg-purple-500 selection:text-white relative bg-fixed">
            {/* Background decoration */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Navigation & Actions */}


            <div className="fixed md:top-4 md:right-4 bottom-24 right-4 z-40 no-print">
                <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="group relative flex items-center gap-2 pl-4 pr-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.7)] hover:scale-105 active:scale-95 transition-all"
                >
                    <div className="absolute -top-1 -right-1">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                        </span>
                    </div>
                    <Zap size={18} className="text-yellow-300 fill-current animate-pulse" />
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] font-bold text-purple-200">SIN TARJETA</span>
                        <span className="text-sm font-bold text-white uppercase tracking-tight">Crear Cuenta Gratis</span>
                    </div>
                </button>
            </div>

            <div className="relative z-10 container mx-auto px-2 py-6 max-w-[1400px]">
                {/* Local Mode Alert */}
                {/* Local Mode Alert */}
                {showLocalModeAlert && (
                    <div className="mb-4 bg-blue-900/40 border border-blue-500/30 p-3 rounded-lg flex items-center justify-between gap-3 text-sm text-blue-200 shadow-lg backdrop-blur-sm no-print mx-12 md:mx-0 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info flex-shrink-0 text-blue-400"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                            <p>
                                <span className="font-bold text-blue-100">Modo Local Activo:</span> Los datos de este partido se almacenan únicamente en tu dispositivo. No hay respaldo en la nube.
                            </p>
                        </div>
                        <button onClick={() => setShowLocalModeAlert(false)} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 p-1 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                )}



                <main className="transition-opacity duration-500 ease-in-out">
                    <ScoreCard />
                </main>

                <footer className="mt-12 text-center text-white/30 text-xs pb-4 no-print">
                    <p>Diseñado por B5Tools Development Team • B5Tools Pro Official • Autosaved Locally</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected === null ? 'bg-gray-500' : isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                        <span>Supabase: {isConnected === null ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </footer>
            </div>

            <RegistrationModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
            />
        </div>
    );
};
