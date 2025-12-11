import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { ParticlesBackground } from '../components/ParticlesBackground';

export const ErrorPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">

            {/* Background FX */}
            <ParticlesBackground />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 text-center max-w-2xl px-6">

                {/* Sports Themed 404 */}
                <div className="relative inline-block mb-8">
                    <h1 className="text-[12rem] md:text-[16rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 select-none drop-shadow-2xl">
                        404
                    </h1>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center">
                        <span className="text-xl md:text-3xl font-bold uppercase tracking-[1em] text-red-500/80 drop-shadow-lg">Foul Ball</span>
                    </div>
                </div>

                <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-400">
                    ¡Fuera de Juego!
                </h2>

                <p className="text-lg md:text-xl text-white/60 mb-10 leading-relaxed">
                    Parece que la página que buscas ha sido eliminada del roster o nunca existió.
                    <br className="hidden md:block" />Regresa al home plate para continuar el partido.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Volver Atrás</span>
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        <Home size={20} />
                        <span>Ir al Inicio</span>
                    </button>
                </div>

            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
    );
};
