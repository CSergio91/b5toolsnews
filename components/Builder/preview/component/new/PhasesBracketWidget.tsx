import React from 'react';
import { useBuilder } from '../../../../../context/BuilderContext';

interface Props {
    mode?: 'mobile' | 'desktop';
}

export const PhasesBracketWidget: React.FC<Props> = ({ mode = 'desktop' }) => {
    const { state } = useBuilder();

    return (
        <div className="h-full w-full flex flex-col p-6 text-white bg-gradient-to-br from-purple-900/10 to-blue-900/10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <span className="material-icons-round text-purple-400">emoji_events</span>
                    Fases Finales
                </h3>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
                {/* Simplified Bracket Visualization */}
                <div className="flex gap-4 items-center w-full justify-center opacity-80 scale-90 lg:scale-100 transition-transform">
                    {/* Semis Column */}
                    <div className="flex flex-col gap-8">
                        <div className="w-24 h-16 bg-white/5 border border-white/10 rounded-lg flex flex-col justify-center px-2 relative">
                            <div className="text-[10px] text-gray-400 mb-1">Semi 1</div>
                            <div className="h-1 bg-gray-600 rounded mb-1 w-3/4"></div>
                            <div className="h-1 bg-gray-600 rounded w-1/2"></div>
                            {/* Connector */}
                            <div className="absolute -right-4 top-1/2 w-4 h-[1px] bg-gray-600"></div>
                            <div className="absolute -right-4 top-1/2 h-full w-[1px] bg-gray-600 origin-top transform translate-y-0 height-[calc(50%+1rem)]"></div> {/* CSS trickery needed for real lines */}
                        </div>
                        <div className="w-24 h-16 bg-white/5 border border-white/10 rounded-lg flex flex-col justify-center px-2 relative">
                            <div className="text-[10px] text-gray-400 mb-1">Semi 2</div>
                            <div className="h-1 bg-gray-600 rounded mb-1 w-3/4"></div>
                            <div className="h-1 bg-gray-600 rounded w-1/2"></div>
                        </div>
                    </div>

                    {/* Final Column */}
                    <div className="flex flex-col gap-2">
                        <div className="w-28 h-20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg flex flex-col items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                            <span className="material-icons-round text-yellow-500 text-xl mb-1">emoji_events</span>
                            <div className="text-[10px] font-bold text-yellow-200">GRAN FINAL</div>
                        </div>
                    </div>
                </div>

                {/* Disclaimer Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <p className="text-xs text-center px-4 font-medium">El bracket se generará automáticamente al finalizar la fase de grupos.</p>
                </div>
            </div>
        </div>
    );
};
