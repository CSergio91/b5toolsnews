import React, { useMemo, useState, useEffect } from 'react';
import { TournamentPhase } from '../../types/structure';
import { TieBreakerRule } from '../../types/tournament';
import { useBuilder } from '../../context/BuilderContext';
import { sortTeamsWithTieBreaker } from '../../utils/tieBreakerLogic';
import { calculateTeamStats, TeamStats, getSortedStandings } from '../../utils/tournamentStats';
import { AlertTriangle, HelpCircle, Loader2, Check } from 'lucide-react';

interface ClassificationTableProps {
    phases: TournamentPhase[];
    simulationResults?: Record<string, string>;
    isSimulation?: boolean;
    groupName?: string; // Optional filter
}

// ... helper ...

export const ClassificationTable: React.FC<ClassificationTableProps> = ({ phases, simulationResults, isSimulation, groupName }) => {
    const { state, updateConfig } = useBuilder();
    const config = state.config;

    // ... state ...
    const [activeRuleOverride, setActiveRuleOverride] = useState<TieBreakerRule | null>(null);
    const [analyzingRule, setAnalyzingRule] = useState<string | null>(null);
    const [previewRule, setPreviewRule] = useState<TieBreakerRule | null>(null);

    // ... effect ...
    useEffect(() => {
        if (!isSimulation && activeRuleOverride) {
            setActiveRuleOverride(null);
            setPreviewRule(null);
        }
    }, [isSimulation]);

    const stats = useMemo(() => {
        const raw = calculateTeamStats(phases, state.teams, simulationResults, config);
        // Use previewRule if available, otherwise activeOverride, otherwise fallback to config
        let rulesToUse = config.tiebreaker_rules || [];

        if (previewRule) {
            // Previewing a specific rule
            rulesToUse = [previewRule];
        } else if (activeRuleOverride) {
            // Rule applied
            rulesToUse = [activeRuleOverride];
        }

        const sorted = getSortedStandings(raw, rulesToUse);

        // Filter by group if prop is present
        if (groupName) {
            return sorted.filter(s => s.group === groupName);
        }
        return sorted;
    }, [phases, state.teams, simulationResults, config, activeRuleOverride, previewRule, groupName]);

    const hasTies = useMemo(() => {
        // Simple check: are there teams with same points?
        // (This check assumes sorted stats)
        for (let i = 0; i < stats.length - 1; i++) {
            if (stats[i].points === stats[i + 1].points && stats[i].group === stats[i + 1].group) return true;
        }
        return false;
    }, [stats]);

    // Find groups of ties for display
    const ties = useMemo(() => {
        if (!hasTies) return [];

        // Simpler approach for UI: Filter teams that share points with at least one other team
        const tieMap = new Map<string, TeamStats[]>();
        stats.forEach(t => {
            const key = `${t.group}-${t.points}`;
            if (!tieMap.has(key)) tieMap.set(key, []);
            tieMap.get(key)!.push(t);
        });

        const result = [];
        tieMap.forEach((teams, key) => {
            if (teams.length > 1) {
                const [group, points] = key.split('-');
                result.push({ points: parseInt(points), group, teams });
            }
        });

        return result;
    }, [stats, hasTies]);

    const handleRuleClick = (rule: any) => {
        if (analyzingRule) return;
        setAnalyzingRule(rule.type);
        setPreviewRule(null); // Clear previous preview

        // Simulate analysis
        setTimeout(() => {
            setAnalyzingRule(null);
            setPreviewRule({ ...rule, active: true });
        }, 1500);
    };

    const handleApplyRule = () => {
        if (previewRule) {
            setActiveRuleOverride(previewRule);
            setPreviewRule(null);
        }
    };

    if (stats.length === 0) return null;

    return (
        <div className="flex gap-4 items-start w-full transition-all">
            {/* Main Table */}
            <div className={`bg-[#1a1a20] rounded-lg border border-white/10 overflow-hidden flex-1 transition-all`}>
                <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Tabla de Clasificación</h3>
                    <span className="text-[10px] text-white/30 uppercase">General</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase text-white/40 bg-white/5 font-bold">
                            <tr>
                                <th className="px-4 py-2 w-10 text-center">#</th>
                                <th className="px-4 py-2 w-10 text-center">Grp</th>
                                <th className="px-4 py-2">Equipo</th>
                                <th className="px-2 py-2 w-12 text-center" title="Juegos Jugados">JJ</th>
                                <th className="px-2 py-2 w-12 text-center" title="Juegos Ganados">JG</th>
                                <th className="px-2 py-2 w-12 text-center" title="Juegos Perdidos">JP</th>
                                <th className="px-4 py-2 w-16 text-center text-white" title="Puntos">PTS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {stats.map((stat, idx) => (
                                <tr key={stat.id} className={`transition-colors ${previewRule ? 'animate-in fade-in duration-500' : ''} hover:bg-white/5`}>
                                    <td className="px-4 py-2 text-center font-bold text-white/50">{idx + 1}</td>
                                    <td className="px-4 py-2 text-center font-bold text-white/30">{stat.group}</td>
                                    <td className="px-4 py-2 font-medium text-white/80 flex items-center gap-2">
                                        {stat.name}
                                        {/* Show simple diff indicator if previewing? Optional */}
                                    </td>
                                    <td className="px-2 py-2 text-center text-white/50">{stat.played}</td>
                                    <td className="px-2 py-2 text-center text-green-400/70">{stat.won}</td>
                                    <td className="px-2 py-2 text-center text-red-400/70">{stat.lost}</td>
                                    <td className="px-4 py-2 text-center font-bold text-white bg-white/5">{stat.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tie Breaker Zone */}
            {isSimulation && hasTies && !activeRuleOverride && (
                <div className="w-[500px] bg-[#1a1a20] rounded-lg border border-yellow-500/30 overflow-hidden animate-in fade-in slide-in-from-right-4 shadow-xl">
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 border-b border-yellow-500/20">
                        <div className="flex items-center gap-2 text-yellow-500">
                            <HelpCircle size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">Desempate Requerido</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-white/5">
                        {/* Column 1: Tied Teams */}
                        <div className="p-4 space-y-3">
                            {ties.map((tie, idx) => (
                                <div key={idx} className="bg-white/5 rounded p-2 border border-white/5">
                                    <div className="text-[10px] uppercase font-bold text-white/40 mb-1">
                                        Empate en {tie.points} pts (Grp {tie.group})
                                    </div>
                                    <div className="space-y-1">
                                        {tie.teams.map(t => (
                                            <div key={t.id} className="text-xs text-white pl-2 border-l-2 border-yellow-500/50">
                                                {t.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Column 2: Rules */}
                        <div className="p-4 flex flex-col gap-2 justify-center">
                            <div className="text-[10px] uppercase font-bold text-white/40 mb-2 text-center">Analizar por Regla</div>
                            {(config.tiebreaker_rules || []).map((rule: any) => {
                                const ruleLabels: Record<string, string> = {
                                    'direct_match': 'Resultado Directo',
                                    'run_diff': 'Diferencia de Carreras',
                                    'runs_scored': 'Carreras Anotadas',
                                    'random': 'Sorteo Aleatorio'
                                };
                                const isAnalyzing = analyzingRule === rule.type;
                                const isPreviewing = previewRule?.type === rule.type;

                                return (
                                    <button
                                        key={rule.type}
                                        onClick={() => handleRuleClick(rule)}
                                        disabled={!!analyzingRule}
                                        className={`w-full p-2 text-xs text-left rounded border transition-all flex items-center justify-between group relative overflow-hidden ${isPreviewing
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500'
                                            : 'bg-white/5 border-white/10 text-white/70 hover:border-yellow-500/50 hover:text-white disabled:opacity-50'
                                            }`}
                                    >
                                        <span>{ruleLabels[rule.type] || rule.label || rule.type}</span>
                                        {isAnalyzing && <Loader2 size={12} className="animate-spin text-yellow-500" />}
                                        {isPreviewing && !isAnalyzing && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                                    </button>
                                );
                            })}

                            {/* Confirmation Button */}
                            {previewRule && (
                                <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-bottom-2 fade-in">
                                    <button
                                        onClick={handleApplyRule}
                                        className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center justify-center gap-2 transition-all">
                                        <Check size={14} /> Aplicar Regla
                                    </button>
                                    <div className="text-[10px] text-center text-white/30 mt-2">
                                        Se actualizará la tabla
                                    </div>
                                </div>
                            )}

                            {(!config.tiebreaker_rules || config.tiebreaker_rules.length === 0) && (
                                <div className="text-xs text-white/30 text-center italic">No hay reglas configuradas</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
