import React from 'react';
import { useLoading } from '../context/LoadingContext';
import { CustomSpinner } from './CustomSpinner';

export const GlobalLoader: React.FC = () => {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
            <CustomSpinner size="large" />
        </div>
    );
};
