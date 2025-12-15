export type PhaseType = 'group' | 'elimination' | 'placement';

export interface ReferenceSource {
    type: 'group.pos' | 'match.winner' | 'match.loser' | 'team';
    id: string; // Group Name (e.g., 'A') or Match Global ID (e.g. '10')
    index?: number; // For group pos (1, 2, 3...)
}

export interface RoundMatch {
    id: string; // UUID for internal tracking
    globalId: number; // The official match number (#1, #2...)
    name: string; // "Semis 1", "Final"
    sourceHome?: ReferenceSource;
    sourceAway?: ReferenceSource;
    roundIndex: number; // 0 for first round of the phase
    phaseId: string;
    // Scheduling
    date?: string; // YYYY-MM-DD
    startTime?: string; // HH:mm
    location?: string;
    court?: string;
    refereeId?: string;
}

export interface TournamentPhase {
    id: string;
    type: PhaseType;
    name: string;
    order: number;
    // For Elimination:
    matches?: RoundMatch[];
    // For Groups:
    groups?: GroupConfiguration[];
}

export interface GroupConfiguration {
    name: string;
    teams: string[]; // Team IDs
    matches: RoundMatch[]; // Local matches (usually generated automatically)
}

export interface TournamentStructure {
    phases: TournamentPhase[];
    globalMatchCount: number;
}
