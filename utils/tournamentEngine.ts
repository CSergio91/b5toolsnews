import { TournamentStructure, TournamentPhase, RoundMatch, GroupConfiguration } from '../types/structure';
import { TempMatch } from './bracketGenerator';

export const resolveTournamentStructure = (structure: TournamentStructure, teams: any[]) => {
    // 1. Flatten all matches to assign Global IDs if dynamic (or just read them)
    // 2. Generate display names for sources (e.g. "Ganador #5" vs "1ro Grupo A")
    // This function will be key for the "Real Time Visualization"

    // For now, let's just ensure order is correct
    const sortedPhases = [...structure.phases].sort((a, b) => a.order - b.order);
    return sortedPhases;
};

export const generateGlobalMatchId = (structure: TournamentStructure): number => {
    // Count all existing matches across all phases
    let count = 0;
    structure.phases.forEach(p => {
        if (p.type === 'group' && p.groups) {
            p.groups.forEach(g => count += g.matches.length);
        } else if (p.matches) {
            count += p.matches.length;
        }
    });
    return count + 1;
};

export const getSourceDisplayName = (source: any | undefined): string => {
    if (!source) return "TBD";
    if (source.type === 'group.pos') {
        return `${source.index}º Grupo ${source.id}`;
    }
    if (source.type === 'match.winner') {
        return `Ganador #${source.id}`;
    }
    if (source.type === 'match.loser') {
        return `Perdedor #${source.id}`;
    }
    return "TBD";
};
