import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Trophy, Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface OfficialScoreKeeperProps {
    matchId: string;
    setNumber: number;
    onBack: () => void;
}

export const OfficialScoreKeeper: React.FC<OfficialScoreKeeperProps> = ({ matchId, setNumber, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [matchData, setMatchData] = useState<any>(null);
    const [scoreData, setScoreData] = useState<any>(null);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Load Initial Data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Match Info
                const { data: match } = await supabase
                    .from('tournament_matches')
                    .select(`*, local_team:tournament_teams!local_team_id (*), visitor_team:tournament_teams!visitor_team_id (*)`)
                    .eq('id', matchId)
                    .single();

                setMatchData(match);

                // 2. Fetch or Create Set Record
                const { data: setRecord, error } = await supabase
                    .from('tournament_sets')
                    .select('*')
                    .eq('match_id', matchId)
                    .eq('set_number', setNumber)
                    .maybeSingle();

                if (setRecord) {
                    setScoreData(setRecord);
                } else {
                    // Initialize if not exists (Though ideally it should exist by now)
                    const { data: newSet } = await supabase
                        .from('tournament_sets')
                        .insert({
                            match_id: matchId,
                            set_number: setNumber,
                            away_score: 0, home_score: 0,
                            vis_inn1: 0, loc_inn1: 0
                            // Defaults handled by DB
                        })
                        .select()
                        .single();
                    setScoreData(newSet);
                }
            } catch (err) {
                console.error("Error loading official scorekeeper:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [matchId, setNumber]);

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase.channel(`official_set_${matchId}_${setNumber}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'tournament_sets',
                filter: `match_id=eq.${matchId}`
            }, (payload) => {
                if (payload.new.set_number === setNumber) {
                    // Merge remote changes carefully (or just replace if we trust DB as source of truth)
                    // For input fields, it's better to update ONLY if different to avoid cursor jumps, 
                    // but since this is the "Official" keeper, we can assume we are the primary writer.
                    // If multiple officials score same game, this keeps them in sync.
                    setScoreData(payload.new);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [matchId, setNumber]);

    // Direct DB Update Function
    const updateField = async (field: string, value: any) => {
        // Optimistic Update
        setScoreData((prev: any) => ({ ...prev, [field]: value }));
        setStatus('saving');

        try {
            // Recalculate Totals if strictly needed, or trust the user inputs? 
            // User wants "Saved as is".
            // But we should probably auto-sum the total score if innings are changed.

            let extraUpdates = {};
            if (field.startsWith('vis_inn') || field.startsWith('vis_ex')) {
                // Re-sum visitor score
                const currentData = { ...scoreData, [field]: value }; // use fresh value
                let total = 0;
                for (let i = 1; i <= 5; i++) total += (parseInt(currentData[`vis_inn${i}`]) || 0);
                for (let i = 6; i <= 10; i++) total += (parseInt(currentData[`vis_ex${i}`]) || 0);
                extraUpdates = { away_score: total };
                setScoreData((prev: any) => ({ ...prev, away_score: total }));
            }

            if (field.startsWith('loc_inn') || field.startsWith('loc_ex')) {
                // Re-sum local score
                const currentData = { ...scoreData, [field]: value };
                let total = 0;
                for (let i = 1; i <= 5; i++) total += (parseInt(currentData[`loc_inn${i}`]) || 0);
                for (let i = 6; i <= 10; i++) total += (parseInt(currentData[`loc_ex${i}`]) || 0);
                extraUpdates = { home_score: total };
                setScoreData((prev: any) => ({ ...prev, home_score: total }));
            }

            const { error } = await supabase
                .from('tournament_sets')
                .update({ [field]: value, ...extraUpdates })
                .eq('match_id', matchId)
                .eq('set_number', setNumber);

            if (error) throw error;
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            console.error("Error updating field:", err);
            setStatus('error');
        }
    };

    if (loading || !scoreData || !matchData) return <div className="p-10 text-white text-center">Cargando Hoja Oficial...</div>;

    const visitorName = matchData.visitor_team?.name || 'Visitante';
    const localName = matchData.local_team?.name || 'Local';

    return (
        <div className="min-h-screen bg-[#1e1e24] text-white p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={20} /> Volver
                </button>
                <div className="flex items-center gap-4">
                    {status === 'saving' && <span className="text-yellow-400 text-sm flex items-center gap-1"><Clock size={14} /> Guardando...</span>}
                    {status === 'saved' && <span className="text-green-400 text-sm flex items-center gap-1"><CheckCircle size={14} /> Guardado</span>}
                    {status === 'error' && <span className="text-red-400 text-sm flex items-center gap-1"><AlertTriangle size={14} /> Error de conexión</span>}
                    <div className="bg-purple-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-purple-500/20">
                        SET {setNumber}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto space-y-8">

                {/* Main Scoreboard Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="text-yellow-400" /> Marcador Oficial</h2>
                        <span className="text-xs text-white/40 uppercase tracking-widest">Conexión Directa DB</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-center">
                            <thead>
                                <tr className="bg-black/20 text-xs font-bold text-white/40 uppercase tracking-wider">
                                    <th className="p-4 text-left min-w-[150px]">Equipo</th>
                                    {Array.from({ length: 5 }).map((_, i) => <th key={i} className="p-4 w-12">{i + 1}</th>)}
                                    <th className="p-4 w-12 bg-white/5">C</th>
                                    <th className="p-4 w-12">H</th>
                                    <th className="p-4 w-12">E</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-lg font-mono">
                                {/* Visitor Row */}
                                <tr>
                                    <td className="p-4 text-left font-bold text-purple-300 truncate">{visitorName}</td>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <td key={i} className="p-2">
                                            <input
                                                className="w-full bg-transparent text-center focus:bg-white/10 rounded focus:outline-none focus:text-purple-300 transition-colors placeholder:text-white/10"
                                                placeholder="-"
                                                value={scoreData[`vis_inn${i + 1}`] || ''}
                                                onChange={(e) => updateField(`vis_inn${i + 1}`, parseInt(e.target.value) || 0)}
                                            />
                                        </td>
                                    ))}
                                    <td className="p-4 font-black bg-white/5 text-purple-400">{scoreData.away_score}</td>
                                    <td className="p-2">
                                        <input
                                            className="w-full bg-transparent text-center focus:bg-white/10 rounded focus:outline-none text-white/70 focus:text-white"
                                            value={scoreData.away_hits || ''}
                                            onChange={(e) => updateField('away_hits', parseInt(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            className="w-full bg-transparent text-center focus:bg-white/10 rounded focus:outline-none text-red-300/70 focus:text-red-300"
                                            value={scoreData.away_errors || ''}
                                            onChange={(e) => updateField('away_errors', parseInt(e.target.value) || 0)}
                                        />
                                    </td>
                                </tr>

                                {/* Local Row */}
                                <tr>
                                    <td className="p-4 text-left font-bold text-orange-300 truncate">{localName}</td>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <td key={i} className="p-2">
                                            <input
                                                className="w-full bg-transparent text-center focus:bg-white/10 rounded focus:outline-none focus:text-orange-300 transition-colors placeholder:text-white/10"
                                                placeholder="-"
                                                value={scoreData[`loc_inn${i + 1}`] || ''}
                                                onChange={(e) => updateField(`loc_inn${i + 1}`, parseInt(e.target.value) || 0)}
                                            />
                                        </td>
                                    ))}
                                    <td className="p-4 font-black bg-white/5 text-orange-400">{scoreData.home_score}</td>
                                    <td className="p-2">
                                        <input
                                            className="w-full bg-transparent text-center focus:bg-white/10 rounded focus:outline-none text-white/70 focus:text-white"
                                            value={scoreData.home_hits || ''}
                                            onChange={(e) => updateField('home_hits', parseInt(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            className="w-full bg-transparent text-center focus:bg-white/10 rounded focus:outline-none text-red-300/70 focus:text-red-300"
                                            value={scoreData.home_errors || ''}
                                            onChange={(e) => updateField('home_errors', parseInt(e.target.value) || 0)}
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Extra Innings Toggle / Expansion could go here if needed */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="text-blue-400" /> {visitorName}</h3>
                        <p className="text-white/40 text-sm">Roster y alineación se cargarán aquí en próximas versiones (lectura desde DB).</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="text-orange-400" /> {localName}</h3>
                        <p className="text-white/40 text-sm">Roster y alineación se cargarán aquí en próximas versiones (lectura desde DB).</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
