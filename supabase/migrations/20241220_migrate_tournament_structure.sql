-- ==========================================
-- 1. CREACIÓN DEL ESQUEMA Y TABLAS
-- ==========================================
CREATE SCHEMA IF NOT EXISTS tournaments;

-- Tabla de fases (etapas)
CREATE TABLE IF NOT EXISTS tournaments.tournament_phases (
    phase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,            -- group / elimination / round_robin
    phase_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de matches (partidos)
CREATE TABLE IF NOT EXISTS tournaments.tournament_matches (
    match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES tournaments.tournament_phases(phase_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,                 -- Ej: "Cancha 1", "Estadio Central"
    round_index INT DEFAULT 0,
    global_id INT,
    source_home_id UUID,           -- team_id o match_id
    source_home_type TEXT,         -- team / match.winner / match.loser / group.pos
    source_home_index INT,         -- Ej: 1 para primero de grupo
    source_away_id UUID,
    source_away_type TEXT,
    source_away_index INT,
    referee_id UUID,               -- Referencia a tournament_referees(referee_id)
    status TEXT DEFAULT 'scheduled', -- scheduled / live / finished / suspended
    start_time TIMESTAMPTZ,
    field TEXT,
    duration_minutes INT DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de sets (periodos)
CREATE TABLE IF NOT EXISTS tournaments.tournament_sets (
    set_id BIGSERIAL PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES tournaments.tournament_matches(match_id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    status TEXT DEFAULT 'pending',
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_phases_tournament ON tournaments.tournament_phases(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_phase ON tournaments.tournament_matches(phase_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON tournaments.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_sets_match ON tournaments.tournament_sets(match_id);

-- ==========================================
-- 2. SCRIPT DE MIGRACIÓN (JSON -> TABLAS)
-- ==========================================
DO $$
DECLARE
    t_row RECORD;
    phase_json JSONB;
    group_json JSONB;
    match_json JSONB;
    set_json JSONB;
    v_phase_id UUID;
    v_match_id UUID;
BEGIN
    FOR t_row IN SELECT id, structure FROM public.tournaments WHERE structure IS NOT NULL AND (structure->>'phases') IS NOT NULL LOOP
        
        -- 2.1 Procesar Fases
        FOR phase_json IN SELECT * FROM jsonb_array_elements(t_row.structure->'phases') LOOP
            v_phase_id := (phase_json->>'id')::UUID;
            
            INSERT INTO tournaments.tournament_phases (phase_id, tournament_id, name, type, phase_order)
            VALUES (
                v_phase_id,
                t_row.id,
                phase_json->>'name',
                phase_json->>'type',
                COALESCE((phase_json->>'order')::INT, 0)
            )
            ON CONFLICT (phase_id) DO UPDATE SET
                name = EXCLUDED.name,
                type = EXCLUDED.type,
                phase_order = EXCLUDED.phase_order;

            -- 2.2 Procesar Partidos Directos en la Fase (Eliminatorias)
            IF phase_json ? 'matches' THEN
                FOR match_json IN SELECT * FROM jsonb_array_elements(phase_json->'matches') LOOP
                    v_match_id := (match_json->>'id')::UUID;
                    
                    INSERT INTO tournaments.tournament_matches (
                        match_id, tournament_id, phase_id, name, location, round_index, global_id,
                        source_home_id, source_home_type, source_home_index,
                        source_away_id, source_away_type, source_away_index,
                        referee_id, status
                    ) VALUES (
                        v_match_id, t_row.id, v_phase_id,
                        match_json->>'name', match_json->>'location', 
                        COALESCE((match_json->>'roundIndex')::INT, 0), (match_json->>'globalId')::INT,
                        -- Manejo de IDs nulos o vacíos en sourceHome/Away
                        CASE WHEN match_json->'sourceHome'->>'id' ~ '^[0-9a-fA-F-]{36}$' THEN (match_json->'sourceHome'->>'id')::UUID ELSE NULL END,
                        match_json->'sourceHome'->>'type', 
                        (match_json->'sourceHome'->>'index')::INT,
                        CASE WHEN match_json->'sourceAway'->>'id' ~ '^[0-9a-fA-F-]{36}$' THEN (match_json->'sourceAway'->>'id')::UUID ELSE NULL END,
                        match_json->'sourceAway'->>'type', 
                        (match_json->'sourceAway'->>'index')::INT,
                        CASE WHEN match_json->>'refereeId' ~ '^[0-9a-fA-F-]{36}$' THEN (match_json->>'refereeId')::UUID ELSE NULL END,
                        COALESCE(match_json->>'status', 'scheduled')
                    ) ON CONFLICT (match_id) DO UPDATE SET
                        status = EXCLUDED.status,
                        name = EXCLUDED.name;

                    -- 2.3 Procesar Sets del Partido
                    IF match_json ? 'sets' THEN
                        FOR set_json IN SELECT * FROM jsonb_array_elements(match_json->'sets') LOOP
                            INSERT INTO tournaments.tournament_sets (match_id, set_number, status, home_score, away_score)
                            VALUES (
                                v_match_id, 
                                (set_json->>'set_number')::INT, 
                                COALESCE(set_json->>'status', 'pending'), 
                                COALESCE((set_json->>'home_score')::INT, 0), 
                                COALESCE((set_json->>'away_score')::INT, 0)
                            )
                            ON CONFLICT DO NOTHING; -- Opcional: manejar conflicto si ya existe
                        END LOOP;
                    END IF;
                END LOOP;
            END IF;

            -- 2.4 Procesar Partidos dentro de Grupos
            IF phase_json ? 'groups' THEN
                FOR group_json IN SELECT * FROM jsonb_array_elements(phase_json->'groups') LOOP
                    IF group_json ? 'matches' THEN
                        FOR match_json IN SELECT * FROM jsonb_array_elements(group_json->'matches') LOOP
                            v_match_id := (match_json->>'id')::UUID;
                            
                            INSERT INTO tournaments.tournament_matches (
                                match_id, tournament_id, phase_id, name, location, round_index, global_id,
                                source_home_id, source_home_type, source_home_index,
                                source_away_id, source_away_type, source_away_index,
                                referee_id, status
                            ) VALUES (
                                v_match_id, t_row.id, v_phase_id,
                                match_json->>'name', match_json->>'location', 
                                COALESCE((match_json->>'roundIndex')::INT, 0), (match_json->>'globalId')::INT,
                                CASE WHEN match_json->'sourceHome'->>'id' ~ '^[0-9a-fA-F-]{36}$' THEN (match_json->'sourceHome'->>'id')::UUID ELSE NULL END,
                                match_json->'sourceHome'->>'type', 
                                (match_json->'sourceHome'->>'index')::INT,
                                CASE WHEN match_json->'sourceAway'->>'id' ~ '^[0-9a-fA-F-]{36}$' THEN (match_json->'sourceAway'->>'id')::UUID ELSE NULL END,
                                match_json->'sourceAway'->>'type', 
                                (match_json->'sourceAway'->>'index')::INT,
                                CASE WHEN match_json->>'refereeId' ~ '^[0-9a-fA-F-]{36}$' THEN (match_json->>'refereeId')::UUID ELSE NULL END,
                                COALESCE(match_json->>'status', 'scheduled')
                            ) ON CONFLICT (match_id) DO UPDATE SET
                                status = EXCLUDED.status,
                                name = EXCLUDED.name;

                            -- Sets del partido de grupo
                            IF match_json ? 'sets' THEN
                                FOR set_json IN SELECT * FROM jsonb_array_elements(match_json->'sets') LOOP
                                    INSERT INTO tournaments.tournament_sets (match_id, set_number, status, home_score, away_score)
                                    VALUES (
                                        v_match_id, 
                                        (set_json->>'set_number')::INT, 
                                        COALESCE(set_json->>'status', 'pending'), 
                                        COALESCE((set_json->>'home_score')::INT, 0), 
                                        COALESCE((set_json->>'away_score')::INT, 0)
                                    )
                                    ON CONFLICT DO NOTHING;
                                END LOOP;
                            END IF;
                        END LOOP;
                    END IF;
                END LOOP;
            END IF;

        END LOOP;
    END LOOP;
END $$;
