import React from 'react';

interface CustomSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    showText?: boolean;
}

export const CustomSpinner: React.FC<CustomSpinnerProps> = ({ size = 'large', showText = true }) => {
    // Size maps
    const sizeClasses = {
        small: 'w-8 h-8',
        medium: 'w-16 h-16',
        large: 'w-32 h-32'
    };

    const logoSizes = {
        small: 'w-4',
        medium: 'w-8',
        large: 'w-16'
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 relative z-50">
            <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
                {/* Outer Ring 1 - Slow Spin Reverse */}
                <div className="absolute inset-0 rounded-full border-4 border-t-purple-500/30 border-r-transparent border-b-indigo-500/30 border-l-transparent animate-[spin_3s_linear_infinite_reverse]"></div>

                {/* Middle Ring - Fast Spin */}
                <div className="absolute inset-2 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-indigo-500 border-l-transparent animate-spin"></div>

                {/* Inner Glow Pulse */}
                <div className="absolute inset-4 rounded-full bg-purple-500/10 blur-xl animate-pulse"></div>

                {/* Logo in Center */}
                <div className={`relative z-10 ${logoSizes[size]} aspect-square animate-pulse`}>
                    <img src="/logo.png" alt="Loading..." className="w-full h-full object-contain" />
                </div>
            </div>

            {showText && (
                <div className="flex flex-col items-center gap-1">
                    <span className="text-white text-lg font-bold tracking-widest animate-pulse">CARGANDO</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[bounce_1s_infinite_0ms]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-[bounce_1s_infinite_200ms]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[bounce_1s_infinite_400ms]"></div>
                    </div>
                </div>
            )}
        </div>
    );
};
