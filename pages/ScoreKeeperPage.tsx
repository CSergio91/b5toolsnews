import React from 'react';
import { ScoreCard } from '../components/ScoreCard';

export const ScoreKeeperPage: React.FC = () => {
    const [isConnected, setIsConnected] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        import('../lib/supabase').then(({ checkConnection }) => {
            checkConnection().then(setIsConnected);
        });
    }, []);

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-purple-950 to-slate-950 text-white selection:bg-purple-500 selection:text-white">
            {/* Background decoration */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 container mx-auto px-2 py-6 max-w-[1400px]">
                {/* Local Mode Alert */}
                <div className="mb-4 bg-blue-900/40 border border-blue-500/30 p-3 rounded-lg flex items-center justify-center gap-3 text-sm text-blue-200 shadow-lg backdrop-blur-sm no-print">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info flex-shrink-0 text-blue-400"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    <p>
                        <span className="font-bold text-blue-100">Modo Local Activo:</span> Los datos de este partido se almacenan únicamente en tu dispositivo. No hay respaldo en la nube. ¡Recuerda guardar tu progreso o imprimir los resultados!
                    </p>
                </div>

                <header className="mb-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="B5Tools Logo" className="h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] active:scale-95 transition-transform duration-300" />
                        <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                            B5Tools <span className="font-light text-white/70">Official Scorekeeper</span>
                        </h1>
                    </div>
                </header>

                <main className="transition-opacity duration-500 ease-in-out">
                    <ScoreCard />
                </main>

                <footer className="mt-12 text-center text-white/30 text-xs pb-4">
                    <p>Diseñado por B5Tools Development Team • B5Tools Pro Official • Autosaved Locally</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected === null ? 'bg-gray-500' : isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                        <span>Supabase: {isConnected === null ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};
