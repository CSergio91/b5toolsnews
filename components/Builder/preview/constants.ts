export const TEAMS = [
    { id: '1', name: 'Thunderbolts', record: '4-0', points: 12, logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=100&auto=format&fit=crop' },
    { id: '2', name: 'Vipers', record: '3-1', points: 9, logo: 'https://images.unsplash.com/photo-1562077772-3bd3053545b6?q=80&w=100&auto=format&fit=crop' },
    { id: '3', name: 'Cobras', record: '2-2', points: 6, logo: 'https://images.unsplash.com/photo-1517926224355-667cb7c82c3f?q=80&w=100&auto=format&fit=crop' },
    { id: '4', name: 'Eagles', record: '1-3', points: 3, logo: 'https://images.unsplash.com/photo-1508802280962-da5675c58048?q=80&w=100&auto=format&fit=crop' },
    { id: '5', name: 'Sharks', record: '0-4', points: 0, logo: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?q=80&w=100&auto=format&fit=crop' },
];

export const SCHEDULE_ITEMS = [
    { id: 1, time: '10:00 AM', title: 'Opening Ceremony', subtitle: 'Main Stadium', status: 'completed' },
    { id: 2, time: '11:30 AM', title: 'Group A: TBD vs TBD', subtitle: 'Field 1', status: 'active' },
    { id: 3, time: '01:00 PM', title: 'Lunch Break', subtitle: 'Food Court', status: 'pending' },
    { id: 4, time: '02:30 PM', title: 'Group B: Match 2', subtitle: 'Field 2', status: 'pending' },
];

export const TEAM_LIST_ITEMS = [
    { name: 'Thunderbolts', status: 'active' },
    { name: 'Vipers', status: 'active' },
    { name: 'Cobras', status: 'inactive' },
    { name: 'Eagles', status: 'inactive' },
    { name: 'Sharks', status: 'eliminated' },
    { name: 'Tigers', status: 'active' },
    { name: 'Lions', status: 'active' },
];

export const QUALIFICATIONS = [
    { id: 'SF1', round: 'SF', team1Name: 'Thunderbolts', team2Name: 'Vipers', time: '14:00', details: 'Field 1' },
    { id: 'SF2', round: 'SF', team1Name: 'Cobras', team2Name: 'Eagles', time: '15:30', details: 'Field 2' },
];

export const ACTIVE_MATCH = {
    id: 'A12',
    team1: { name: 'Thunderbolts', logo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=100&auto=format&fit=crop' },
    team2: { name: 'Vipers', logo: 'https://images.unsplash.com/photo-1562077772-3bd3053545b6?q=80&w=100&auto=format&fit=crop' },
    score1: 5,
    score2: 3,
    inning: 3,
    time: 'Live Now',
    field: 'Stadium Central',
    referee: 'M. Johnson'
};
