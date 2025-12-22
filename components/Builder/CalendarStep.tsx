import React, { useState, useEffect } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { RoundMatch } from '../../types/structure';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Trash2, GripHorizontal, LayoutGrid, ArrowRight, Settings, Coffee, MoreVertical, CalendarDays, Edit2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { CalendarFieldColumn } from './CalendarComponents/CalendarFieldColumn';

// Types
export interface ScheduleItem {
    id: string; // UUID
    type: 'match' | 'event';
    date: string; // YYYY-MM-DD
    // For Match
    matchId?: string; // Reference to RoundMatch
    // For Event
    name?: string; // e.g. "Almuerzo", "Mantenimiento"
    durationMinutes: number; // Duration of this specific item
}

export interface Field {
    id: string;
    name: string;
    startTime: string; // '09:00'
    items: ScheduleItem[]; // Ordered list of activities
}

export const CalendarStep: React.FC = () => {
    const { state, updateStructure, teams, updateConfig } = useBuilder();
    const { addToast } = useToast();

    const [fields, setFields] = useState<Field[]>([]);
    const [matches, setMatches] = useState<RoundMatch[]>([]);

    // Dates State
    const [tournamentDates, setTournamentDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Config State
    const [durationSettings, setDurationSettings] = useState<{ oneSet: number; threeSets: number }>({ oneSet: 30, threeSets: 90 });
    // Legacy: matchDuration used for fallback
    const [matchDuration, setMatchDuration] = useState<number>(60);


    // Modal States
    const [modal, setModal] = useState<{
        type: 'field' | 'config' | 'event' | 'rename' | null;
        fieldId?: string; // For adding event
    }>({ type: null });

    // Temp Form States
    const [newFieldData, setNewFieldData] = useState({ name: '', startTime: '09:00' });
    const [renameData, setRenameData] = useState({ id: '', name: '', startTime: '' }); // Added startTime
    const [newEventData, setNewEventData] = useState({ name: 'Descanso', duration: 30 }); // duration in minutes
    const [tempSettings, setTempSettings] = useState({ oneSet: 30, threeSets: 90 });


    // -- Init Load --
    useEffect(() => {
        // 1. Generate Dates
        // Fix: Config uses snake_case keys (start_date, end_date)
        const configAny = state.config as any;
        const sDate = configAny.start_date || configAny.startDate;
        const eDate = configAny.end_date || configAny.endDate;

        const start = sDate ? new Date(sDate) : new Date();
        const end = eDate ? new Date(eDate) : new Date(start);

        // Ensure end >= start
        if (end < start) end.setTime(start.getTime());

        const dates: string[] = [];
        let curr = new Date(start);
        // Safety Break: max 30 days to prevent infinite loops if bad dates
        let safety = 0;
        while (curr <= end && safety < 60) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
            safety++;
        }

        // If no valid dates, default to today
        if (dates.length === 0) dates.push(new Date().toISOString().split('T')[0]);

        setTournamentDates(dates);
        if (!selectedDate || !dates.includes(selectedDate)) {
            setSelectedDate(dates[0]);
        }

        // 2. Load Structure
        if (state.structure) {
            const allMatches: RoundMatch[] = [];
            state.structure.phases.forEach(p => {
                if (p.type === 'group' && p.groups) {
                    p.groups.forEach(g => {
                        g.matches.forEach(m => allMatches.push({ ...m, phaseId: p.name }));
                    });
                } else if (p.matches) {
                    allMatches.push(...p.matches);
                }
            });
            allMatches.sort((a, b) => (a.globalId || 0) - (b.globalId || 0));
            setMatches(allMatches);

            // Restore Config
            if (configAny.matchDuration) {
                setMatchDuration(configAny.matchDuration);
                setMatchDuration(configAny.matchDuration);
            }
            if (configAny.durationSettings) {
                setDurationSettings(configAny.durationSettings);
                setTempSettings(configAny.durationSettings);
            }

            // Restore Fields
            if (configAny.fields) {
                const loaded: any[] = configAny.fields;
                const migrated = loaded.map(f => {
                    // Migration: ensure items list
                    let items = f.items;
                    if (!items && f.assignedMatches) {
                        items = f.assignedMatches.map((mid: string) => ({
                            id: crypto.randomUUID(),
                            type: 'match',
                            matchId: mid,
                            durationMinutes: configAny.matchDuration || 60,
                            date: dates[0] // assign to first day
                        }));
                    }
                    if (items) {
                        // Ensure all items have dates
                        items = items.map((i: any) => ({
                            ...i,
                            date: i.date || dates[0] // fallback
                        }));
                    } else {
                        items = [];
                    }
                    return { ...f, items };
                });
                setFields(migrated);
            }
        }
    }, [state.structure, (state.config as any).start_date, (state.config as any).end_date]);

    // -- Persistence --
    useEffect(() => {
        updateConfig('fields', fields);
        updateConfig('matchDuration', matchDuration);
        updateConfig('durationSettings', durationSettings);
    }, [fields, matchDuration, durationSettings]);


    // -- Helpers --
    const getMatchById = (id: string | undefined) => matches.find(m => m.id === id);
    const getTeamName = (id: string | undefined) => {
        if (!id) return '...';
        const t = teams.find(tm => tm.id === id);
        return t ? t.name : '...';
    };

    const calculateTime = (startTime: string, minutesToAdd: number) => {
        const [h, m] = startTime.split(':').map(Number);
        const total = h * 60 + m + minutesToAdd;
        const newH = Math.floor(total / 60) % 24; // Handle day wrap conceptually
        const newM = total % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    // -- Actions --

    // 1. Fields
    const openAddField = () => {
        setNewFieldData({ name: `Cancha ${fields.length + 1}`, startTime: '09:00' });
        setModal({ type: 'field' });
    };

    const confirmAddField = () => {
        if (!newFieldData.name) {
            addToast('El nombre es obligatorio', 'error');
            return;
        }
        setFields(prev => [...prev, {
            id: crypto.randomUUID(),
            name: newFieldData.name,
            startTime: newFieldData.startTime,
            items: []
        }]);
        addToast('Campo creado correctamente', 'success');
        setModal({ type: null });
    };

    const removeField = (id: string) => {
        if (confirm("¿Eliminar campo? Los partidos volverán a estar sin asignar.")) {
            setFields(prev => prev.filter(f => f.id !== id));
            addToast('Campo eliminado', 'info');
        }
    };

    const openRenameField = (f: Field) => {
        setRenameData({ id: f.id, name: f.name });
        setModal({ type: 'rename' });
    };

    const confirmRenameField = () => {
        if (!renameData.name) return;
        setFields(prev => prev.map(f => f.id === renameData.id ? { ...f, name: renameData.name, startTime: renameData.startTime || f.startTime } : f));
        addToast('Campo actualizado', 'success');
        setModal({ type: null });
    };

    // 2. Config
    const openConfig = () => {
        setTempSettings(durationSettings);
        setModal({ type: 'config' });
    };

    const saveConfig = () => {
        setDurationSettings(tempSettings);
        // Fallback update for simplicity if needed, or deprecate matchDuration
        setMatchDuration(tempSettings.threeSets);

        // Update existing items logic? Could be complex if we don't know which match was which set count.
        // For now, we only update FUTURE drops or we'd need to re-scan all matches.
        // Let's force update based on known matches in state.

        setFields(prev => prev.map(f => ({
            ...f,
            items: f.items.map(i => {
                if (i.type === 'match' && i.matchId) {
                    const m = getMatchById(i.matchId);
                    const isThreeSets = m?.sets && m.sets.length >= 3;
                    // Or check global config if sets not populated.
                    const setsCount = m?.sets?.length || state.config.sets_per_match || 3;
                    const newDur = setsCount === 1 ? tempSettings.oneSet : tempSettings.threeSets;
                    return { ...i, durationMinutes: newDur };
                }
                return i;
            })
        })));

        addToast(`Duraciones actualizadas`, 'success');
        setModal({ type: null });
    };

    // 3. Events
    const openAddEvent = (fieldId: string) => {
        setNewEventData({ name: 'Descanso', duration: 15 });
        setModal({ type: 'event', fieldId });
    };

    const confirmAddEvent = () => {
        if (!modal.fieldId) return;
        setFields(prev => prev.map(f => {
            if (f.id === modal.fieldId) {
                return {
                    ...f,
                    items: [...f.items, {
                        id: crypto.randomUUID(),
                        type: 'event',
                        name: newEventData.name,
                        durationMinutes: newEventData.duration,
                        date: selectedDate
                    }]
                };
            }
            return f;
        }));
        addToast('Evento agregado', 'success');
        setModal({ type: null });
    };

    // Action: Update Referee
    const handleRefereeSelect = (matchId: string, refereeId: string) => {
        // 1. Update Local
        setMatches(prev => prev.map(m =>
            m.id === matchId ? { ...m, refereeId } : m
        ));

        // 2. Update Global Structure
        if (!state.structure || !state.structure.phases) return;

        const newStructure = { ...state.structure };
        let found = false;

        newStructure.phases = newStructure.phases.map(p => {
            // Handle Group Phase
            if (p.groups) {
                return {
                    ...p,
                    groups: p.groups.map(g => ({
                        ...g,
                        matches: g.matches.map(m => {
                            if (m.id === matchId) {
                                found = true;
                                return { ...m, refereeId };
                            }
                            return m;
                        })
                    }))
                };
            }
            // Handle Elimination Phase (matches array directly, or rounds if existing but type says matches?)
            // Type definition says `matches?: RoundMatch[]`. It does NOT say `rounds`.
            // But my previous code tried to map `rounds`. BracketStep likely uses `rounds` internally but flattens or structure.ts definition is partial?
            // "RoundMatch" has "roundIndex".
            // Let's assume matches are in `p.matches`.
            if (p.matches) {
                return {
                    ...p,
                    matches: p.matches.map(m => {
                        if (m.id === matchId) {
                            found = true;
                            return { ...m, refereeId };
                        }
                        return m;
                    })
                };
            }
            return p;
        });

        if (found) {
            updateStructure(newStructure);
            addToast('Árbitro asignado y guardado', 'success');
        } else {
            console.warn("Match not found in structure during referee check", matchId);
        }
    };

    // Action: Delete Event
    const handleDeleteEvent = (fieldId: string, itemId: string) => {
        setFields(prev => prev.map(f =>
            f.id === fieldId
                ? { ...f, items: f.items.filter(i => i.id !== itemId) }
                : f
        ));
        addToast('Evento eliminado', 'info');
    };

    // Action: Unassign (Drop to sidebar)
    const handleUnassignDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/b5-calendar-item');
        if (!data) return;

        try {
            const parsed = JSON.parse(data);
            // Ensure it's a match and has an origin field
            const item = parsed.item;
            const originFieldId = parsed.originFieldId;

            if (item && item.type === 'match' && originFieldId) {
                setFields(prev => prev.map(f =>
                    f.id === originFieldId
                        ? { ...f, items: f.items.filter(i => i.id !== item.id) }
                        : f
                ));
                addToast('Partido desasignado', 'info');
            }
        } catch (e) {
            console.error("Error parsing drop", e);
        }
    };

    // 4. Drag & Drop
    const handleDragStart = (e: React.DragEvent, item: { id: string, type: 'match' | 'event', matchId?: string, durationMinutes?: number, name?: string }, originFieldId?: string) => { // originFieldId undefined if from sidebar
        // Data payload
        const payload = JSON.stringify({
            item,
            originFieldId
        });
        e.dataTransfer.setData('application/b5-calendar-item', payload);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetFieldId: string, targetIndexOnDate: number = -1) => { // targetIndex relative to the filtered list for this date
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('application/b5-calendar-item');
        if (!dataStr) return;

        try {
            const { item, originFieldId } = JSON.parse(dataStr);
            console.log("Dropped:", item, "From:", originFieldId, "To:", targetFieldId, "@", targetIndexOnDate);

            // Logic:
            // 1. Identify Source Item (if Origin Field, remove it. If Sidebar, create new Match wrapper).
            // 2. Identify Target List: targetField.items filtered by selectedDate.
            // 3. Insert into relevant position in global list.

            setFields(prev => {
                const newFields = [...prev];
                let itemToInsert: ScheduleItem;

                if (!originFieldId) {
                    // FROM SIDEBAR
                    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
                        ? crypto.randomUUID()
                        : Math.random().toString(36).substring(2) + Date.now().toString(36);

                    itemToInsert = {
                        id: newId,
                        type: 'match',
                        matchId: item.id,
                        durationMinutes: (() => {
                            const m = getMatchById(item.id);
                            const setsCount = m?.sets?.length || state.config.sets_per_match || 3;
                            return setsCount === 1 ? durationSettings.oneSet : durationSettings.threeSets;
                        })(),
                        date: selectedDate
                    };

                    // Clean up doubles just in case
                    newFields.forEach(f => {
                        f.items = f.items.filter(i => i.matchId !== item.id);
                    });

                } else {
                    // FROM FIELD
                    const sourceField = newFields.find(f => f.id === originFieldId);
                    if (!sourceField) return prev;

                    const idx = sourceField.items.findIndex(i => i.id === item.id);
                    if (idx === -1) return prev;

                    itemToInsert = { ...sourceField.items[idx], date: selectedDate }; // Update date to target date!
                    sourceField.items.splice(idx, 1);
                }

                // INSERT
                const targetField = newFields.find(f => f.id === targetFieldId);
                if (targetField) {
                    // We need to find the actual index in the full list because we are viewing a filtered list by date.
                    // itemsOnDate = targetField.items.filter(i => i.date === selectedDate)
                    // If targetIndexOnDate is -1, append to END of itemsOnDate.
                    // Then find where that is in the real list.

                    const itemsOnDate = targetField.items.filter(i => i.date === selectedDate);

                    if (targetIndexOnDate === -1) {
                        // Append after the last item of this date? Or just push to end of array.
                        // For simplicity, let's just push to end of global array. 
                        // If we wanted to keep dates grouped in memory, we'd need to find the last item of this date.
                        // But since we filter on render, global order only matters for persistence stability.
                        targetField.items.push(itemToInsert);
                    } else {
                        // Insert BEFORE the item at targetIndexOnDate
                        const targetItemRef = itemsOnDate[targetIndexOnDate];
                        if (targetItemRef) {
                            const realIdx = targetField.items.indexOf(targetItemRef);
                            targetField.items.splice(realIdx, 0, itemToInsert);
                        } else {
                            targetField.items.push(itemToInsert);
                        }
                    }
                }
                return newFields;
            });
            addToast('Horario actualizado', 'success');
        } catch (err) {
            console.error("Drop Error", err);
        }
    };

    // -- Derived Data --
    const assignedMatchIds = new Set(fields.flatMap(f => f.items.filter(i => i.type === 'match').map(i => i.matchId)));
    const unassignedMatches = matches.filter(m => !assignedMatchIds.has(m.id));

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in pb-20 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarIcon className="text-blue-500" /> Programación de Campos
                    </h2>
                    <p className="text-white/40 text-xs mt-1">Arrastra partidos. Organiza por fechas y campos.</p>
                </div>

                <div className="flex gap-2">
                    <button onClick={openConfig} className="p-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                        <Settings size={16} /> <span className="hidden md:inline">{matchDuration} min/partido</span>
                    </button>
                    <button onClick={openAddField} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                        <Plus size={16} /> Agregar Campo
                    </button>
                </div>
            </div>

            {/* Date Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
                {tournamentDates.map(date => (
                    <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-bold flex items-center gap-2 transition-all ${selectedDate === date
                            ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                            : 'bg-[#1a1a20] text-white/50 hover:bg-[#25252b] hover:text-white'
                            }`}
                    >
                        <CalendarDays size={14} />
                        {formatDate(date)}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Available Matches Sidebar */}
                <div
                    className="w-80 flex flex-col bg-[#111] border-r border-white/5 pr-4 overflow-hidden flex-shrink-0"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleUnassignDrop}
                >
                    <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex justify-between">
                        <span>Sin Asignar</span>
                        <span className="bg-white/10 px-1.5 rounded text-white">{unassignedMatches.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {unassignedMatches.map(m => (
                            <div
                                key={m.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, { ...m, type: 'match' }, undefined)}
                                className="bg-[#1a1a20] p-3 rounded border border-white/5 hover:border-blue-500/50 cursor-grab active:cursor-grabbing group transition-all"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-white/30 font-mono">#{m.globalId}</span>
                                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1 rounded">{m.phaseId}</span>
                                </div>
                                <div className="text-sm font-bold text-white mb-1 truncate">{m.name}</div>
                                <div className="flex justify-between text-xs text-white/60">
                                    <span className="truncate max-w-[45%]">{m.sourceHome?.type === 'team' ? getTeamName(m.sourceHome.id) : 'TBD'}</span>
                                    <span className="text-white/20">vs</span>
                                    <span className="truncate max-w-[45%]">{m.sourceAway?.type === 'team' ? getTeamName(m.sourceAway.id) : 'TBD'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fields Grid */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-6 pb-4">
                    {fields.map(field => {
                        const dayItems = field.items.filter(i => i.date === selectedDate);
                        return (
                            <div key={field.id} className="min-w-[320px] flex-shrink-0">
                                <CalendarFieldColumn
                                    key={field.id}
                                    field={field}
                                    dateItems={dayItems}
                                    matchesSource={matches}
                                    getTeamName={getTeamName}
                                    calculateTime={calculateTime}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onDragStart={(e, item, fid) => handleDragStart(e, item, fid)}
                                    onEditField={(f) => {
                                        setRenameData({ id: f.id, name: f.name, startTime: f.startTime });
                                        setModal({ type: 'rename' });
                                    }}
                                    onRemoveField={removeField}
                                    onAddEvent={openAddEvent}
                                    onRefereeSelect={handleRefereeSelect}
                                    onDeleteEvent={(itemId) => handleDeleteEvent(field.id, itemId)}
                                />
                            </div>
                        );
                    })}

                    {fields.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-xl m-4">
                            <LayoutGrid size={48} className="mb-4 opacity-50" />
                            <p>No hay campos creados.</p>
                            <button onClick={openAddField} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-bold">
                                Crear Primer Campo
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {modal.type === 'field' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-[#1a1a20] w-full max-w-sm rounded-xl border border-white/10 shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Nuevo Campo</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase">Nombre</label>
                                <input type="text" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" autoFocus value={newFieldData.name} onChange={e => setNewFieldData({ ...newFieldData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase">Inicio</label>
                                <input type="time" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" value={newFieldData.startTime} onChange={e => setNewFieldData({ ...newFieldData, startTime: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setModal({ type: null })} className="px-4 py-2 text-white/50 hover:text-white font-bold text-sm">Cancelar</button>
                            <button onClick={confirmAddField} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold">Crear</button>
                        </div>
                    </div>
                </div>
            )}

            {modal.type === 'rename' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-[#1a1a20] w-full max-w-sm rounded-xl border border-white/10 shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Renombrar Campo</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase">Nombre</label>
                                <input type="text" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" autoFocus value={renameData.name} onChange={e => setRenameData({ ...renameData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase">Inicio</label>
                                <input type="time" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" value={renameData.startTime || '09:00'} onChange={e => setRenameData({ ...renameData, startTime: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setModal({ type: null })} className="px-4 py-2 text-white/50 hover:text-white font-bold text-sm">Cancelar</button>
                            <button onClick={confirmRenameField} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {modal.type === 'config' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-[#1a1a20] w-full max-w-sm rounded-xl border border-white/10 shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Configuración Calendario</h3>
                        <h3 className="text-lg font-bold text-white mb-4">Configuración Calendario</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase">Partidos a 3 Sets (Minutos)</label>
                                <input
                                    type="number"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                                    value={tempSettings.threeSets}
                                    onChange={e => setTempSettings({ ...tempSettings, threeSets: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase">Partidos a 1 Set (Minutos)</label>
                                <input
                                    type="number"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                                    value={tempSettings.oneSet}
                                    onChange={e => setTempSettings({ ...tempSettings, oneSet: Number(e.target.value) })}
                                />
                            </div>
                            <p className="text-[10px] text-white/30 mt-2">Esto recalculará todos los partidos ya asignados según su cantidad de sets.</p>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setModal({ type: null })} className="px-4 py-2 text-white/50 hover:text-white font-bold text-sm">Cancelar</button>
                            <button onClick={saveConfig} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {modal.type === 'event' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-[#1a1a20] w-full max-w-sm rounded-xl border border-white/10 shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Agregar Evento / Descanso</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase">Nombre</label>
                                <input type="text" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" autoFocus placeholder="Ej. Almuerzo" value={newEventData.name} onChange={e => setNewEventData({ ...newEventData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase">Duración (Minutos)</label>
                                <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" value={newEventData.duration} onChange={e => setNewEventData({ ...newEventData, duration: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setModal({ type: null })} className="px-4 py-2 text-white/50 hover:text-white font-bold text-sm">Cancelar</button>
                            <button onClick={confirmAddEvent} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold">Agregar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
