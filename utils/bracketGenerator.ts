export interface TempMatch {
    id: string;
    round: number;
    match_number: number;
    visitorTeamId?: string | 'BYE' | null;
    localTeamId?: string | 'BYE' | null;
    visitorSourceId?: string | null;
    localSourceId?: string | null;
    nextMatchId?: string | null;
    name: string;
    groupName?: string;
}

export interface GroupStructure {
    name: string;
    teams: string[]; // Team IDs
    matches: TempMatch[];
}

const generateId = () => crypto.randomUUID();

export const generateSingleEliminationBracket = (teams: any[]): TempMatch[] => {
    // ... (Existing logic for Single Elimination - kept compact for this tool update if possible, 
    // but I need to include the full file content to avoid breaking the file. 
    // I will copy the previous logic exactly.)

    const count = teams.length;
    let size = 2;
    while (size < count) size *= 2;

    const byes = size - count;
    const rounds = Math.log2(size);
    const matches: TempMatch[] = [];

    let teamPool = [...teams.map(t => t.id)];
    for (let i = 0; i < byes; i++) {
        teamPool.push('BYE');
    }

    const roundMatches: any[][] = [];

    for (let r = 1; r <= rounds; r++) {
        const matchesInRound = size / Math.pow(2, r);
        const currentRoundMatches = [];

        for (let m = 0; m < matchesInRound; m++) {
            const matchId = generateId();

            let roundName = `Ronda ${r}`;
            if (r === rounds) roundName = "Final";
            if (r === rounds - 1) roundName = "Semifinal";
            if (r === rounds - 2) roundName = "Cuartos";

            currentRoundMatches.push({
                id: matchId,
                round: r,
                match_number: m + 1,
                name: roundName,
                visitorTeamId: null,
                localTeamId: null,
                visitorSourceId: null,
                visitorSourceMatchId: null,
                localSourceId: null
            });
        }
        roundMatches.push(currentRoundMatches);
    }

    for (let r = 0; r < rounds - 1; r++) {
        const currentRound = roundMatches[r];
        const nextRound = roundMatches[r + 1];

        currentRound.forEach((match, index) => {
            const targetIndex = Math.floor(index / 2);
            const targetMatch = nextRound[targetIndex];

            if (index % 2 === 0) {
                targetMatch.visitorSourceId = match.id;
            } else {
                targetMatch.localSourceId = match.id;
            }
            match.nextMatchId = targetMatch.id;
        });
    }

    // Fill Round 1
    const round1 = roundMatches[0];
    round1.forEach((match, i) => {
        match.visitorTeamId = teamPool[i * 2];
        match.localTeamId = teamPool[(i * 2) + 1];
    });

    return roundMatches.flat();
};

// NEW: Helper function to generate matches for a specific list of teams (Berger System)
export const generateMatchesForOneGroup = (teams: string[], groupName: string): TempMatch[] => {
    if (teams.length === 0) return [];

    const groupTeams = [...teams];
    // If odd, add BYE
    if (groupTeams.length % 2 !== 0) {
        groupTeams.push('BYE');
    }

    const n = groupTeams.length;
    const rounds = n - 1;
    const matchesPerRound = n / 2;
    let matchCount = 1;

    const groupMatches: TempMatch[] = [];

    for (let r = 0; r < rounds; r++) {
        for (let m = 0; m < matchesPerRound; m++) {
            const home = groupTeams[m];
            const away = groupTeams[n - 1 - m];

            if (home !== 'BYE' && away !== 'BYE') {
                groupMatches.push({
                    id: generateId(),
                    round: r + 1,
                    match_number: matchCount++,
                    visitorTeamId: away,
                    localTeamId: home,
                    name: `J${r + 1} - G${groupName}`,
                    groupName: groupName
                });
            }
        }
        // Rotate
        groupTeams.splice(1, 0, groupTeams.pop()!);
    }

    return groupMatches;
}

export const generateGroupStage = (teams: any[], numberOfGroups: number): GroupStructure[] => {
    if (teams.length === 0) return [];

    const groups: GroupStructure[] = Array.from({ length: numberOfGroups }, (_, i) => ({
        name: String.fromCharCode(65 + i),
        teams: [],
        matches: []
    }));

    teams.forEach((team, index) => {
        const groupIndex = index % numberOfGroups;
        groups[groupIndex].teams.push(team.id);
    });

    // Use the helper for each group
    groups.forEach(group => {
        group.matches = generateMatchesForOneGroup(group.teams, group.name);
    });

    return groups;
};
