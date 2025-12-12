import React from 'react';
import { BuilderProvider, useBuilder } from '../context/BuilderContext';
import { Save, XCircle, ArrowRight, Settings, Users, Trophy, GitBranch, User, LogOut, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfigStep } from '../components/Builder/ConfigStep';
import { TeamManagementStep } from '../components/Builder/TeamManagementStep';
import { FormatStep } from '../components/Builder/FormatStep';
import { FixtureStep } from '../components/Builder/FixtureStep';
import { PlayerManagementStep } from '../components/Builder/PlayerManagementStep';
import { CustomSpinner } from '../components/CustomSpinner';
import { ParticleBackground } from '../components/ParticleBackground';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const BuilderWizard = () => {
    const { state, setStep, saveTournament } = useBuilder();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    // User State for Sidebar
    const [user, setUser] = useState<any>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        // Fetch User
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });

        // Simulating loading time for polish
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const steps = [
        { id: 0, label: 'Configuración', icon: <Settings size={18} /> },
        {
            id: 1,
            label: 'Equipos',
            icon: <Users size={18} />,
            subItems: [
                { id: 11, label: 'Gestionar Jugadores' }
            ]
        },
        { id: 2, label: 'Formato', icon: <Trophy size={18} /> },
        { id: 3, label: 'Bracket / Fixture', icon: <GitBranch size={18} /> },
    ];

    const handleSave = async () => {
        const id = await saveTournament();
        if (id) {
            alert('Torneo guardado correctamente (Borrador)');
        }
    };

    const handleExit = () => {
        if (state.isDirty && !confirm('Tienes cambios sin guardar. ¿Salir?')) return;
        navigate('/torneos'); // Navigate "Back" to My Tournaments
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <div className="h-screen w-full bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center animate-out fade-out duration-500 fill-mode-forwards" style={{ animationDelay: '1.4s' }}>
                    <CustomSpinner size="large" showText={true} />
                </div>
            )}

            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#111]">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="B5Tools" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-lg tracking-tight">B5Tools Builder <span className="text-xs text-white/30 uppercase ml-2 border border-white/10 px-1 rounded">Enterprise</span></span>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleExit} className="px-4 py-2 text-sm text-white/60 hover:text-white flex items-center gap-2 transition-colors">
                        <XCircle size={16} /> Cancelar
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 bg-white text-black font-bold text-sm rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2">
                        <Save size={16} /> Guardar Borrador
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-64 bg-[#111] border-r border-white/5 flex flex-col py-6">
                    <nav className="space-y-1 px-3 flex-1">
                        {steps.map((step, idx) => (
                            <div key={step.id} className="mb-1">
                                <button
                                    onClick={() => setStep(step.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${state.currentStep === step.id || (step.subItems && step.subItems.some(s => s.id === state.currentStep))
                                        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <div className={`${state.currentStep === step.id ? 'text-blue-400' : 'text-white/30'}`}>{step.icon}</div>
                                    {step.label}
                                    {state.currentStep === step.id && <ArrowRight size={14} className="ml-auto opacity-50" />}
                                </button>

                                {/* Sub Items */}
                                {step.subItems && (state.currentStep === step.id || step.subItems.some(s => s.id === state.currentStep)) && (
                                    <div className="ml-4 pl-4 border-l border-white/10 mt-1 space-y-1 animate-in slide-in-from-left-2 fade-in duration-300">
                                        {step.subItems.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => setStep(sub.id)}
                                                className={`w-full text-left px-4 py-2 text-xs rounded-lg transition-colors ${state.currentStep === sub.id
                                                        ? 'bg-white/10 text-white font-bold'
                                                        : 'text-white/40 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* User Profile Footer */}
                    <div className="px-4 pt-4 border-t border-white/5 relative">
                        {isUserMenuOpen && (
                            <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1a1a20] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2">
                                <button
                                    onClick={handleExit}
                                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-2"
                                >
                                    <Trophy size={14} className="text-white/50" /> Mis Torneos
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
                                >
                                    <LogOut size={14} /> Cerrar Sesión
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden border border-white/10">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-white" />
                                )}
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">
                                    {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuario'}
                                </p>
                                <p className="text-[10px] text-white/40 uppercase">En Línea</p>
                            </div>
                            <ChevronUp size={16} className={`text-white/30 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </aside>

                {/* Main Canvas Area */}
                <main className="flex-1 overflow-y-auto relative p-8 custom-scrollbar">
                    {/* Background */}
                    <ParticleBackground />

                    {/* Content */}
                    <div className="max-w-5xl mx-auto h-full relative z-10">
                        {state.currentStep === 0 && <ConfigStep />}
                        {state.currentStep === 1 && <TeamManagementStep />}
                        {state.currentStep === 11 && <PlayerManagementStep />}
                        {state.currentStep === 2 && <FormatStep />}
                        {state.currentStep === 3 && <FixtureStep />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export const B5ToolsBuilderPage: React.FC = () => {
    return (
        <BuilderProvider>
            <BuilderWizard />
        </BuilderProvider>
    );
};
