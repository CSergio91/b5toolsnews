import React, { useState } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { Users, UserPlus, Trash2, Shirt, User, CheckCircle } from 'lucide-react';
import { TournamentRoster } from '../../types/tournament';
import { GlobalImageUploader } from '../GlobalImageUploader';

export const PlayerManagementStep: React.FC = () => {
    const { state, teams, addPlayer, removePlayer, updatePlayer } = useBuilder() as any;
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams.length > 0 ? teams[0].id : null);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [number, setNumber] = useState('');
    const [gender, setGender] = useState<'M' | 'F'>('M'); // Strict consistency
    const [photoUrl, setPhotoUrl] = useState(''); // New State
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
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="text-blue-400" /> Plantillas de Jugadores
                    </h2>
                    <p className="text-white/50 text-sm mt-1">Gestiona los rosters de cada equipo (Máx 10).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full min-h-0">
                {/* 1. Team Selector (Left Panel) */}
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
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
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex justify-between">
                                    <span>Añadir a {selectedTeam.name}</span>
                                    <span className={teamPlayers.length >= maxPlayers ? 'text-red-400' : 'text-green-400'}>
                                        {teamPlayers.length} / {maxPlayers} Espacios
                                    </span>
                                </h3>

                                <div className="grid grid-cols-12 gap-4">
                                    {/* Photo Uploader for New Player */}
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
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-12 md:col-span-3">
                                        <input
                                            placeholder="Apellidos"
                                            value={lastName} onChange={e => setLastName(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <input
                                            placeholder="#"
                                            type="number"
                                            value={number} onChange={e => setNumber(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 text-center font-mono"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-2">
                                        <select
                                            value={gender}
                                            onChange={(e: any) => setGender(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                                        >
                                            <option value="M">M</option>
                                            <option value="F">F</option>
                                        </select>
                                    </div>
                                    <div className="col-span-12">
                                        <button
                                            onClick={handleAddPlayer}
                                            disabled={teamPlayers.length >= maxPlayers || !firstName || !number}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <UserPlus size={16} /> Añadir Jugador
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Roster List */}
                            <div className="flex-1 bg-black/20 rounded-2xl border border-white/10 overflow-hidden flex flex-col">
                                <div className="p-3 bg-white/5 border-b border-white/5 grid grid-cols-12 gap-4 text-xs font-bold text-white/40 uppercase">
                                    <div className="col-span-1 text-center">#</div>
                                    <div className="col-span-1 text-center">Img</div>
                                    <div className="col-span-5">Nombre Completo</div>
                                    <div className="col-span-2 text-center">Gen</div>
                                    <div className="col-span-3 text-right"></div>
                                </div>
                                <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar flex-1">
                                    {teamPlayers.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-40 text-white/20">
                                            <Shirt size={32} className="mb-2 opacity-20" />
                                            <p className="text-sm">Roster vacío</p>
                                        </div>
                                    )}
                                    {teamPlayers.map((player: TournamentRoster) => (
                                        <div key={player.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                            <div className="col-span-1 font-mono text-center font-bold text-blue-400 bg-blue-500/10 rounded py-1">{player.number}</div>
                                            <div className="col-span-1 flex justify-center">
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
                                            <div className="col-span-5 font-medium text-white">{player.first_name} {player.last_name}</div>
                                            <div className="col-span-2 text-center text-xs text-white/50">{player.gender}</div>
                                            <div className="col-span-3 flex justify-end">
                                                <button
                                                    onClick={() => removePlayer(player.id)}
                                                    className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                            <Users size={48} className="mb-4 opacity-20" />
                            <p>Selecciona un equipo para gestionar sus jugadores</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
