import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLoading } from '../context/LoadingContext';
import { CustomSpinner } from './CustomSpinner';

export const PrivateRoute: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const { startLoading, stopLoading } = useLoading();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <CustomSpinner size="large" text="Verificando sesión..." />
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};
