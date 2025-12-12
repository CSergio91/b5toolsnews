import React, { useEffect, useState, useRef } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { generateSingleEliminationBracket, TempMatch } from '../../utils/bracketGenerator';
import { ZoomIn, ZoomOut, Move, RefreshCcw } from 'lucide-react';

export const BracketStep: React.FC = () => {
    const { state, teams } = useBuilder();
    const [bracketMatches, setBracketMatches] = useState<TempMatch[]>([]);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Auto-generate on mount (if empty)
        // In real app we check if state.matches exists
        const generated = generateSingleEliminationBracket(teams as any[]); // Cast for now
        setBracketMatches(generated);
    }, [teams]);

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(z => Math.min(Math.max(z * delta, 0.5), 2));
        } else {
            setPan(p => ({ ...p, x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        setPan(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    // Group by Rounds for Column Layout
    // We assume 3 rounds = 3 columns
    const rounds = Array.from(new Set(bracketMatches.map(m => m.round))).sort((a, b) => a - b);

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-700">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl z-10 relative">
                <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => z - 0.1)} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"><ZoomOut size={18} /></button>
                    <span className="text-xs font-mono text-white/50 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => z + 0.1)} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"><ZoomIn size={18} /></button>
                </div>
                <div className="text-sm font-bold text-white/40 uppercase tracking-widest">
                    Vista Previa del Bracket
                </div>

                <button
                    onClick={() => setBracketMatches(generateSingleEliminationBracket(teams as any[]))}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-blue-400"
                    title="Regenerar"
                >
                    <RefreshCcw size={18} />
                </button>
            </div>

            {/* Canvas */}
            <div
                className="flex-1 bg-[#15151a] rounded-xl border border-white/5 overflow-hidden relative cursor-grab active:cursor-grabbing"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                        backgroundPosition: `${pan.x}px ${pan.y}px`
                    }}
                />

                <div
                    className="absolute top-0 left-0 transition-transform duration-75 origin-top-left"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        width: '5000px', // Large canvas
                        height: '5000px'
                    }}
                >
                    <div className="flex gap-16 p-20">
                        {rounds.map(roundNum => {
                            const matchesInRound = bracketMatches.filter(m => m.round === roundNum).sort((a, b) => a.match_number - b.match_number);
                            return (
                                <div key={roundNum} className="flex flex-col justify-around w-64">
                                    <h4 className="text-center text-white/20 font-bold uppercase mb-8 tracking-widest text-xs">Ronda {roundNum}</h4>
                                    {matchesInRound.map(match => (
                                        <div key={match.id} className="relative bg-[#222] border border-white/10 rounded-lg p-0 mb-8 shadow-2xl hover:border-blue-500/50 transition-colors group">

                                            {/* Connector Lines (Left - Incoming) */}
                                            {/* Simplified logic: CSS lines difficult without exact positions. 
                                            For this 'Standard Tree' layout, flexbox justify-around naturally aligns them somewhat, 
                                            but perfect connectors require SVG or calculated heights.
                                            We will show the Cards first.
                                        */}

                                            <div className="flex flex-col text-xs">
                                                <div className={`p-3 border-b border-white/5 flex justify-between items-center ${match.visitorTeamId === 'BYE' ? 'opacity-30' : ''}`}>
                                                    <span className="font-bold text-white truncate max-w-[120px]">
                                                        {getTeamName(match.visitorTeamId, teams)}
                                                    </span>
                                                    <span className="text-white/20">VS</span>
                                                </div>
                                                <div className={`p-3 flex justify-between items-center ${match.localTeamId === 'BYE' ? 'opacity-30' : ''}`}>
                                                    <span className="font-bold text-white truncate max-w-[120px]">
                                                        {getTeamName(match.localTeamId, teams)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Match Info Footer */}
                                            <div className="px-3 py-1 bg-black/40 rounded-b-lg border-t border-white/5 text-[10px] text-white/30 flex justify-between">
                                                <span>#{match.match_number}</span>
                                                <span>Por definir</span>
                                            </div>

                                            {/* Connector Right (Outgoing) */}
                                            {match.nextMatchId && (
                                                <div className="absolute -right-4 top-1/2 w-4 h-[2px] bg-white/10 group-hover:bg-blue-500/20"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper
const getTeamName = (id: string | null | undefined, teams: any[]) => {
    if (!id) return 'TBD';
    if (id === 'BYE') return 'BYE';
    const t = teams.find(team => team.id === id);
    return t ? t.name : 'Unknown';
}
