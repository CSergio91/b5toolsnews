import React, { useState } from 'react';
import { ScoreCard } from '../components/ScoreCard';
import { useNavigate } from 'react-router-dom';
import { Home, Zap } from 'lucide-react';
import { RegistrationModal } from '../components/RegistrationModal';
import { supabase } from '../lib/supabase';
import { PromotionalCard } from '../components/PromotionalCard';

const ToastNotification: React.FC<{ message: string; isVisible: boolean; onClose: () => void; duration?: number }> = ({ message, isVisible, onClose, duration = 5000 }) => {
    React.useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-20 right-4 z-[9999] max-w-sm animate-in slide-in-from-right fade-in duration-300">
            <div className="bg-blue-900/90 border border-blue-500/30 p-4 rounded-lg shadow-2xl backdrop-blur-md flex gap-3 text-sm text-blue-100">
                <div className="shrink-0 mt-0.5 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                </div>
                <div className="flex-1">
                    <p className="font-semibold mb-1">Modo Local</p>
                    <p className="text-blue-200/80 leading-snug">{message}</p>
                </div>
                <button onClick={onClose} className="shrink-0 -mr-1 -mt-1 text-blue-400 hover:text-white transition-colors h-6 w-6 flex items-center justify-center rounded-full hover:bg-blue-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
            </div>
        </div>
    );
};

// Basic Error Boundary to catch crashes
interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public readonly state: ErrorBoundaryState = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    constructor(props: ErrorBoundaryProps) {
        super(props);
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ScoreKeeper Crash:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-8">
                    <div className="max-w-2xl w-full bg-red-900/20 border border-red-500/50 p-6 rounded-xl">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Algo salió mal en el ScoreKeeper</h1>
                        <p className="mb-4">Se ha producido un error inesperado. Por favor, reporta este mensaje al desarrollador.</p>
                        <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-[400px] font-mono text-xs text-red-200 whitespace-pre-wrap">
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold"
                        >
                            Recargar Página
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('b5_scorekeeper_set_1');
                                localStorage.removeItem('b5_scorekeeper_set_2');
                                localStorage.removeItem('b5_scorekeeper_set_3');
                                window.location.reload();
                            }}
                            className="mt-6 ml-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold border border-white/20"
                        >
                            Borrar Datos y Recargar (Reset Total)
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export const ScoreKeeperPage: React.FC = () => {
    const navigate = useNavigate();
    const [isConnected, setIsConnected] = React.useState<boolean | null>(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [showLocalModeAlert, setShowLocalModeAlert] = useState(true);
    const [showPromoCard, setShowPromoCard] = useState(false);

    React.useEffect(() => {
        import('../lib/supabase').then(({ checkConnection }) => {
            checkConnection().then(setIsConnected);
        });

        // Auth Check for Promo Card
        const checkAuth = async () => {
            const { data } = await supabase.auth.getUser();
            if (!data.user) {
                // Initial show after 5s if not logged in
                setTimeout(() => {
                    setShowPromoCard(true);
                }, 5000);
            }
        };
        checkAuth();
    }, []);

    const handleDismissPromo = () => {
        setShowPromoCard(false);
        // Reshow after 5 minutes (300,000 ms) if user is still on page
        setTimeout(() => {
            // Re-check auth just in case
            supabase.auth.getUser().then(({ data }) => {
                if (!data.user) setShowPromoCard(true);
            });
        }, 300000);
    };

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-purple-950 to-slate-950 text-white selection:bg-purple-500 selection:text-white relative bg-fixed">
            {/* Background decoration */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Navigation & Actions */}


            {/* Promotional Card (Replaces Floating Button) */}
            <PromotionalCard
                isVisible={showPromoCard}
                onClose={handleDismissPromo}
            />

            <div className="relative z-10 container mx-auto px-2 py-6 max-w-[1400px]">
                {/* Local Mode Alert */}
                {/* Local Mode Alert */}
                {/* Local Mode Toast Notification */}
                <ToastNotification
                    message="Modo Local Activo: Los datos se almacenan únicamente en tu dispositivo."
                    isVisible={showLocalModeAlert}
                    onClose={() => setShowLocalModeAlert(false)}
                    duration={5000}
                />



                <main className="transition-opacity duration-500 ease-in-out">
                    <ErrorBoundary>
                        <ScoreCard />
                    </ErrorBoundary>
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
