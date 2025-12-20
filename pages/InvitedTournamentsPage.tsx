import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { UserNavbar } from '../components/UserNavbar'; // Using UserNavbar
import { ParticlesBackground } from '../components/ParticlesBackground'; // Consistent layout
import { Loader2, ShieldCheck, UserCog, ArrowLeft } from 'lucide-react';

interface InvitedTournament {
    id: string;
    role: 'admin' | 'referee';
    specific_role?: string; // 'admin'|'moderator' OR 'umpire'|'scorer'
    tournament: {
        id: string;
        name: string;
        location: string;
        start_date: string;
    };
}

export const InvitedTournamentsPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [invitations, setInvitations] = useState<InvitedTournament[]>([]);

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || (!user.email && !user.user_metadata?.email)) {
                setLoading(false);
                return;
            }

            const userEmail = user.email || user.user_metadata.email;

            // 1. Fetch Admin Invitations (by email matching)
            // Assuming tournament_admins table has 'email' column
            const { data: adminData, error: adminError } = await supabase
                .from('tournament_admins')
                .select(`
                    id,
                    role,
                    tournament:tournaments!inner(id, name, location, start_date)
                `)
                .eq('email', userEmail);

            if (adminError) console.error("Error fetching admin invites:", adminError);

            // 2. Fetch Referee Invitations (by email matching)
            // Assuming tournament_referees links to profiles or has email. 
            // If tournament_referees links to 'referee_profile', we need to check that profile's email???
            // Or maybe there is a direct email column? 
            // Let's assume for now we might need to look up by ID if the referee profile is linked to Auth User ID.
            // BUT the prompt says "como estamos usando el correo pues al añadir a un user...".
            // So logic: Check tables where email matches.

            // Let's try to query 'referee_profiles' joined with 'tournament_referees'
            // OR if 'tournament_referees' has the email directly? Unlikely if it uses referee_id.

            // ALTERNATIVE: Check if the user ID matches a referee_profile, then use that ID.
            // Simplified approach: Search 'referee_profiles' for this user's email, get ID, then search 'tournament_referees'.
            const { data: refProfile } = await supabase
                .from('referee_profiles')
                .select('id')
                .eq('email', userEmail)
                .single();

            let refData: any[] = [];
            if (refProfile) {
                const { data, error } = await supabase
                    .from('tournament_referees')
                    .select(`
                        id,
                        role,
                        tournament:tournaments!inner(id, name, location, start_date)
                    `)
                    .eq('referee_id', refProfile.id);

                if (data) refData = data;
            }

            // Combine
            const combined: InvitedTournament[] = [];

            if (adminData) {
                adminData.forEach((item: any) => {
                    combined.push({
                        id: item.id,
                        role: 'admin',
                        specific_role: item.role,
                        tournament: item.tournament
                    });
                });
            }

            if (refData) {
                refData.forEach((item: any) => {
                    combined.push({
                        id: item.id,
                        role: 'referee',
                        specific_role: item.role, // umpire/scorer
                        tournament: item.tournament
                    });
                });
            }

            setInvitations(combined);

        } catch (err) {
            console.error("Error fetching invitations:", err);
        } finally {
            setLoading(false);
        }
    };

    const admins = invitations.filter(i => i.role === 'admin');
    const referees = invitations.filter(i => i.role === 'referee');

    return (
        <div className="min-h-screen w-full bg-[#0f0f13] text-white flex flex-col relative overflow-hidden">
            <ParticlesBackground />
            <UserNavbar />

            <main className="flex-1 relative z-10 p-6 md:p-12 max-w-7xl mx-auto w-full pt-24 md:pt-32">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Torneos Invitados
                    </h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Section: Admin */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                                    <ShieldCheck size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Como Administrador</h2>
                                <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">
                                    {admins.length}
                                </span>
                            </div>

                            {admins.length === 0 ? (
                                <p className="text-white/30 italic pl-12">No tienes invitaciones como administrador.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {admins.map(inv => (
                                        <div key={inv.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-orange-500/30 hover:bg-white/10 transition-all cursor-pointer group" onClick={() => navigate(`/dashboard/torneos/B5ToolsBuilder/${inv.tournament.id}`)}>
                                            <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{inv.tournament.name}</h3>
                                            <p className="text-sm text-white/50">{inv.tournament.location}</p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300 text-xs border border-orange-500/30 uppercase tracking-wider">
                                                    {inv.specific_role || 'Admin'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Section: Referee */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <UserCog size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Como Árbitro / Anotador</h2>
                                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">
                                    {referees.length}
                                </span>
                            </div>

                            {referees.length === 0 ? (
                                <p className="text-white/30 italic pl-12">No tienes invitaciones como árbitro.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {referees.map(inv => (
                                        <div key={inv.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-blue-500/30 hover:bg-white/10 transition-all cursor-pointer group">
                                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{inv.tournament.name}</h3>
                                            <p className="text-sm text-white/50">{inv.tournament.location}</p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30 uppercase tracking-wider">
                                                    {inv.specific_role === 'umpire' ? 'Árbitro' : inv.specific_role === 'scorer' ? 'Anotador' : inv.specific_role}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
