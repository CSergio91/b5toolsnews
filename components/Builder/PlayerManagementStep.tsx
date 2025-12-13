import React, { useState } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { Users, UserPlus, Trash2, Shirt, User, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { TournamentRoster } from '../../types/tournament';
import { GlobalImageUploader } from '../GlobalImageUploader';

export const PlayerManagementStep: React.FC = () => {
    const { state, teams, addPlayer, removePlayer, updatePlayer } = useBuilder() as any;
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams.length > 0 ? teams[0].id : null);

    // Mobile Team Selector State
    const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [number, setNumber] = useState('');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [photoUrl, setPhotoUrl] = useState('');
    const [role, setRole] = useState<'player' | 'coach' | 'staff'>('player');

    const selectedTeam = teams.find((t: any) => t.id === selectedTeamId);
    const teamPlayers = state.rosters.filter((r: any) => r.team_id === selectedTeamId);
    const maxPlayers = 10;

    const handleAddPlayer = () => {
        if (!selectedTeamId || !firstName || !lastName || !number) return;
        if (teamPlayers.length >= maxPlayers) {
            alert("Máximo 10 jugadores por equipo.");
            return;
        }

        addPlayer({
            id: crypto.randomUUID(),
            team_id: selectedTeamId,
            first_name: firstName,
            last_name: lastName,
            number: number,
            gender: gender,
            photo_url: photoUrl,
            role: role
        });

        // Reset form but keep team selected
        setFirstName('');
        setLastName('');
        setNumber('');
        setPhotoUrl('');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
            <div className="flex justify-between items-end mb-4 lg:mb-6">
                <div>
                    <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                        <Users className="text-blue-400" /> Plantillas
                    </h2>
                    <p className="text-white/50 text-xs lg:text-sm mt-1">Gestiona los rosters (Máx 10).</p>
                </div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 h-full min-h-0 pb-20 lg:pb-0 overflow-y-auto lg:overflow-hidden">

                <div className="lg:hidden relative mb-4 z-50">
                    <button
                        onClick={() => setIsTeamSelectorOpen(!isTeamSelectorOpen)}
                        className="w-full flex justify-between items-center p-4 bg-[#1a1a20] rounded-2xl border border-white/10 shadow-lg relative z-50 text-white"
                    >
                        <span className="font-bold text-sm uppercase">
                            {selectedTeam ? `Equipo: ${selectedTeam.name}` : 'Selecciona Equipo'}
                        </span>
                        {isTeamSelectorOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isTeamSelectorOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#25252b] rounded-xl border border-white/10 shadow-2xl overflow-hidden z-[100] max-h-[60vh] flex flex-col">
                            <div className="p-2 overflow-y-auto custom-scrollbar">
                                {teams.map((team: any) => (
                                    <button
                                        key={team.id}
                                        onClick={() => { setSelectedTeamId(team.id); setIsTeamSelectorOpen(false); }}
                                        className={`w-full text-left p-3 rounded-lg mb-1 text-sm font-medium ${selectedTeamId === team.id ? 'bg-blue-600 text-white' : 'text-white/80 hover:bg-white/10'}`}
                                    >
                                        {team.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop: Full Sidebar List */}
                <div className="hidden lg:flex bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex-col h-full">
                    <div className="p-4 bg-white/5 border-b border-white/5 text-xs font-bold text-white/40 uppercase">
                        Selecciona un Equipo
                    </div>
                    <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar flex-1">
                        {teams.map((team: any, idx: number) => {
                            const count = state.rosters.filter((r: any) => r.team_id === team.id).length;
                            return (
                                <button
                                    key={team.id}
                                    onClick={() => setSelectedTeamId(team.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${selectedTeamId === team.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-xs opacity-50">{(idx + 1).toString().padStart(2, '0')}</div>
                                        <div className="font-bold truncate max-w-[120px]">{team.name}</div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded-full ${count === maxPlayers ? 'bg-red-500/20 text-red-200' : 'bg-black/20'}`}>
                                        {count}/{maxPlayers}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Player Manager (Right Panel) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {selectedTeam ? (
                        <>
                            {/* Add Player Form */}
                            <div className="bg-white/5 p-4 lg:p-6 rounded-2xl border border-white/10">
                                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex justify-between">
                                    <span className="hidden md:inline">Añadir a {selectedTeam.name}</span>
                                    <span className="md:hidden">Añadir Jugador</span>
                                    <span className={`text-xs md:text-sm ${teamPlayers.length >= maxPlayers ? 'text-red-400' : 'text-green-400'}`}>
                                        {teamPlayers.length} / {maxPlayers}
                                    </span>
                                </h3>

                                <div className="grid grid-cols-12 gap-3 lg:gap-4">
                                    {/* Photo Uploader */}
                                    <div className="col-span-12 md:col-span-2 flex justify-center">
                                        <GlobalImageUploader
                                            currentUrl={photoUrl}
                                            onUpload={setPhotoUrl}
                                            bucketName="player-photos"
                                            label="Foto"
                                            rounded={true}
                                            className="w-16 h-16"
                                            localMode={true}
                                        />
                                    </div>

                                    <div className="col-span-12 md:col-span-3">
                                        <input
                                            placeholder="Nombre"
                                            value={firstName} onChange={e => setFirstName(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 md:p-2.5 text-white outline-none focus:border-blue-500 text-sm"
                                        />
                                    </div>
                                    <div className="col-span-12 md:col-span-3">
                                        <input
                                            placeholder="Apellidos"
                                            value={lastName} onChange={e => setLastName(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 md:p-2.5 text-white outline-none focus:border-blue-500 text-sm"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <input
                                            placeholder="#"
                                            type="number"
                                            value={number} onChange={e => setNumber(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 md:p-2.5 text-white outline-none focus:border-blue-500 text-center font-mono text-sm"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <select
                                            value={gender}
                                            onChange={(e: any) => setGender(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 md:p-2.5 text-white outline-none focus:border-blue-500 text-sm"
                                        >
                                            <option value="M">M</option>
                                            <option value="F">F</option>
                                        </select>
                                    </div>
                                    <div className="col-span-12">
                                        <button
                                            onClick={handleAddPlayer}
                                            disabled={teamPlayers.length >= maxPlayers || !firstName || !number}
                                            className="w-full py-3 md:py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <UserPlus size={16} /> Añadir Jugador
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Roster List */}
                            <div className="flex-1 bg-black/20 rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[400px] lg:h-auto">
                                <div className="hidden lg:grid grid-cols-12 gap-4 p-3 bg-white/5 border-b border-white/5 text-xs font-bold text-white/40 uppercase">
                                    <div className="col-span-1 text-center">#</div>
                                    <div className="col-span-1 text-center">Img</div>
                                    <div className="col-span-5">Nombre Completo</div>
                                    <div className="col-span-2 text-center">Gen</div>
                                    <div className="col-span-3 text-right"></div>
                                </div>
                                <div className="lg:hidden p-3 bg-white/5 border-b border-white/5 text-xs font-bold text-white/40 uppercase">
                                    Jugadores ({teamPlayers.length})
                                </div>

                                <div className="overflow-y-auto p-2 space-y-2 lg:space-y-1 custom-scrollbar flex-1">
                                    {teamPlayers.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-40 text-white/20">
                                            <Shirt size={32} className="mb-2 opacity-20" />
                                            <p className="text-sm">Roster vacío</p>
                                        </div>
                                    )}
                                    {teamPlayers.map((player: TournamentRoster) => (
                                        <div key={player.id} className="grid grid-cols-12 gap-2 lg:gap-4 items-center p-3 rounded-lg hover:bg-white/5 transition-colors group bg-white/[0.02] lg:bg-transparent border border-white/5 lg:border-transparent">

                                            {/* Mobile: Number + Image + Name on one line-ish */}
                                            <div className="col-span-2 lg:col-span-1 font-mono text-center font-bold text-blue-400 bg-blue-500/10 rounded py-1 text-sm">{player.number}</div>

                                            <div className="col-span-2 lg:col-span-1 flex justify-center">
                                                <GlobalImageUploader
                                                    currentUrl={player.photo_url}
                                                    onUpload={(url) => updatePlayer(player.id, { photo_url: url })}
                                                    bucketName="player-photos"
                                                    rounded={true}
                                                    className="w-8 h-8"
                                                    label=""
                                                    localMode={true}
                                                />
                                            </div>

                                            <div className="col-span-6 lg:col-span-5 font-medium text-white text-sm truncate pl-2">{player.first_name} {player.last_name}</div>

                                            <div className="hidden lg:block col-span-2 text-center text-xs text-white/50">{player.gender}</div>

                                            <div className="col-span-2 lg:col-span-3 flex justify-end">
                                                <button
                                                    onClick={() => removePlayer(player.id)}
                                                    className="p-1.5 text-white/20 hover:text-red-400 transition-colors bg-white/5 lg:bg-transparent rounded lg:rounded-none"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-white/30 border border-dashed border-white/10 rounded-2xl p-10">
                            <Users size={48} className="mb-4 opacity-20" />
                            <p>Selecciona un equipo para gestionar sus jugadores</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
