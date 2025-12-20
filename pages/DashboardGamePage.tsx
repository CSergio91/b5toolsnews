import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserNavbar } from '../components/UserNavbar';
import { ScoreCard } from '../components/ScoreCard';
import { ParticlesBackground } from '../components/ParticlesBackground';

export const DashboardGamePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const matchId = searchParams.get('matchId');
    const setNumber = searchParams.get('setNumber') ? parseInt(searchParams.get('setNumber')!) : null;

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black text-white selection:bg-purple-500 selection:text-white flex flex-col relative overflow-hidden">
            {/* Reuse Particles for consistency */}
            <ParticlesBackground />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            <UserNavbar showGameControls={true} />

            <main className="flex-1 relative z-10 w-full pt-20">
                <div className="container mx-auto px-4 py-6 max-w-[1400px]">
                    <div className="mb-4 bg-indigo-900/20 border border-indigo-500/20 p-3 rounded-lg flex items-center justify-between gap-3 text-sm text-indigo-200 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{matchId ? 'Modo Torneo Oficial:' : 'Modo Juego Rápido:'}</span>
                            <span className="opacity-70">
                                {matchId
                                    ? `Gestionando Set #${setNumber} del Match ${matchId.substring(0, 8)}.`
                                    : 'Las estadísticas se guardarán en tu historial de sesión local.'}
                            </span>
                        </div>
                    </div>

                    <ScoreCard matchId={matchId} setNumber={setNumber} />
                </div>
            </main>
        </div>
    );
};
