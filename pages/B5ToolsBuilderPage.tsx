import React, { useState, useEffect } from 'react';
import { BuilderProvider, useBuilder } from '../context/BuilderContext';
import { Save, XCircle, ArrowRight, Settings, Users, Trophy, GitBranch, User, LogOut, ChevronUp, Menu, X, Calendar as CalendarIcon, MessageCircle, CreditCard, Edit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfigStep } from '../components/Builder/ConfigStep';
import { TeamManagementStep } from '../components/Builder/TeamManagementStep';
import { FormatStep } from '../components/Builder/FormatStep';
import { FixtureStep } from '../components/Builder/FixtureStep';
import { RefereesStep } from '../components/Builder/RefereesStep';
import { AdminsStep } from '../components/Builder/AdminsStep';
import { PlayerManagementStep } from '../components/Builder/PlayerManagementStep';
import { CalendarStep } from '../components/Builder/CalendarStep';
import { CustomSpinner } from '../components/CustomSpinner';
import { ParticleBackground } from '../components/ParticleBackground';
import { supabase } from '../lib/supabase';
import { ToastProvider, useToast } from '../context/ToastContext';
import { EditProfileModal } from '../components/EditProfileModal';
import { UnsavedChangesModal } from '../components/UnsavedChangesModal';

const BuilderWizard = () => {
    const { state, setStep, saveTournament } = useBuilder();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    // User State for Sidebar
    const [user, setUser] = useState<any>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);

    // Bottom Nav State
    const [activeSubMenu, setActiveSubMenu] = useState<number | null>(null);
    const [isMobileMoreMenuOpen, setIsMobileMoreMenuOpen] = useState(false);

    // Collapsible State (Desktop)
    const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

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

    // Effect: Auto-expand parent if child is active
    useEffect(() => {
        const activeParent = steps.find(s => s.subItems?.some(sub => sub.id === state.currentStep));
        if (activeParent) {
            if (!expandedSteps.includes(activeParent.id)) {
                setExpandedSteps(prev => [...prev, activeParent.id]);
            }
        }
    }, [state.currentStep]);

    const steps = [
        { id: 0, label: 'Configuración', icon: <Settings size={20} /> },
        {
            id: 1,
            label: 'Participantes',
            icon: <Users size={20} />,
            subItems: [
                { id: 10, label: 'Equipos' },
                { id: 11, label: 'Jugadores' },
                { id: 12, label: 'Árbitros' },
                { id: 13, label: 'Admins' }
            ]
        },
        { id: 2, label: 'Formato', icon: <Trophy size={20} /> },
        { id: 3, label: 'Fixture', icon: <GitBranch size={20} /> },
        { id: 4, label: 'Calendario', icon: <CalendarIcon size={20} /> },
    ];

    const handleSave = async () => {
        const id = await saveTournament();
        if (id) {
            addToast('Torneo guardado correctamente (Borrador)', 'success');
        }
    };

    const handleExit = () => {
        if (state.isDirty && !confirm('Tienes cambios sin guardar. ¿Salir?')) return;
        navigate('/torneos');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const handleNavigateToTournaments = () => {
        if (state.isDirty) {
            setIsUnsavedModalOpen(true);
        } else {
            navigate('/torneos');
        }
    };

    const confirmNavigation = () => {
        setIsUnsavedModalOpen(false);
        navigate('/torneos');
    };

    const handleStepClick = (stepId: number, hasSubItems: boolean = false) => {
        if (hasSubItems) {
            // Toggle Expansion only
            setExpandedSteps(prev =>
                prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
            );
            return;
        }
        setStep(stepId);
        setActiveSubMenu(null); // Close active mobile submenu
        setIsMobileMoreMenuOpen(false); // Close more menu
    };

    const handleMobileStepClick = (step: any) => {
        setIsMobileMoreMenuOpen(false); // Close "More" menu if open
        if (step.subItems) {
            // Toggle Submenu Popup
            setActiveSubMenu(activeSubMenu === step.id ? null : step.id);
        } else {
            setStep(step.id);
            setActiveSubMenu(null);
        }
    };

    const toggleMobileMoreMenu = () => {
        setActiveSubMenu(null); // Close other submenus
        setIsMobileMoreMenuOpen(!isMobileMoreMenuOpen);
    };



    return (
        <>
            <div className="h-screen w-full bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center animate-out fade-out duration-500 fill-mode-forwards" style={{ animationDelay: '1.4s' }}>
                        <CustomSpinner size="large" showText={true} />
                    </div>
                )}

                {/* Header */}
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 lg:px-6 bg-[#111] z-20 relative">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="B5Tools" className="w-8 h-8 object-contain" />
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight leading-none">B5Tools</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest hidden md:block">Builder Enterprise</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                        <button
                            onClick={handleExit}
                            className="px-3 py-2 text-sm text-white/60 hover:text-white flex items-center gap-2 transition-colors hidden md:flex"
                        >
                            <XCircle size={16} /> Cancelar
                        </button>
                        {/* Mobile Cancel Icon Only */}
                        <button
                            onClick={handleExit}
                            className="p-2 text-white/60 hover:text-white md:hidden"
                        >
                            <XCircle size={20} />
                        </button>

                        <button
                            onClick={handleSave}
                            className="px-4 lg:px-6 py-2 bg-white text-black font-bold text-sm rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <Save size={16} /> <span className="hidden md:inline">Guardar Borrador</span><span className="md:hidden">Guardar</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden relative">

                    {/* Sidebar Navigation (Desktop Only) */}
                    <aside className="hidden lg:flex w-64 bg-[#111] border-r border-white/5 flex-col py-6">
                        <nav className="space-y-1 px-3 flex-1 overflow-y-auto custom-scrollbar">
                            {steps.map((step, idx) => (
                                <div key={step.id} className="mb-1">
                                    <button
                                        onClick={() => handleStepClick(step.id, !!step.subItems)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${state.currentStep === step.id || (step.subItems && step.subItems.some(s => s.id === state.currentStep))
                                            ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                            : 'text-white/40 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <div className={`${(state.currentStep === step.id || (step.subItems && step.subItems.some(s => s.id === state.currentStep))) ? 'text-blue-400' : 'text-white/30'}`}>{step.icon}</div>
                                        {step.label}
                                        {step.subItems ? (
                                            <ChevronUp size={14} className={`ml-auto opacity-50 transition-transform ${expandedSteps.includes(step.id) ? '' : 'rotate-180'}`} />
                                        ) : (
                                            state.currentStep === step.id && <ArrowRight size={14} className="ml-auto opacity-50" />
                                        )}
                                    </button>

                                    {/* Sub Items */}
                                    {step.subItems && expandedSteps.includes(step.id) && (
                                        <div className="ml-4 pl-4 border-l border-white/10 mt-1 space-y-1 animate-in slide-in-from-left-2 fade-in duration-300">
                                            {step.subItems.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => handleStepClick(sub.id)}
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
                        <div className="px-4 pt-4 border-t border-white/5 relative bg-[#111]">
                            {isUserMenuOpen && (
                                <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1a1a20] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2">
                                    <button
                                        onClick={handleNavigateToTournaments}
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
                    <main className={`flex-1 overflow-y-auto relative custom-scrollbar w-full ${state.currentStep === 3 ? 'p-0' : 'p-4 lg:p-8'}`}>
                        {/* Background */}
                        <ParticleBackground />

                        {/* Content */}
                        <div className={`${state.currentStep === 3 ? 'w-full h-full' : 'max-w-5xl mx-auto h-full'} relative z-10 pb-24 lg:pb-0`}>
                            {state.currentStep === 0 && <ConfigStep />}
                            {state.currentStep === 10 && <TeamManagementStep />}
                            {state.currentStep === 11 && <PlayerManagementStep />}
                            {state.currentStep === 12 && <RefereesStep />}

                            {state.currentStep === 13 && <AdminsStep />}
                            {state.currentStep === 2 && <FormatStep />}
                            {state.currentStep === 3 && <FixtureStep />}
                            {state.currentStep === 4 && <CalendarStep />}
                        </div>
                    </main>

                    {/* Mobile Bottom Navigation Bar */}
                    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#111] border-t border-white/10 z-50 lg:hidden flex items-center justify-around px-2 pb-safe-area">
                        {steps.map(step => {
                            const isActive = state.currentStep === step.id || (step.subItems && step.subItems.some(s => s.id === state.currentStep));
                            return (
                                <div key={step.id} className="relative">
                                    {/* Submenu Popover */}
                                    {step.subItems && activeSubMenu === step.id && (
                                        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 min-w-[160px] bg-[#1a1a20] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 z-50 flex flex-col p-1">
                                            {step.subItems.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => handleStepClick(sub.id)}
                                                    className={`text-left px-4 py-3 text-xs font-bold rounded-lg transition-colors ${state.currentStep === sub.id ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                                >
                                                    {sub.label}
                                                </button>
                                            ))}
                                            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a20] border-r border-b border-white/10 rotate-45"></div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleMobileStepClick(step)}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
                                    >
                                        <div className={`p-1.5 rounded-full ${isActive ? 'bg-blue-500/10' : ''}`}>
                                            {step.icon}
                                        </div>
                                        <span className="text-[10px] font-bold">{step.label}</span>
                                    </button>
                                </div>
                            );
                        })}

                        {/* Mobile More "Hambuger" Menu */}
                        <div className="relative">
                            {isMobileMoreMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-4 w-64 bg-[#1a1a20] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 z-50 p-4">
                                    {/* User Profile */}
                                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden border border-white/10">
                                            {user?.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} className="text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-bold text-white truncate">
                                                {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuario'}
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <p className="text-[10px] text-white/50 uppercase">Plan Pro</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="space-y-1">
                                        <button onClick={() => { setIsMobileMoreMenuOpen(false); setIsProfileModalOpen(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                            <Edit size={16} /> Editar Perfil
                                        </button>
                                        <button onClick={handleNavigateToTournaments} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                            <Trophy size={16} /> Mis Torneos
                                        </button>
                                        <a
                                            href="https://wa.me/34683367026"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                                        >
                                            <MessageCircle size={16} /> Contactar Soporte
                                        </a>
                                        <div className="h-px bg-white/5 my-2"></div>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                                            <LogOut size={16} /> Cerrar Sesión
                                        </button>
                                    </div>

                                    <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-[#1a1a20] border-r border-b border-white/10 rotate-45"></div>
                                </div>
                            )}

                            <button
                                onClick={toggleMobileMoreMenu}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isMobileMoreMenuOpen ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
                            >
                                <div className={`p-1.5 rounded-full ${isMobileMoreMenuOpen ? 'bg-blue-500/10' : ''}`}>
                                    <Menu size={20} />
                                </div>
                                <span className="text-[10px] font-bold">Menú</span>
                            </button>
                        </div>
                    </nav>

                </div>
            </div>
            <EditProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
            <UnsavedChangesModal
                isOpen={isUnsavedModalOpen}
                onClose={() => setIsUnsavedModalOpen(false)}
                onConfirm={confirmNavigation}
            />
        </>
    );
};

export const B5ToolsBuilderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return (
        <BuilderProvider initialId={id}>
            <ToastProvider>
                <BuilderWizard />
            </ToastProvider>
        </BuilderProvider>
    );
};
