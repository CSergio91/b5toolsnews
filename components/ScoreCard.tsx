import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GlassInput, GlassTitle } from './GlassInput';
import { SubscriptionModal, SubscriptionPlans, useSubscription } from './SubscriptionModal';
import {
  Clock,
  ArrowRightLeft,
  Square,
  X,
  Hash,
  Plus,
  Printer,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  Circle,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Lock,
  History,
  AlertTriangle,
  Table2,
  FileSpreadsheet,
  FileDown,
  Pencil,
  LockOpen,
  Trash2,
  Minus,
  Upload,
  Share2,
  Facebook,
  Linkedin,
  Copy,
  Maximize2,
  Minimize2,
  GripHorizontal,
  LineChart,
  BarChart,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Home,
  Check,
  Zap,
  Crown,
  Ban,
  Menu as MenuIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- Types for State Management ---

interface PlayerStats {
  name: string;
  gender: string;
  number: string;
  pos: string;
  scores: string[][];
  defError?: number;
}

interface RosterSlot {
  starter: PlayerStats;
  sub: PlayerStats;
}

interface TeamData {
  slots: RosterSlot[];
}

interface PlayEvent {
  id: number;
  timestamp: string;
  inning: number;
  teamName: string;
  playerNum: string;
  playerName: string;
  actionCode: string;
  description: string;
}

interface ScoreCardState {
  gameInfo: {
    competition: string;
    place: string;
    date: string;
    gameNum: string;
    setNum: string;
    visitor: string;
    home: string;
    officials: {
      plate: string;
      field1: string;
      field2: string;
      field3: string;
      table: string;
    };
    times: {
      start: string;
      end: string;
    };
    visitorLogo?: string;
    homeLogo?: string;
  };
  visitorTeam: TeamData;
  localTeam: TeamData;
  inningScores: {
    visitor: string[];
    local: string[];
  };
  totals: {
    visitor: string;
    local: string;
  };
  errors: {
    visitor: string;
    local: string;
  };
  timeouts: {
    visitor: [boolean, boolean];
    local: [boolean, boolean];
  };
  scoreAdjustments: {
    visitor: number;
    local: number;
  };
  winner: {
    name: string;
    score: string;
    isVisitor: boolean;
  } | null;
  history: PlayEvent[];
}

// --- Initial State Helper ---

const createEmptyPlayer = (): PlayerStats => ({
  name: '', gender: '', number: '', pos: '', scores: [['']], defError: 0
});

const createEmptyTeam = (): TeamData => ({
  slots: Array(5).fill(null).map(() => ({
    starter: createEmptyPlayer(),
    sub: createEmptyPlayer(),
  }))
});

const initialState: ScoreCardState = {
  gameInfo: {
    competition: '', place: '', date: new Date().toISOString().split('T')[0], gameNum: '', setNum: '', visitor: '', home: '',
    officials: { plate: '', field1: '', field2: '', field3: '', table: '' },
    times: { start: '', end: '' }
  },
  visitorTeam: createEmptyTeam(),
  localTeam: createEmptyTeam(),
  inningScores: {
    visitor: [''],
    local: ['']
  },
  totals: { visitor: '', local: '' },
  errors: { visitor: '0', local: '0' },
  timeouts: {
    visitor: [false, false],
    local: [false, false]
  },
  scoreAdjustments: { visitor: 0, local: 0 },
  winner: null,
  history: []
};

// --- Components ---

const ModalBackdrop: React.FC<{ children: React.ReactNode, zIndex?: string }> = ({ children, zIndex = 'z-[200]' }) => (
  createPortal(
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4`}>
      {children}
    </div>,
    document.body
  )
);

const WinnerModal: React.FC<{
  winner: { name: string; score: string; isVisitor: boolean } | null;
  onClose: () => void;
}> = ({ winner, onClose }) => {
  if (!winner) return null;

  const handleShare = (platform: 'whatsapp' | 'facebook') => {
    const text = `⚾ ¡Juego Finalizado! ⚾\n\nGanador: ${winner.name}\nResultado Final: ${winner.score}\n\nLlevado con B5Tools - La Herramienta del momento`;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <ModalBackdrop>
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-amber-500/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.3)] max-w-md w-full text-center relative overflow-hidden no-print">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent animate-pulse"></div>

        <div className="relative z-10 flex flex-col items-center">
          <Trophy size={64} className="text-amber-400 mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-bounce-slow" />

          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mb-2 filter drop-shadow-lg">
            {winner.name}
          </h1>
          <p className="text-white/60 text-lg font-mono mb-8">GANADOR</p>

          <div className="bg-white/10 rounded-xl px-6 py-3 border border-white/10 mb-8">
            <span className="text-2xl font-bold text-white">Resultado Final: {winner.score}</span>
          </div>

          <div className="flex gap-4 mb-8 justify-center">
            <button onClick={() => handleShare('whatsapp')} className="p-3 rounded-full bg-green-600 hover:bg-green-500 text-white transition-colors" title="Compartir Resultado (WhatsApp)">
              <Share2 size={24} />
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-8 py-3 bg-white text-purple-900 font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg cursor-pointer active:scale-95 transform"
          >
            Cerrar
          </button>

          <div className="mt-6 pt-4 border-t border-white/10 w-full text-center">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Llevado con B5Tools - La Herramienta del momento</p>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};

const ResetConfirmModal: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <ModalBackdrop zIndex="z-[250]">
      <div className="bg-slate-900 border border-red-500/30 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center relative no-print">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 mx-auto border border-red-500/20">
          <AlertTriangle size={32} className="text-red-500" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">¿Reiniciar Partido?</h3>
        <p className="text-white/60 mb-6 text-sm">
          Se borrarán todos los datos del juego actual. Esta acción no se puede deshacer.
          <br /><br />
          <span className="text-amber-400 font-bold">¡Asegúrate de guardar los resultados antes!</span>
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.print()}
            className="w-full px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-500/30 font-semibold transition-colors flex items-center justify-center gap-2 mb-2"
          >
            <Printer size={16} /> Guardar PDF / Imprimir
          </button>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 font-semibold transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-red-900/20 text-sm"
            >
              Sí, Reiniciar
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};

const FieldSelector: React.FC<{
  onSelectPos: (pos: string) => void;
  opposingTeam?: TeamData;
}> = ({ onSelectPos, opposingTeam }) => {

  const getLabel = (pos: string) => {
    if (!opposingTeam) return pos;
    // Simple lookup: check starters first for this position
    const slot = opposingTeam.slots.find(s => s.starter.pos === pos);
    if (slot && slot.starter.number) return slot.starter.number;
    return pos;
  };

  return (
    <div className="relative w-[240px] h-[240px] mx-auto select-none">
      {/* SVG Field */}
      <svg viewBox="0 0 200 200" className="w-full h-full text-amber-600/20 drop-shadow-xl overflow-visible">
        {/* Diamond */}
        <path d="M 100 20 L 180 100 L 100 180 L 20 100 Z" fill="currentColor" stroke="white" strokeWidth="2" />
        {/* Foul Lines */}
        <line x1="100" y1="180" x2="20" y2="100" stroke="white" strokeWidth="2" strokeDasharray="4" />
        <line x1="100" y1="180" x2="180" y2="100" stroke="white" strokeWidth="2" strokeDasharray="4" />
        {/* Infield Arc (Approx) */}
        <path d="M 45 100 Q 100 45 155 100" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
      </svg>

      {/* Position Buttons (Absolute Positioning % based) */}
      {[
        { pos: 'C', top: '50%', left: '50%' }, // Center for Mid Fielder
        { pos: '1B', top: '50%', left: '85%' },
        { pos: '2B', top: '25%', left: '70%' }, // Higher, closer to 2nd base
        { pos: '3B', top: '50%', left: '15%' },
        { pos: 'SS', top: '25%', left: '30%' } // Higher, closer to 2nd base
      ].map((p) => {
        const label = getLabel(p.pos);
        return (
          <button
            key={p.pos}
            onClick={(e) => { e.stopPropagation(); onSelectPos(p.pos); }}
            className="absolute w-10 h-10 -ml-5 -mt-5 bg-white shadow-lg rounded-full flex items-center justify-center border-2 border-amber-600 text-amber-900 font-black text-xs hover:scale-110 active:scale-95 transition-transform z-10"
            style={{ top: p.top, left: p.left }}
          >
            {label}
          </button>
        );
      })}
      <div className="absolute bottom-0 w-full text-center text-[10px] text-white/40 font-mono">
        Selecciona quién cometió el error
      </div>
    </div>
  );
};

const ScoringModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (val: string, isManualReplace?: boolean, errorCulprit?: { team: 'visitor' | 'local', slotIdx: number, type: 'starter' | 'sub', updatePos?: string }) => void;
  currentValue: string;
  position: { x: number, y: number } | null;
  opposingTeam?: TeamData;
}> = ({ isOpen, onClose, onSelect, currentValue, position, opposingTeam }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [manualValue, setManualValue] = useState(currentValue);
  const [view, setView] = useState<'main' | 'defensive_error_field' | 'defensive_error_picker'>('main');
  const [pendingPos, setPendingPos] = useState<string | null>(null);

  // Sync state when prop changes or modal opens
  useEffect(() => {
    setManualValue(currentValue);
    setView('main');
    setPendingPos(null);
  }, [currentValue, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Logic handled by backdrop in main component usually, but here keep robust
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  // Responsive Layout Logic
  const modalWidth = 280;
  const modalHeight = view === 'defensive_error_field' ? 320 : 250; // Taller for field
  const { innerWidth, innerHeight } = window;

  // Center horizontally if screen is small (mobile focus)
  let left = innerWidth < 500 ? (innerWidth - modalWidth) / 2 : position.x - (modalWidth / 2);
  let top = position.y + 10;

  // Clamp Left
  if (left < 10) left = 10;
  if (left + modalWidth > innerWidth - 10) left = innerWidth - modalWidth - 10;

  // Vertical Clamp / Flip
  if (top + modalHeight > innerHeight - 10) {
    top = position.y - modalHeight - 10;
    // If flipping makes it go off-top, just center it vertically or clamp top
    if (top < 10) top = 10;
  }
  // Ensure it never exceeds bottom if top was set
  if (top + modalHeight > innerHeight) top = innerHeight - modalHeight - 10;


  const actions = [
    { label: 'OUT', val: 'X', icon: <X size={18} />, color: 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/40' },
    { label: 'HIT', val: 'H', icon: <CheckCircle2 size={18} />, color: 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/40' },
    { label: 'S', val: 'S', icon: <span className="font-black text-base">S</span>, color: 'bg-white/10 text-white border-white/50 hover:bg-white/20' },
    { label: 'ERR', val: 'E', icon: <AlertCircle size={18} />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/40' },
    { label: 'CARRERA', val: '●', icon: <Circle size={18} fill="currentColor" />, color: 'bg-rose-600 text-white border-rose-400 hover:bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.5)]' },
    { label: 'SUB', val: '⇄', icon: <ArrowRightLeft size={18} />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/40' },
    { label: 'FIN INN', val: '■', icon: <Square size={18} fill="currentColor" />, color: 'bg-amber-600/20 text-amber-500 border-amber-500/50 hover:bg-amber-500/40' },
  ];

  const handleFieldPos = (pos: string) => {
    if (!opposingTeam) return;

    // Search for player with this POS
    let foundSlotIdx = -1;
    let foundType: 'starter' | 'sub' = 'starter';

    opposingTeam.slots.forEach((slot, idx) => {
      // Priority to active player (Sub if exists?) - B5 logic usually simplistic, just check starter then sub if marked active
      // For simplicity, check starter pos. NOTE: Data might not track current 'active' well without deeper logic.
      // Assuming straightforward assignment.
      if (slot.starter.pos === pos) {
        foundSlotIdx = idx;
        foundType = 'starter';
      }
      if (slot.sub.pos === pos) {
        foundSlotIdx = idx;
        foundType = 'sub';
      }
    });

    if (foundSlotIdx !== -1) {
      // Found! Assign Error
      onSelect('E', false, { team: 'local', slotIdx: foundSlotIdx, type: foundType }); // 'local' key placeholder, generic logic up top fixes it
      onClose();
    } else {
      // Not Found -> Fallback Picker
      setPendingPos(pos);
      setView('defensive_error_picker');
    }
  };

  return createPortal(
    <div
      className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-150 no-print"
      style={{ top: top, left: left }}
      ref={modalRef}
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl w-[280px] ring-1 ring-black/50">

        {/* VIEW: MAIN */}
        {view === 'main' && (
          <div className="relative z-10">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    if (action.val === 'E' && opposingTeam) {
                      setView('defensive_error_field');
                    } else {
                      onSelect(action.val);
                      onClose();
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all active:scale-95 touch-manipulation ${action.color}`}
                  title={action.label}
                >
                  {action.icon}
                  <span className="text-[9px] font-black uppercase">{action.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2">
                {['Ex1B', 'Ex2B', 'Ex3B'].map((val) => (
                  <button
                    key={val}
                    onClick={() => { onSelect(val, true); onClose(); }}
                    className="px-2 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-md text-blue-200 hover:bg-blue-500/30 transition-colors text-[10px] font-bold uppercase"
                    title={`Extra Base (${val}) - No es turno al bate`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { onSelect('', true); onClose(); }}
                className="w-full py-2 bg-red-500/20 border border-red-500/30 rounded-md text-red-200 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 font-bold text-xs"
                title="Borrar Contenido"
              >
                <Trash2 size={16} /> BORRAR
              </button>
            </div>
          </div>
        )}

        {/* VIEW: FIELD SELECTOR */}
        {view === 'defensive_error_field' && (
          <div className="relative z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-yellow-400 uppercase">Selecciona Posición</span>
              <button onClick={() => setView('main')} className="text-white/50 hover:text-white"><RotateCcw size={12} /></button>
            </div>
            <FieldSelector onSelectPos={handleFieldPos} opposingTeam={opposingTeam} />
          </div>
        )}

        {/* VIEW: FALLBACK PICKER */}
        {view === 'defensive_error_picker' && opposingTeam && (
          <div className="relative z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-red-400 font-bold uppercase">Sin asignación: {pendingPos}</span>
                <span className="text-xs font-bold text-white">¿Quién estaba en {pendingPos}?</span>
              </div>
              <button onClick={() => setView('defensive_error_field')} className="text-white/50 hover:text-white"><RotateCcw size={12} /></button>
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-[180px] overflow-y-auto">
              {opposingTeam.slots.map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    // Assign Error AND Update Position
                    onSelect('E', false, {
                      team: 'local', // Logic upstream fixes identifying actual team
                      slotIdx: idx,
                      type: 'starter',
                      updatePos: pendingPos || undefined
                    });
                    onClose();
                  }}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded flex flex-col items-center justify-center border border-white/10"
                >
                  <span className="text-sm font-black text-white">{slot.starter.number || '?'}</span>
                  <span className="text-[9px] text-white/50 truncate w-full text-center">{slot.starter.name || 'J' + (idx + 1)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};


const AdvanceInningModal: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  visitorOuts: number;
  localOuts: number;
  nextInning: number;
}> = ({ isOpen, onConfirm, onCancel, visitorOuts, localOuts, nextInning }) => {
  if (!isOpen) return null;

  const incompleteVisitor = visitorOuts < 3;
  const incompleteLocal = localOuts < 3;
  const isIncomplete = incompleteVisitor || incompleteLocal;

  return (
    <ModalBackdrop zIndex="z-[250]">
      <div className="bg-slate-900 border border-white/20 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center relative no-print animate-in zoom-in-95 duration-200">

        {isIncomplete ? (
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 mx-auto border border-yellow-500/20">
            <AlertTriangle size={32} className="text-yellow-500" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 mx-auto border border-blue-500/20">
            <ArrowRightLeft size={32} className="text-blue-500" />
          </div>
        )}

        <h3 className="text-xl font-bold text-white mb-2">
          {isIncomplete ? '¿Entrada Incompleta?' : `¿Iniciar Entrada ${nextInning}?`}
        </h3>

        <div className="text-white/60 mb-6 text-sm text-left bg-white/5 p-3 rounded-lg border border-white/10">
          {isIncomplete ? (
            <>
              <p className="mb-2 text-yellow-400 font-bold">¡Atención! Faltan outs para cerrar:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                {incompleteVisitor && <li>Visitante: <span className="text-white font-bold">{visitorOuts}</span> outs (Faltan {3 - visitorOuts})</li>}
                {incompleteLocal && <li>Local: <span className="text-white font-bold">{localOuts}</span> outs (Faltan {3 - localOuts})</li>}
              </ul>
              <p className="mt-3 text-xs italic opacity-70">¿Deseas avanzar de todos modos?</p>
            </>
          ) : (
            <p className="text-center">Ambos equipos han completado sus 3 outs. Se bloqueará la entrada actual y se abrirá la siguiente.</p>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 font-semibold transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold transition-colors shadow-lg text-sm flex items-center justify-center gap-2
              ${isIncomplete ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
          >
            {isIncomplete ? 'Avanzar Igual' : 'Iniciar Entrada'} <ArrowRightLeft size={16} />
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};


const EditOverlay: React.FC<{ onClick: (e: React.MouseEvent | React.TouchEvent) => void }> = ({ onClick }) => (
  <div
    className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] cursor-pointer z-20 group transition-all duration-200 opacity-0 hover:opacity-100"
    onClick={(e) => {
      e.stopPropagation(); // Prevent bubbling to parent click (which might open modal)
      onClick(e);
    }}
    title="Tocame para editar"
  >
    <div className="bg-white/90 p-1.5 rounded-full shadow-lg transform group-hover:scale-110 group-active:scale-95 transition-all duration-200">
      <Pencil size={14} className="text-black" />
    </div>
  </div>
);

const ScoreCell: React.FC<{
  value: string;
  onChange: (val: string) => void;
  isEx?: boolean;
  onOpenModal: (e: React.MouseEvent | React.TouchEvent) => void;
  disabled?: boolean;
  isLocked?: boolean;
  compact?: boolean;
}> = ({ value, onChange, isEx, onOpenModal, disabled, isLocked, compact }) => {
  const [tempUnlocked, setTempUnlocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // If isLocked prop changes (e.g. inning advances), reset temp state
  useEffect(() => setTempUnlocked(false), [isLocked]);

  const safeValue = value || '';
  const hasRun = safeValue.includes('●');
  const baseValue = safeValue.replace(/[●■⇄]/g, '').trim();

  const getStyle = (val: string) => {
    const v = val.toUpperCase();
    if (v.includes('X')) return 'text-red-500 font-bold';
    if (v.includes('H')) return 'text-green-400 font-bold';
    if (v.includes('BB')) return 'text-blue-400 font-bold';
    if (v.includes('S')) return 'text-white font-bold';
    if (v.includes('E')) return 'text-yellow-400 font-bold';
    if (v.includes('E')) return 'text-yellow-400 font-bold';
    if (v.includes('K')) return 'text-red-400';
    return 'text-white/70';
  };

  const effectivelyLocked = isLocked && !tempUnlocked;

  const handleUnlock = (e: React.MouseEvent | React.TouchEvent) => {
    setTempUnlocked(true);
    // Focus the container to catch blur events
    setTimeout(() => containerRef.current?.focus(), 50);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // If focus moves INSIDE the container (e.g. to the input), do NOT re-lock
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;

    // Only re-lock if it was temporarily unlocked
    if (tempUnlocked) {
      // Small timeout to allow click events to process if moving focus
      setTimeout(() => setTempUnlocked(false), 200);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={tempUnlocked ? 0 : -1} // Make focusable only when unlocked to catch blur
      onClick={(e) => {
        // Standard open modal logic, ONLY if not effectively locked
        if (!effectivelyLocked) onOpenModal(e);
      }}
      onBlur={handleBlur}
      className={`relative w-full h-full min-h-[40px] flex items-center justify-center outline-none ${isEx ? 'bg-indigo-900/10' : ''}`}
    >

      {/* 2-Step Logic: Show Overlay if Locked */}
      {effectivelyLocked && <EditOverlay onClick={handleUnlock} />}

      <input
        type="text"
        inputMode="text"
        value={baseValue}
        onChange={(e) => !effectivelyLocked && onChange(e.target.value)}
        className={`w-full h-full bg-transparent text-center ${compact ? 'text-[10px]' : 'text-sm'} focus:outline-none uppercase transition-all duration-200 ${getStyle(value)} ${effectivelyLocked ? 'opacity-50 blur-[0.5px]' : 'cursor-pointer'}`}
        disabled={disabled || effectivelyLocked}
        readOnly={true} // Using Modal primarily
      />

      {/* Visual Markers */}
      <div className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-200 ${effectivelyLocked ? 'opacity-40' : 'opacity-100'}`}>
        {value.includes('⇄') && (
          <span className="absolute top-0.5 right-0.5 text-purple-400 z-20">
            <ArrowRightLeft size={10} />
          </span>
        )}
        {value.includes('■') && (
          <span className="absolute top-0.5 left-0.5 text-amber-500 z-20">
            <Square size={8} fill="currentColor" />
          </span>
        )}
        {/* Logic: If strictly just a run, show Big Dot. If it HAS run but isn't just '●', show Small Dot */}
        {value === '●' ? (
          <span className="text-rose-500 text-2xl flex items-center justify-center leading-none drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]">●</span>
        ) : hasRun && (
          <span className="absolute text-rose-500 text-[10px] bottom-0.5 right-0.5 flex items-center justify-center leading-none drop-shadow-[0_0_5px_rgba(225,29,72,0.8)] z-20">
            <Circle size={10} fill="currentColor" />
          </span>
        )}
      </div>
    </div>
  );
};

const LineupGrid: React.FC<{
  title: string;
  teamNameValue: string;
  onTeamNameChange: (val: string) => void;
  teamData: TeamData;
  onUpdate: (slotIndex: number, type: 'starter' | 'sub', field: keyof PlayerStats | 'score', value: any, inningIndex?: number, atBatIndex?: number, errorCulprit?: { team: 'visitor' | 'local', slotIdx: number, type: 'starter' | 'sub', updatePos?: string }) => void;
  onAddColumn: (inningIndex: number) => void;
  theme: 'purple' | 'amber';

  currentInningIdx: number;
  nextBatterIdx: number;
  opposingTeam: TeamData;
  onAdvanceInning: () => void;
  isFullScreenMode?: boolean; // New prop for sizing logic
}> = ({ title, teamNameValue, onTeamNameChange, teamData, onUpdate, onAddColumn, theme, currentInningIdx, nextBatterIdx, opposingTeam, onAdvanceInning, isFullScreenMode }) => {
  // isFullScreen, onToggleFullScreen, renderOverlay props are intentionally ignored to enforce external handling

  const [modalOpen, setModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<{
    slotIdx: number;
    type: 'starter' | 'sub';
    inningIdx: number;
    atBatIdx: number;
    currentVal: string;
    position: { x: number, y: number };
  } | null>(null);

  const [unlockedInnings, setUnlockedInnings] = useState<number[]>([]);

  const toggleUnlock = (inningIdx: number) => {
    setUnlockedInnings(prev =>
      prev.includes(inningIdx)
        ? prev.filter(i => i !== inningIdx)
        : [...prev, inningIdx]
    );
  };

  const handleCellClick = (e: React.MouseEvent | React.TouchEvent, slotIdx: number, type: 'starter' | 'sub', inningIdx: number, atBatIdx: number, currentVal: string) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Robust coordinate calculation that works for both mouse and touch
    // using the element's bounding box ensures the modal is always linked to the UI element
    setActiveCell({
      slotIdx, type, inningIdx, atBatIdx, currentVal,
      position: { x: rect.left + (rect.width / 2), y: rect.bottom }
    });
    setModalOpen(true);
  };

  const handleModalSelect = (val: string, isManualReplace = false, errorCulprit?: { team: 'visitor' | 'local', slotIdx: number, type: 'starter' | 'sub', updatePos?: string }) => {
    if (activeCell) {
      let newValue = val;

      if (!isManualReplace) {
        // Smart appending logic for buttons
        if (val === '●') {
          if (!activeCell.currentVal.includes('●')) {
            newValue = activeCell.currentVal ? activeCell.currentVal + '●' : '●';
          } else {
            newValue = activeCell.currentVal;
          }
        } else {
          const hasRun = activeCell.currentVal.includes('●');
          const hasEnd = activeCell.currentVal.includes('■');
          let suffix = '';
          if (hasRun && val !== '●') suffix += '●';
          if (hasEnd && val !== '■') suffix += '■';
          newValue = val + suffix;
        }
      }
      // Else: newValue is just val (for manual input/clear)

      onUpdate(activeCell.slotIdx, activeCell.type, 'score', newValue, activeCell.inningIdx, activeCell.atBatIdx, errorCulprit);
    }
  };

  const structure = teamData.slots[0].starter.scores;
  const totalColumns = structure.reduce((acc, inning) => acc + inning.length, 0);

  // Responsive Layout Constants
  const compact = isFullScreenMode; // Trigger compact mode when in full screen

  const COL_INDEX = compact ? 18 : 30;
  const COL_NO = compact ? 24 : 40;
  const COL_NAME = compact ? 90 : 160;
  const COL_SEX = compact ? 28 : 50;
  const COL_POS = compact ? 32 : 50;
  const COL_SCORE = compact ? 34 : 50;

  const LEFT_INDEX = 0;
  const LEFT_NO = COL_INDEX;
  const LEFT_NAME = COL_INDEX + COL_NO;
  const LEFT_SEX = COL_INDEX + COL_NO + COL_NAME;
  const LEFT_POS = COL_INDEX + COL_NO + COL_NAME + COL_SEX;

  const themeColors = {
    purple: {
      headerBg: 'bg-purple-900/50',
      headerText: 'text-purple-200',
      stickyBg: 'bg-[#1e1b4b]',
      subText: 'text-purple-200',
      inputPlaceholder: 'placeholder-purple-300/30'
    },
    amber: {
      headerBg: 'bg-orange-900/60',
      headerText: 'text-orange-200',
      stickyBg: 'bg-[#2a1205]',
      subText: 'text-orange-200',
      inputPlaceholder: 'placeholder-orange-300/30'
    }
  }[theme];

  return (
    <>
      <ScoringModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleModalSelect}
        currentValue={activeCell?.currentVal || ''}
        position={activeCell?.position || null}
        opposingTeam={opposingTeam}
      />

      {(() => {
        return (
          <div className={`mb-8 border rounded-xl p-4 bg-white/5 ${theme === 'purple' ? 'border-purple-500/20 shadow-purple-900/20' : 'border-amber-500/20 shadow-orange-900/20'} shadow-lg transition-all print-panel`}>

            <div className={`flex flex-col w-full h-full`}>
              <div className={`flex flex-col md:flex-row items-center justify-between gap-4 mb-4`}>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
                  <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/10 ${themeColors.headerText}`}>
                    {title}
                  </span>
                  <input
                    type="text"
                    value={teamNameValue}
                    onChange={(e) => onTeamNameChange(e.target.value)}
                    placeholder={`Nombre del Equipo ${theme === 'purple' ? 'Visitante' : 'Local'}`}
                    className={`bg-transparent text-xl md:text-2xl font-bold uppercase tracking-wide focus:outline-none border-b border-transparent focus:border-white/20 transition-all w-full md:w-auto ${theme === 'purple' ? 'text-white placeholder-purple-300/30' : 'text-white placeholder-orange-300/30'}`}
                  />
                </div>
              </div>

              <div className={`overflow-auto rounded-lg border border-white/10 bg-black/20 shadow-inner scrollbar-thin ${theme === 'purple' ? 'scrollbar-thumb-purple-600/50' : 'scrollbar-thumb-orange-600/50'} scrollbar-track-transparent pb-2 print-overflow-visible ${isFullScreenMode ? 'flex-1 h-full' : ''}`}>
                <div
                  className="grid min-w-max"
                  style={{
                    gridTemplateColumns: `${COL_INDEX}px ${COL_NO}px ${COL_NAME}px ${COL_SEX}px ${COL_POS}px repeat(${totalColumns}, ${COL_SCORE}px)`
                  }}
                >
                  {/* --- Header Row --- */}
                  <div className={`${themeColors.headerBg} p-2 text-center text-[10px] font-bold uppercase ${themeColors.headerText} border-b border-white/20 sticky z-20 left-sticky`} style={{ left: LEFT_INDEX, width: COL_INDEX }}>#</div>
                  <div className={`${themeColors.headerBg} p-2 text-center text-[10px] font-bold uppercase ${themeColors.headerText} border-b border-white/20 sticky z-20 left-sticky`} style={{ left: LEFT_NO, width: COL_NO }}>No.</div>
                  <div className={`${themeColors.headerBg} p-2 text-left text-[10px] font-bold uppercase ${themeColors.headerText} border-b border-white/20 sticky z-20 left-sticky`} style={{ left: LEFT_NAME, width: COL_NAME }}>Jugador</div>
                  <div className={`${themeColors.headerBg} p-2 text-center text-[10px] font-bold uppercase ${themeColors.headerText} border-b border-white/20 sticky z-20 left-sticky`} style={{ left: LEFT_SEX, width: COL_SEX }}>Sex</div>
                  <div className={`${themeColors.headerBg} p-2 text-center text-[10px] font-bold uppercase ${themeColors.headerText} border-b border-white/20 sticky z-20 left-sticky`} style={{ left: LEFT_POS, width: COL_POS }}>POS</div>

                  {structure.map((inningCols, iIdx) => {
                    const isExtra = iIdx >= 5;
                    const isLocked = iIdx < currentInningIdx;
                    const isUnlockedManually = unlockedInnings.includes(iIdx);
                    const effectiveLocked = isLocked && !isUnlockedManually;

                    return (
                      <div
                        key={iIdx}
                        className={`border-b border-l border-white/20 shadow-sm flex flex-col items-center justify-between ${compact ? 'py-0' : 'py-1'} px-1 
                          ${isExtra ? 'bg-indigo-900/50 text-indigo-200' : themeColors.headerBg + ' ' + themeColors.headerText} 
                          ${effectiveLocked ? 'opacity-50' : 'opacity-100'} 
                          transition-all duration-300 relative`}
                        style={{ gridColumn: `span ${inningCols.length}` }}
                      >
                        {/* Visual Indicator for Unlocked Past Inning */}
                        {isLocked && isUnlockedManually && (
                          <div className="absolute inset-0 border-2 border-yellow-400/50 rounded pointer-events-none animate-pulse"></div>
                        )}

                        <div className="flex items-center justify-between w-full px-1">
                          <span className="text-xs font-bold">{isExtra ? `${iIdx + 1} EX` : iIdx + 1}</span>

                          {isLocked ? (
                            <button
                              onClick={() => toggleUnlock(iIdx)}
                              className={`p-1 rounded-full transition-all duration-200 hover:scale-110
                                      ${isUnlockedManually
                                  ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                                  : 'bg-white/10 text-white/40 hover:bg-white/20 hover:text-white'
                                }`}
                              title={isUnlockedManually ? "Bloquear Entrada" : "Editar Entrada"}
                            >
                              {isUnlockedManually ? <LockOpen size={10} strokeWidth={3} /> : <Pencil size={10} />}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              {/* Add Column (Batting Around) */}
                              <button
                                onClick={() => onAddColumn(iIdx)}
                                className={`p-0.5 rounded transition-colors no-print hover:bg-white/20 text-white/50 hover:text-white`}
                                title="Añadir columna (Bateo corrido)"
                              >
                                <Plus size={8} />
                              </button>

                              {/* Advance Inning - Only for Current Inning */}
                              {iIdx === currentInningIdx && onAdvanceInning && (
                                <button
                                  onClick={onAdvanceInning}
                                  className={`ml-1 p-1 rounded-full transition-all duration-300 animate-pulse hover:animate-none 
                                     ${theme === 'purple' ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-orange-500 hover:bg-orange-400 text-white'} 
                                     shadow-lg border border-white/20`}
                                  title="Cerrar Entrada / Avanzar"
                                >
                                  <Plus size={14} strokeWidth={4} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* --- Player Rows --- */}
                  {teamData.slots.map((slot, idx) => {
                    const playerNum = idx + 1;
                    const isNextBatter = idx === nextBatterIdx;

                    // Determine Active Player (Starter or Sub)
                    // Active if sub has data OR if substitution marker '⇄' is in starter's history
                    const hasSubData = !!(slot.sub.name || slot.sub.number);
                    const scoresFlat = slot.starter.scores ? slot.starter.scores.flat() : [];
                    const hasSubMarker = scoresFlat.some(s => s && s.includes('⇄'));
                    const activeType = (hasSubData || hasSubMarker) ? 'sub' : 'starter';

                    // Highlight Classes
                    const starterRowClass = (isNextBatter && activeType === 'starter') ? 'bg-yellow-500/20' : themeColors.stickyBg;
                    const subRowClass = (isNextBatter && activeType === 'sub') ? 'bg-yellow-500/20' : (hasSubData ? 'bg-white/5' : themeColors.stickyBg);

                    return (
                      <React.Fragment key={playerNum}>
                        {/* STARTER ROW */}
                        <div className={`${starterRowClass} flex items-center justify-center ${theme === 'amber' ? 'text-orange-400' : 'text-purple-400'} font-bold border-b border-white/10 ${compact ? 'text-[10px]' : 'text-lg'} sticky z-10 backdrop-blur-md left-sticky transition-colors duration-300`} style={{ left: LEFT_INDEX }}>{playerNum}</div>

                        <div className={`border-b border-r border-white/10 sticky z-10 ${starterRowClass} backdrop-blur-md left-sticky transition-colors duration-300`} style={{ left: LEFT_NO }}>
                          <input
                            className={`w-full h-full bg-transparent text-center ${compact ? 'text-[10px]' : 'text-xs'} text-white focus:outline-none font-bold`}
                            value={slot.starter.number}
                            onChange={(e) => onUpdate(idx, 'starter', 'number', e.target.value)}
                          />
                        </div>

                        <div className={`border-b border-r border-white/10 sticky z-10 ${starterRowClass} backdrop-blur-md left-sticky transition-colors duration-300`} style={{ left: LEFT_NAME }}>
                          <input
                            className={`w-full h-full bg-transparent px-2 ${compact ? 'text-[10px]' : 'text-sm'} text-white focus:outline-none ${themeColors.inputPlaceholder}`}
                            placeholder="Nombre Titular"
                            value={slot.starter.name}
                            onChange={(e) => onUpdate(idx, 'starter', 'name', e.target.value)}
                          />
                        </div>

                        <div className={`border-b border-r border-white/10 sticky z-10 ${starterRowClass} left-sticky transition-colors duration-300`} style={{ left: LEFT_SEX }}>
                          <select
                            className={`w-full h-full bg-transparent text-center ${compact ? 'text-[10px]' : 'text-xs'} text-white focus:outline-none appearance-none [&>option]:bg-slate-900`}
                            value={slot.starter.gender}
                            onChange={(e) => onUpdate(idx, 'starter', 'gender', e.target.value)}
                          >
                            <option value="">-</option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                          </select>
                        </div>

                        <div className={`border-b border-r border-white/10 sticky z-10 ${starterRowClass} left-sticky transition-colors duration-300`} style={{ left: LEFT_POS }}>
                          <select
                            className={`w-full h-full bg-transparent text-center ${compact ? 'text-[10px]' : 'text-xs'} text-white focus:outline-none appearance-none [&>option]:bg-slate-900`}
                            value={slot.starter.pos}
                            onChange={(e) => onUpdate(idx, 'starter', 'pos', e.target.value)}
                          >
                            <option value="">-</option>
                            <option value="1B">1B</option>
                            <option value="2B">2B</option>
                            <option value="3B">3B</option>
                            <option value="SS">SS</option>
                            <option value="C">C</option>
                          </select>
                        </div>

                        {slot.starter.scores.map((inning, iIdx) =>
                          inning.map((score, atBatIdx) => {
                            const isCurrentInning = iIdx === currentInningIdx;
                            // Highlight blinker ONLY if this is the active type and next batter
                            const showHighlight = isNextBatter && activeType === 'starter' && isCurrentInning && score === '';

                            return (
                              <div key={`s-${iIdx}-${atBatIdx}`} className={`border-b border-r border-white/10 relative ${showHighlight ? 'z-20' : ''} ${starterRowClass}`}>
                                {showHighlight && (
                                  <div className="absolute inset-0 pointer-events-none animate-pulse bg-yellow-400/20 ring-2 ring-yellow-400 z-20 shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>
                                )}
                                <ScoreCell
                                  value={score}
                                  onChange={(val) => onUpdate(idx, 'starter', 'score', val, iIdx, atBatIdx)}
                                  onOpenModal={(e) => handleCellClick(e, idx, 'starter', iIdx, atBatIdx, score)}
                                  isEx={iIdx >= 5}
                                  isLocked={(iIdx < currentInningIdx) && !unlockedInnings.includes(iIdx)}
                                  compact={compact}
                                />
                              </div>
                            )
                          })
                        )}

                        {/* SUB ROW */}
                        <div className={`${subRowClass} text-[10px] text-white/40 flex items-center justify-center border-b border-white/10 font-bold tracking-wider sticky z-10 backdrop-blur-md left-sticky transition-colors duration-300`} style={{ left: LEFT_INDEX }}>SUB</div>
                        <div className={`border-b border-r border-white/10 sticky z-10 ${subRowClass} left-sticky transition-colors duration-300`} style={{ left: LEFT_NO }}>
                          <input
                            className="w-full h-full bg-transparent text-center text-xs text-white/70 focus:outline-none"
                            value={slot.sub.number}
                            onChange={(e) => onUpdate(idx, 'sub', 'number', e.target.value)}
                          />
                        </div>
                        <div className={`border-b border-r border-white/10 sticky z-10 ${subRowClass} left-sticky transition-colors duration-300`} style={{ left: LEFT_NAME }}>
                          <input
                            className={`w-full h-full bg-transparent px-2 text-xs ${themeColors.subText} focus:outline-none ${themeColors.inputPlaceholder}`}
                            placeholder="Sustituto"
                            value={slot.sub.name}
                            onChange={(e) => onUpdate(idx, 'sub', 'name', e.target.value)}
                          />
                        </div>
                        <div className={`border-b border-r border-white/10 sticky z-10 ${subRowClass} left-sticky transition-colors duration-300`} style={{ left: LEFT_SEX }}>
                          <select
                            className="w-full h-full bg-transparent text-center text-xs text-white/70 focus:outline-none appearance-none [&>option]:bg-slate-900"
                            value={slot.sub.gender}
                            onChange={(e) => onUpdate(idx, 'sub', 'gender', e.target.value)}
                          >
                            <option value="">-</option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                          </select>
                        </div>
                        <div className={`border-b border-r border-white/10 sticky z-10 ${subRowClass} left-sticky transition-colors duration-300`} style={{ left: LEFT_POS }}>
                          <select
                            className="w-full h-full bg-transparent text-center text-xs text-white/70 focus:outline-none appearance-none [&>option]:bg-slate-900"
                            value={slot.sub.pos}
                            onChange={(e) => onUpdate(idx, 'sub', 'pos', e.target.value)}
                          >
                            <option value="">-</option>
                            <option value="1B">1B</option>
                            <option value="2B">2B</option>
                            <option value="3B">3B</option>
                            <option value="SS">SS</option>
                            <option value="C">C</option>
                          </select>
                        </div>
                        {slot.sub.scores.map((inning, iIdx) =>
                          inning.map((score, atBatIdx) => {
                            const isCurrentInning = iIdx === currentInningIdx;
                            // Highlight blinker if active type is SUB
                            const showHighlight = isNextBatter && activeType === 'sub' && isCurrentInning && score === '';

                            return (
                              <div key={`sub-${iIdx}-${atBatIdx}`} className={`border-b border-r border-white/10 relative ${subRowClass}`}>
                                {showHighlight && (
                                  <div className="absolute inset-0 pointer-events-none animate-pulse bg-yellow-400/20 ring-2 ring-yellow-400 z-20 shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>
                                )}
                                <ScoreCell
                                  value={score}
                                  onChange={(val) => onUpdate(idx, 'sub', 'score', val, iIdx, atBatIdx)}
                                  onOpenModal={(e) => handleCellClick(e, idx, 'sub', iIdx, atBatIdx, score)}
                                  isEx={iIdx >= 5}
                                  disabled={(iIdx < currentInningIdx) && !unlockedInnings.includes(iIdx)}
                                  compact={compact}
                                />
                              </div>
                            )
                          })
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>


            {/* Overlay logic removed from here */}

          </div>
        );
      })()}
    </>
  );
};

// --- NEW FULL SCREEN SCORE SHEET COMPONENT ---
import { ChevronDown, ChevronUp } from 'lucide-react';

const ScoreSheetFullScreen: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setNum: string;
  visitorData: TeamData;
  localData: TeamData;
  gameInfo: any;
  updateGameInfo: (field: string, val: string) => void;
  updateTeam: (teamKey: 'visitorTeam' | 'localTeam', idx: number, type: 'starter' | 'sub', field: string, val: any, iIdx?: number, abIdx?: number, errorCulprit?: any) => void;
  handleAddColumn: (iIdx: number, team: 'visitor' | 'local') => void;
  currentInningIdx: number;
  visitorNextBatterIdx: number;
  localNextBatterIdx: number;
  onAdvanceInning: () => void;
  // Live Status Props
  liveStatusProps: LiveGameStatusProps;
}> = ({ isOpen, onClose, title, setNum, visitorData, localData, gameInfo, updateGameInfo, updateTeam, handleAddColumn, currentInningIdx, visitorNextBatterIdx, localNextBatterIdx, onAdvanceInning, liveStatusProps }) => {
  const [activeTeam, setActiveTeam] = useState<'visitor' | 'local'>('visitor');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Scaling State
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Auto-Scale Logic
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && contentRef.current) {
        const container = containerRef.current;
        const content = contentRef.current;

        const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

        // Use scrollWidth/Height to capture full size includin overflow
        const contentWidth = content.scrollWidth;
        const contentHeight = content.scrollHeight;

        if (contentWidth > 0 && contentHeight > 0) {
          const scaleX = containerWidth / contentWidth;
          const scaleY = containerHeight / contentHeight;

          // Use Math.min to ensure it fits BOTH dimensions (as requested: "if fields added it autsocales")
          // We use 0.98 to provide a safe margin
          const newScale = Math.min(scaleX, scaleY) * 0.98;
          setScale(newScale);
        }
      }
    };

    // Trigger on mount, resize, and activeTeam change (content change)
    window.addEventListener('resize', handleResize);
    // Slight delay to allow DOM to render
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [activeTeam, isHeaderVisible, isOpen]);

  // Auto-hide header after 1s
  useEffect(() => {
    if (isOpen) {
      setIsHeaderVisible(true);
      const timer = setTimeout(() => {
        setIsHeaderVisible(false);
      }, 2000); // 2 seconds to give user time to orient
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Auto-trigger immersive mode
      const enterFullScreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen(); // Safari/iOS
          }
        } catch (e) {
          console.warn("Fullscreen request denied or failed", e);
        }
      };
      enterFullScreen();
    } else {
      const exitFullScreen = async () => {
        try {
          if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
              await (document as any).webkitExitFullscreen();
            }
          }
        } catch (e) { console.warn("Exit fullscreen failed", e); }
      };
      exitFullScreen();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-[#121214] flex flex-col h-[100dvh] w-screen overflow-hidden text-white select-none">

      {/* --- SLIDING HEADER CONTAINER (Game Info + Live Status) --- */}
      <div
        className={`fixed top-0 left-0 w-full z-40 transition-transform duration-500 ease-in-out bg-[#1e1e24] shadow-2xl border-b border-white/10 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        {/* Top Info Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest hidden md:inline">Juego</span>
              <span className="text-sm font-black text-white">{setNum}</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <h2 className="text-sm md:text-lg font-bold text-white truncate max-w-[150px] md:max-w-md">{title}</h2>
          </div>
          {/* Placeholder for spacing, keeping layout balanced */}
          <div className="w-[200px]"></div>
        </div>

        {/* Live Game Status (Full Width) */}
        <LiveGameStatus {...liveStatusProps} inline={true} />
      </div>

      {/* --- PERSISTENT CONTROLS (Always Visible) --- */}
      <div className="fixed top-2 right-4 z-50 flex items-center gap-2">

        {/* Toggle Header Button */}
        <button
          onClick={() => setIsHeaderVisible(!isHeaderVisible)}
          className="w-10 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-colors"
        >
          {isHeaderVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {/* Team Switcher */}
        <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTeam('visitor')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTeam === 'visitor' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Visita
          </button>
          <button
            onClick={() => setActiveTeam('local')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${activeTeam === 'local' ? 'bg-amber-600 text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Local
          </button>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/30 backdrop-blur-md">
          <X size={20} />
        </button>
      </div>


      {/* --- MAIN CONTENT (Full Screen Grid) --- */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#121214]">

        {/* Orientation Warning Overlay */}
        <div className="absolute inset-0 z-[60] bg-[#1e1e24] flex flex-col items-center justify-center gap-6 p-8 text-center md:hidden portrait:flex landscape:hidden">
          <RotateCcw size={48} className="text-indigo-400 animate-spin-slow duration-[3s]" />
          <div className="max-w-xs">
            <h3 className="text-xl font-bold text-white mb-2">Gira tu dispositivo</h3>
            <p className="text-white/50 text-sm">Para usar la hoja de anotaciones en pantalla completa, por favor usa el modo horizontal.</p>
          </div>
        </div>

        {/* Lineup Grid Container - FORCED FULL SIZE NO SCROLL */}
        <div className="w-full h-full p-2 pt-16 md:pt-4 portrait:pt-20 landscape:p-0 flex flex-col">
          {/* Note: pt-16 added to account for buttons if needed, but in FS mode with hidden header, we want max space. 
              The persist buttons are top-right. The content can go up. */}

          <div ref={containerRef} className="flex-1 w-full h-full overflow-hidden flex items-center justify-start relative pl-2">
            <div
              ref={contentRef}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'left center', // Anchor left
                width: 'max-content'
              }}
            >
              {activeTeam === 'visitor' ? (
                <LineupGrid
                  title="Alineación Visitante"
                  teamNameValue={gameInfo.visitor}
                  onTeamNameChange={(val) => updateGameInfo('visitor', val)}
                  teamData={visitorData}
                  onUpdate={(idx, type, field, val, iIdx, abIdx, errorCulprit) => updateTeam('visitorTeam', idx, type, field, val, iIdx, abIdx, errorCulprit)}
                  onAddColumn={(iIdx) => handleAddColumn(iIdx, 'visitor')}
                  theme="purple"
                  currentInningIdx={currentInningIdx}
                  nextBatterIdx={visitorNextBatterIdx}
                  opposingTeam={localData}
                  onAdvanceInning={onAdvanceInning}
                  isFullScreenMode={true}
                />
              ) : (
                <LineupGrid
                  title="Alineación Local"
                  teamNameValue={gameInfo.home}
                  onTeamNameChange={(val) => updateGameInfo('home', val)}
                  teamData={localData}
                  onUpdate={(idx, type, field, val, iIdx, abIdx, errorCulprit) => updateTeam('localTeam', idx, type, field, val, iIdx, abIdx, errorCulprit)}
                  onAddColumn={(iIdx) => handleAddColumn(iIdx, 'local')}
                  theme="amber"
                  currentInningIdx={currentInningIdx}
                  nextBatterIdx={localNextBatterIdx}
                  opposingTeam={visitorData}
                  onAdvanceInning={onAdvanceInning}
                  isFullScreenMode={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface LiveGameStatusProps {
  visitorRuns: number;
  localRuns: number;
  inning: number;
  visitorOuts: number;
  localOuts: number;
  visitorName: string;
  localName: string;
  visitorLogo?: string;
  localLogo?: string;
  onSwap: () => void;
  onAdjustVisitor: (delta: number) => void;
  onAdjustLocal: (delta: number) => void;
  visitorHits: number;
  localHits: number;
  visitorErrors: number;
  localErrors: number;
  inningScores: {
    visitor: string[];
    local: string[];
  };
  inline?: boolean;
}

const LiveGameStatus = ({ visitorRuns, localRuns, inning, visitorOuts, localOuts, visitorName, localName, visitorLogo, localLogo, onSwap, onAdjustVisitor, onAdjustLocal, visitorHits, localHits, visitorErrors, localErrors, inningScores, inline }: LiveGameStatusProps) => {
  const [position, setPosition] = useState({ x: 0, y: 10 });
  const [isCompact, setIsCompact] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      // Correctly center initially - wider for table
      const width = Math.min(window.innerWidth - 20, 600); // Max width 600 or window width
      const initialX = (window.innerWidth - width) / 2;
      setPosition({ x: initialX > 0 ? initialX : 10, y: 10 });
      hasInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (isDragging) {
        setPosition({
          x: clientX - dragOffset.x,
          y: clientY - dragOffset.y
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.target instanceof Element && e.target.closest('.no-drag')) return; // Allow interaction with buttons
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, dragOffset]);

  const startDrag = (clientX: number, clientY: number, target: EventTarget | null) => {
    if (target instanceof Element && target.closest('.no-drag')) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => startDrag(e.clientX, e.clientY, e.target);
  const handleTouchStart = (e: React.TouchEvent) => startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);

  // Pad innings to always show at least 5 frames or current inning length
  const totalFrames = Math.max(5, Math.max(inningScores.visitor.length, inningScores.local.length));
  const frames = Array.from({ length: totalFrames }, (_, i) => i);

  if (inline) {
    return (
      <div className="w-full pointer-events-auto no-print select-none">
        <div className={`
          bg-[#1e1e24] border-b border-white/10 shadow-lg 
          flex flex-col overflow-hidden transition-all duration-300
        `}>
          {/* Main Bar */}
          <div className="flex items-stretch h-14 md:h-16 relative">
            {/* Content similar to portal version but static */}
            {/* We can refactor content to a sub-component to avoid duplication, but for now copying structure adjusting slightly for full-width */}
            <div className="flex-1 flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto w-full">
              {/* Visitor Score */}
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-3">
                  {visitorLogo ? <img src={visitorLogo} className="w-8 h-8 md:w-10 md:h-10 object-contain" /> : <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">{visitorName.substring(0, 1)}</div>}
                  <div className="text-left">
                    <div className="text-lg md:text-2xl font-bold font-mono leading-none">{visitorRuns}</div>
                    <div className="text-[10px] md:text-xs text-white/50 font-bold tracking-wider uppercase truncate max-w-[100px] md:max-w-[150px]">{visitorName}</div>
                  </div>
                </div>
                {/* Visitor Indicators */}
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < visitorOuts ? 'bg-red-500' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>

              {/* Center Status */}
              <div className="flex flex-col items-center justify-center px-4 w-32 md:w-48">
                <div className="text-xs font-bold text-white/40 mb-1">INNING {inning}</div>
                <div className="flex gap-4 text-[10px] text-white/30 font-mono">
                  <span>H: {visitorHits}-{localHits}</span>
                  <span>E: {visitorErrors}-{localErrors}</span>
                </div>
              </div>

              {/* Local Score */}
              <div className="flex items-center gap-4 flex-1 justify-end">
                {/* Local Indicators */}
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < localOuts ? 'bg-red-500' : 'bg-white/10'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="text-right">
                    <div className="text-lg md:text-2xl font-bold font-mono leading-none">{localRuns}</div>
                    <div className="text-[10px] md:text-xs text-white/50 font-bold tracking-wider uppercase truncate max-w-[100px] md:max-w-[150px]">{localName}</div>
                  </div>
                  {localLogo ? <img src={localLogo} className="w-8 h-8 md:w-10 md:h-10 object-contain" /> : <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">{localName.substring(0, 1)}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return createPortal(
    <div
      ref={containerRef}
      className={`fixed z-[160] pointer-events-auto no-print touch-none select-none`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {isCompact ? (
        <div className={`bg-[#2e2b44]/95 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl flex items-center px-4 py-2 gap-4 transition-shadow ${isDragging ? 'shadow-purple-500/20 cursor-grabbing' : 'cursor-grab'} ring-1 ring-black/50`}>
          <GripHorizontal size={14} className="text-white/20" />

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center leading-none relative group cursor-pointer">
              <span className="text-xl font-black text-purple-300">{visitorRuns}</span>
              <span className="text-[8px] font-bold text-white/50">{visitorName?.substring(0, 3) || 'VIS'}</span>
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/80 transition-opacity rounded backdrop-blur-sm">
                <button onClick={(e) => { e.stopPropagation(); onAdjustVisitor(-1); }} className="text-white hover:text-red-400 font-bold text-xs px-1">-</button>
                <button onClick={(e) => { e.stopPropagation(); onAdjustVisitor(1); }} className="text-white hover:text-green-400 font-bold text-xs px-1">+</button>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 mx-1"></div>

            <div className="flex flex-col items-center leading-none min-w-[30px]">
              <span className="text-xs font-bold text-white">INN {inning}</span>
              <div className="flex gap-0.5 mt-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full ${i < (Math.max(visitorOuts, localOuts)) ? 'bg-red-500' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 mx-1"></div>

            <div className="flex flex-col items-center leading-none relative group cursor-pointer">
              <span className="text-xl font-black text-amber-300">{localRuns}</span>
              <span className="text-[8px] font-bold text-white/50">{localName?.substring(0, 3) || 'LOC'}</span>
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/80 transition-opacity rounded backdrop-blur-sm">
                <button onClick={(e) => { e.stopPropagation(); onAdjustLocal(-1); }} className="text-white hover:text-red-400 font-bold text-xs px-1">-</button>
                <button onClick={(e) => { e.stopPropagation(); onAdjustLocal(1); }} className="text-white hover:text-green-400 font-bold text-xs px-1">+</button>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setIsCompact(false); }}
            className="ml-2 w-6 h-6 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors border border-white/5"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      ) : (
        <div className={`bg-[#2e2b44]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[650px] min-w-[320px] transition-shadow ${isDragging ? 'shadow-purple-500/20 cursor-grabbing' : 'cursor-grab'} ring-1 ring-black/50`}>

          {/* Table Structure */}
          <div className="flex flex-col text-[10px] md:text-xs">
            {/* Header */}
            <div className="flex bg-[#3f3c56] text-white/70 font-bold uppercase tracking-wider border-b border-white/10">
              <div className="w-24 md:w-32 p-2 pl-3 flex items-center justify-between">
                EQUIPO
                <button
                  onClick={(e) => { e.stopPropagation(); setIsCompact(true); }}
                  className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  title="Minimizar"
                >
                  <Minimize2 size={12} />
                </button>
              </div>
              {frames.map(i => (
                <div key={i} className="flex-1 min-w-[20px] p-2 text-center border-l border-white/10">{i + 1}</div>
              ))}
              <div className="w-8 md:w-10 p-2 text-center border-l border-white/10 text-white font-black bg-white/5">C</div>
              <div className="w-8 md:w-10 p-2 text-center border-l border-white/10 text-green-400 font-black bg-white/5">H</div>
              <div className="w-8 md:w-10 p-2 text-center border-l border-white/10 text-yellow-400 font-black bg-white/5">E</div>
            </div>

            {/* Visitor Row */}
            <div className="flex items-center border-b border-white/5 bg-[#2a1205]/10 relative group hover:bg-white/5 transition-colors">
              <div className="w-24 md:w-32 p-2 pl-3 flex flex-col justify-center relative">
                <span className="font-bold text-purple-300 uppercase truncate text-xs md:text-sm">{visitorName || 'VISITANTE'}</span>
                {/* Visitor Dots */}
                <div className="flex gap-1 mt-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full border border-red-500/40 ${i < visitorOuts ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'bg-transparent'}`} />
                  ))}
                </div>
              </div>
              {frames.map(i => (
                <div key={i} className="flex-1 min-w-[20px] p-2 text-center border-l border-white/5 font-mono font-bold text-white/80">
                  {inningScores.visitor[i] || '0'}
                </div>
              ))}
              <div className="w-8 md:w-10 p-2 text-center border-l border-white/5 font-mono font-black text-white text-sm bg-white/5 flex items-center justify-center relative group/score">
                {visitorRuns}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/score:opacity-100 bg-black/60 transition-opacity no-drag gap-1">
                  <button onClick={() => onAdjustVisitor(-1)} className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/30 text-xs">-</button>
                  <button onClick={() => onAdjustVisitor(1)} className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/30 text-xs">+</button>
                </div>
              </div>
              <div className="w-8 md:w-10 p-2 text-center border-l border-white/5 font-mono font-bold text-white/60 bg-white/5">{visitorHits}</div>
              <div className="w-8 md:w-10 p-2 text-center border-l border-white/5 font-mono font-bold text-white/60 bg-white/5">{visitorErrors}</div>
            </div>

            {/* Local Row */}
            <div className="flex items-center bg-[#2a1205]/20 relative group hover:bg-white/5 transition-colors">
              <div className="w-24 md:w-32 p-2 pl-3 flex flex-col justify-center relative">
                <span className="font-bold text-orange-300 uppercase truncate text-xs md:text-sm">{localName || 'LOCAL'}</span>
                {/* Local Dots */}
                <div className="flex gap-1 mt-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full border border-amber-500/40 ${i < localOuts ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]' : 'bg-transparent'}`} />
                  ))}
                </div>
              </div>
              {frames.map(i => (
                <div key={i} className="flex-1 min-w-[20px] p-2 text-center border-l border-white/5 font-mono font-bold text-white/80">
                  {inningScores.local[i] || '0'}
                </div>
              ))}
              <div className="w-8 md:w-10 p-2 text-center border-l border-white/5 font-mono font-black text-white text-sm bg-white/5 flex items-center justify-center relative group/score">
                {localRuns}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/score:opacity-100 bg-black/60 transition-opacity no-drag gap-1">
                  <button onClick={() => onAdjustLocal(-1)} className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/30 text-xs">-</button>
                  <button onClick={() => onAdjustLocal(1)} className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/30 text-xs">+</button>
                </div>
              </div>
              <div className="w-8 md:w-10 p-2 text-center border-l border-white/5 font-mono font-bold text-white/60 bg-white/5">{localHits}</div>
              <div className="w-8 md:w-10 p-2 text-center border-l border-white/5 font-mono font-bold text-white/60 bg-white/5">{localErrors}</div>
            </div>
          </div>

        </div>
      )}
    </div>,
    document.body
  );
};

const StatsTable: React.FC<{
  visitor: TeamData;
  local: TeamData;
  visitorName: string;
  localName: string;
  competitionName: string;
}> = ({ visitor, local, visitorName, localName, competitionName }) => {

  const calculateStats = (p: PlayerStats) => {
    let vb = 0; // At Bats
    let h = 0; // Hits
    let ca = 0; // Runs
    let e = 0; // Reached on Error / Safe
    let defE = p.defError || 0; // Defensive Errors

    (p.scores || []).flat().forEach(val => {
      const v = val.toUpperCase();
      if (v.includes('H')) h++;
      if (v.includes('●')) ca++;
      if (v.includes('E')) e++;

      // Calculating VB: Hit + Out + Error 
      // Note: This is a simplified logic for B5 based on provided nomenclature
      // Exclude 'EX' from VB
      if ((v.includes('H') || v.includes('X') || v.includes('E') || v.includes('S')) && !v.includes('EX')) vb++;
    });

    const ave = vb > 0 ? (h / vb).toFixed(3) : '.000';
    return { vb, h, ca, e, ave, defE };
  };

  const getAllStats = () => {
    const rows: any[] = [];
    const processTeam = (team: TeamData, tName: string) => {
      team.slots.forEach((slot, idx) => {
        // Starter
        const sStat = calculateStats(slot.starter);
        rows.push({
          team: tName, type: 'Titular', no: slot.starter.number || '-', name: slot.starter.name || `Jugador ${idx + 1}`,
          ...sStat
        });
        // Sub
        if (slot.sub.name || (slot.sub.scores || []).flat().some(x => x)) {
          const subStat = calculateStats(slot.sub);
          rows.push({
            team: tName, type: 'Sub', no: slot.sub.number || '-', name: slot.sub.name || 'Sustituto',
            ...subStat
          });
        }
      });
    };
    processTeam(visitor, visitorName || 'VISITANTE');
    processTeam(local, localName || 'LOCAL');
    return rows;
  };

  const exportToCSV = () => {
    const stats = getAllStats();
    const headers = ['Equipo', 'Tipo', 'No', 'Jugador', 'VB', 'H', 'CA', 'E (Def)', 'E (Emb)', 'AVE'];
    const delimiter = ';';
    const csvContent = [
      headers.join(delimiter),
      ...stats.map(row => [
        row.team,
        row.type,
        row.no,
        `"${row.name}"`, // Quote names to handle special chars
        row.vb,
        row.h,
        row.ca,
        row.defE, // Added Defensive Errors column which was missing in export headers match
        row.e,
        row.ave.replace('.', ',') // Replace dot with comma for Excel numbers in generic locales if needed, but standardizing on string is safer or letting Excel handle it. Let's keep raw ave for now but semicolon helps.
      ].join(delimiter))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `estadisticas_b5_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printStats = () => {
    document.body.classList.add('print-stats-only');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-stats-only');
    }, 100);
  };

  const renderRows = (team: TeamData, teamName: string, colorClass: string) => {
    return team.slots.map((slot, idx) => {
      const starterStats = calculateStats(slot.starter);
      return (
        <React.Fragment key={`${teamName}-${idx}`}>
          <tr className="border-b border-white/5 hover:bg-white/5 text-[10px] md:text-xs">
            <td className={`p-2 font-bold ${colorClass}`}>{teamName}</td>
            <td className="p-2 font-mono text-center">{slot.starter.number || '-'}</td>
            <td className="p-2 truncate max-w-[100px]">{slot.starter.name || 'Jugador ' + (idx + 1)}</td>
            <td className="p-2 text-center text-white/70">{starterStats.vb}</td>
            <td className="p-2 text-center text-green-400 font-bold">{starterStats.h}</td>
            <td className="p-2 text-center text-rose-400 font-bold">{starterStats.ca}</td>
            <td className="p-2 text-center text-yellow-500 font-bold">{starterStats.defE}</td>
            <td className="p-2 text-center text-yellow-400">{starterStats.e}</td>
            <td className="p-2 text-center font-mono text-white">{starterStats.ave}</td>
          </tr>
          {(slot.sub.name || slot.sub.scores.flat().some(x => x)) && (
            <tr className="border-b border-white/5 hover:bg-white/5 bg-white/[0.02] text-[10px] md:text-xs">
              <td className={`p-2 uppercase tracking-wider ${colorClass} opacity-70`}>Sub</td>
              <td className="p-2 font-mono text-center">{slot.sub.number || '-'}</td>
              <td className="p-2 truncate max-w-[100px] text-white/70">{slot.sub.name || 'Sustituto'}</td>
              <td className="p-2 text-center text-white/50">{calculateStats(slot.sub).vb}</td>
              <td className="p-2 text-center text-green-400/70">{calculateStats(slot.sub).h}</td>
              <td className="p-2 text-center text-rose-400/70">{calculateStats(slot.sub).ca}</td>
              <td className="p-2 text-center text-yellow-500/70">{calculateStats(slot.sub).defE}</td>
              <td className="p-2 text-center text-yellow-400/70">{calculateStats(slot.sub).e}</td>
              <td className="p-2 text-center font-mono text-white/70">{calculateStats(slot.sub).ave}</td>
            </tr>
          )}
        </React.Fragment>
      );
    });
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-xl mt-6 print-stats-table relative print:border-none print:shadow-none">
      <style>{`
        @media print {
          body.print-stats-only * { visibility: hidden; }
          body.print-stats-only .print-stats-table,
          body.print-stats-only .print-stats-table * { visibility: visible; }
          body.print-stats-only .print-stats-table {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          body.print-stats-only .print-stats-table th,
          body.print-stats-only .print-stats-table td {
             color: black !important;
             border-color: #ddd !important;
          }
           body.print-stats-only .print-stats-table .print-header { display: flex !important; margin-bottom: 20px; }
        }
      `}</style>

      {/* Header specifically for Printing */}
      <div className="hidden print-header flex-col items-center justify-center border-b-2 border-black pb-4 mb-4">
        <div className="flex items-center gap-4">
          <img src="/logo.png" className="w-16 h-16 object-contain" alt="Logo" />
          <div className="text-center">
            <h1 className="text-2xl font-bold uppercase text-black">{competitionName || 'COMPETENCIA'}</h1>
            <p className="text-sm text-gray-600 font-semibold">ESTADÍSTICAS EN TIEMPO REAL</p>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
          Creado por B5ToolsPro
        </div>
      </div>
      <div className="p-3 bg-white/10 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Table2 size={16} className="text-purple-300" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-white">Estadísticas en Tiempo Real</h3>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={exportToCSV} className="p-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded border border-green-600/30 transition-colors" title="Exportar Excel/CSV">
            <FileSpreadsheet size={14} />
          </button>

        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase bg-black/20 text-white/50">
            <tr>
              <th className="p-2">Equipo</th>
              <th className="p-2 text-center">No</th>
              <th className="p-2">Jugador</th>
              <th className="p-2 text-center" title="Veces al Bate">VB</th>
              <th className="p-2 text-center" title="Hits">H</th>
              <th className="p-2 text-center" title="Carreras Anotadas">CA</th>
              <th className="p-2 text-center" title="Errores Defensivos">E (Def)</th>
              <th className="p-2 text-center" title="Embasa por Error">E (Emb)</th>
              <th className="p-2 text-center" title="Promedio">AVE</th>
            </tr>
          </thead>
          <tbody>
            {renderRows(visitor, visitorName || 'VISITANTE', 'text-purple-300')}
            {renderRows(local, localName || 'LOCAL', 'text-orange-300')}
          </tbody>
        </table>
      </div>
      <div className="p-2 text-[9px] text-white/30 text-center italic bg-black/20">
        * VB = Hits + Outs + Error | E = Embasado por Error
      </div>
    </div>
  );
};

const DraggableTrigger: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => {
  const [positionY, setPositionY] = useState(window.innerHeight / 2);
  const [isDragging, setIsDragging] = useState(false);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      let clientY = 0;
      if (e instanceof MouseEvent) clientY = e.clientY;
      else if (e instanceof TouchEvent) clientY = e.touches[0].clientY;

      // Constrain to window height with some padding
      const newY = Math.max(50, Math.min(window.innerHeight - 50, clientY - offsetY));
      setPositionY(newY);
    };

    const handleUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove as any);
      window.addEventListener('touchmove', handleMove as any, { passive: false });
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove as any);
      window.removeEventListener('touchmove', handleMove as any);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, offsetY]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Don't trigger click on start
    let clientY = 0;
    if (e.nativeEvent instanceof MouseEvent) clientY = e.nativeEvent.clientY;
    else if (e.nativeEvent instanceof TouchEvent) clientY = e.nativeEvent.touches[0].clientY;

    setOffsetY(clientY - positionY);
    setIsDragging(true);
  };

  return (
    <button
      onClick={(e) => {
        if (!isDragging) onClick();
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      style={{ top: positionY }}
      className={`fixed right-0 z-[140] bg-white/10 hover:bg-purple-500/80 backdrop-blur-md p-3 rounded-l-xl border-l border-t border-b border-white/20 shadow-lg group transition-all duration-75 no-print ${isDragging ? 'cursor-grabbing scale-110 bg-purple-600' : 'cursor-grab hover:pr-5 -translate-y-1/2'}`}
      title="Análisis Avanzado (Arrastra para mover)"
    >
      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/20 rounded-full" />
      <LineChart size={24} className="text-white group-hover:scale-110 transition-transform ml-2" />
    </button>
  );
};

const StatsChart: React.FC<{
  type: 'line' | 'bar';
  dataV: number[];
  dataL: number[];
  labels: string[];
  vName: string;
  lName: string;
  height?: number;
}> = ({ type, dataV = [], dataL = [], labels, vName, lName, height = 200 }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 300;
  const padding = 30;
  const graphWidth = width - padding * 2;
  const step = labels.length > 1 ? graphWidth / (labels.length - 1) : graphWidth;

  // Normalize scale (safe fallback)
  const maxVal = Math.max(...dataV, ...dataL, 10) || 10;
  const yScale = (val: number) => (height - padding) - ((val / maxVal) * (height - padding * 2));

  // Path Builder for Line
  const buildPath = (data: number[]) => {
    return data.map((val, i) =>
      `${i === 0 ? 'M' : 'L'} ${padding + (i * step)} ${yScale(val)}`
    ).join(' ');
  };

  return (
    <div className="w-full relative select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Grid */}
        <line x1={padding} y1={yScale(0)} x2={width - padding} y2={yScale(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1={padding} y1={yScale(maxVal)} x2={width - padding} y2={yScale(maxVal)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

        {/* LINE CHART */}
        {type === 'line' && (
          <>
            <path d={buildPath(dataV)} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg opacity-80" />
            <path d={buildPath(dataL)} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg opacity-80" />

            {labels.map((_, i) => (
              <g key={i}>
                {/* Visitor Point */}
                <circle
                  cx={padding + (i * step)} cy={yScale(dataV[i])} r={hoverIdx === i ? 6 : 4}
                  fill="#1a1a20" stroke="#a855f7" strokeWidth="2"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}
                />
                {/* Local Point */}
                <circle
                  cx={padding + (i * step)} cy={yScale(dataL[i])} r={hoverIdx === i ? 6 : 4}
                  fill="#1a1a20" stroke="#f59e0b" strokeWidth="2"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}
                />
              </g>
            ))}
          </>
        )}

        {/* BAR CHART */}
        {type === 'bar' && labels.map((_, i) => {
          const barW = (step / 3);
          const x = padding + (i * step) - (barW);
          return (
            <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
              <rect
                x={x} y={yScale(dataV[i])} width={barW} height={height - padding - yScale(dataV[i])}
                fill="#a855f7" className="opacity-80 hover:opacity-100 transition-opacity" rx="2"
              />
              <rect
                x={x + barW + 2} y={yScale(dataL[i])} width={barW} height={height - padding - yScale(dataL[i])}
                fill="#f59e0b" className="opacity-80 hover:opacity-100 transition-opacity" rx="2"
              />
              {/* Invisible Hover Zone */}
              <rect x={x - 5} y={0} width={barW * 2 + 10} height={height} fill="transparent" />
            </g>
          );
        })}

        {/* Labels */}
        {labels.map((p, i) => (
          <text key={p} x={padding + (i * step)} y={height + 15} textAnchor="middle" fill={hoverIdx === i ? "white" : "rgba(255,255,255,0.5)"} fontSize="10" fontWeight="bold">
            {p}
          </text>
        ))}
      </svg>

      {/* Tooltip Overlay */}
      {hoverIdx !== null && (
        <div
          className="absolute bg-black/90 text-white text-[10px] p-2 rounded border border-white/20 shadow-xl z-10 pointer-events-none"
          style={{
            left: `${((padding + (hoverIdx * step)) / width) * 100}%`,
            top: '10%',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-bold border-b border-white/10 mb-1 pb-1">{labels[hoverIdx]}</div>
          <div className="flex gap-2 items-center text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> {vName.substring(0, 3)}: <span className="font-mono font-bold ml-auto">{dataV[hoverIdx].toFixed(labels[hoverIdx] === 'AVE' ? 3 : 0)}</span>
          </div>
          <div className="flex gap-2 items-center text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> {lName.substring(0, 3)}: <span className="font-mono font-bold ml-auto">{dataL[hoverIdx].toFixed(labels[hoverIdx] === 'AVE' ? 3 : 0)}</span>
          </div>
        </div>

      )
      }
    </div >
  );

};

// --- Comic Bubble / Tutorial Hint Component ---
const FullScreenHintBubble: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      className="absolute z-[1000] w-72 bg-[#1e1e24] text-white p-4 rounded-xl shadow-2xl cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500
                 bottom-[150%] left-1/2 -translate-x-1/2  /* Mobile: Above */
                 md:top-[150%] md:bottom-auto           /* Desktop: Below */
                 border border-purple-500/30
      "
      style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }}
    >
      {/* Tail - Mobile (Points Down) */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-4 h-4 bg-[#1e1e24] border-r border-b border-purple-500/30 rotate-45 transform md:hidden"></div>

      {/* Tail - Desktop (Points Up) */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 w-4 h-4 bg-[#1e1e24] border-l border-t border-purple-500/30 rotate-45 transform hidden md:block"></div>

      <div className="flex items-start gap-3">
        <div className="shrink-0 bg-purple-600 p-2 rounded-lg">
          <Maximize2 size={20} className="text-white" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-purple-300 mb-1">Modo Pantalla Completa</h4>
          <p className="text-xs text-white/80 leading-relaxed">
            Ahora puede llevar sus anotaciones fáciles en pantalla completa.
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button className="text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors">Entendido</button>
      </div>
    </div>
  );
};


// --- Inline Subscription View using Reuseable Component ---
const PanelSubscriptionView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentTier, loading, handleUpdatePlan } = useSubscription();

  return (
    <div className="absolute inset-0 bg-[#0f0e1a] z-50 flex flex-col animate-in fade-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-slate-900">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Ban size={18} className="text-purple-400" /> Mejorar Plan
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <SubscriptionPlans
          currentTier={currentTier}
          onUpdate={(tier) => {
            handleUpdatePlan(tier);
            // Optionally close on success or let user close
          }}
          loading={loading}
          mode="inline"
        />
      </div>
    </div>
  );
};

const AdvancedStatsPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  visitor: TeamData;
  local: TeamData;
  visitorName: string;
  localName: string;
  plan: string;
  isUserLoggedIn: boolean;
}> = ({ isOpen, onClose, visitor, local, visitorName, localName, plan, isUserLoggedIn }) => {
  const [customCharts, setCustomCharts] = useState<{ id: number, type: 'line' | 'bar', metrics: string[] }[]>([]);
  const [newChartMode, setNewChartMode] = useState(false);
  const [newChartType, setNewChartType] = useState<'line' | 'bar'>('bar');

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['H', 'CA']);
  const [chartsEnabled, setChartsEnabled] = useState(false); // Default to false if restricted
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const [showUpgrade, setShowUpgrade] = useState(false);

  const isPro = plan === 'pro' || plan === 'ultra';

  const handleToggle = () => {
    if (!isUserLoggedIn) {
      window.location.href = '/dashboard?login=true'; // Redirect to dashboard with optional param
      return;
    }

    if (!isPro) {
      setShowUpgrade(true);
      return;
    }
    setChartsEnabled(!chartsEnabled);
  };

  const availableMetrics = ['VB', 'H', 'CA', 'E', 'AVE'];

  const toggleMetric = (m: string) => {
    setSelectedMetrics(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const addChart = () => {
    if (selectedMetrics.length === 0) return;
    setCustomCharts([...customCharts, { id: Date.now(), type: newChartType, metrics: selectedMetrics }]);
    setNewChartMode(false);
    setSelectedMetrics(['H', 'CA']);
  };

  const removeChart = (id: number) => {
    setCustomCharts(prev => prev.filter(c => c.id !== id));
  };

  // --- OPTIMIZATION START ---
  // Memoize heavy calculations to prevent updates when panel is closed or charts disabled.
  // This satisfies the requirement: "que mientras el toogle este desactivado los graficos no se esten actualizando"

  const shouldCalculate = isOpen && chartsEnabled;

  const { visitorMVP, localMVP } = useMemo(() => {
    if (!shouldCalculate) return { visitorMVP: null, localMVP: null };

    // --- Helper: Calculate MVP ---
    const getMVP = (team: TeamData) => {
      let bestPlayer = { name: '', number: '', h: 0, ca: 0, vb: 0, ave: 0, score: -1 };

      const processPlayer = (p: PlayerStats) => {
        let vb = 0, h = 0, ca = 0;
        p.scores.flat().forEach(val => {
          const v = val.toUpperCase();
          if (v.includes('H')) h++;
          if (v.includes('●')) ca++;
          // Exclude 'EX' (Extra Inning Runner) from VB. 'EX' contains 'X', so we must check !v.includes('EX')
          if ((v.includes('H') || v.includes('X') || v.includes('E') || v.includes('S')) && !v.includes('EX')) vb++;
        });
        const ave = vb > 0 ? (h / vb) : 0;
        const score = (h * 3) + (ca * 2) + (ave * 10);

        if (score > bestPlayer.score && vb > 0) {
          bestPlayer = { name: p.name || 'Sin Nombre', number: p.number, h, ca, vb, ave, score };
        }
      };

      team.slots.forEach(slot => {
        processPlayer(slot.starter);
        processPlayer(slot.sub);
      });

      return bestPlayer.score > -1 ? bestPlayer : null;
    };

    return {
      visitorMVP: getMVP(visitor),
      localMVP: getMVP(local)
    };
  }, [shouldCalculate, visitor, local]); // Re-calc only if needed and data changes

  const { vStats, lStats } = useMemo(() => {
    if (!shouldCalculate) return { vStats: { vb: 0, h: 0, ca: 0, e: 0, ave: 0 }, lStats: { vb: 0, h: 0, ca: 0, e: 0, ave: 0 } };

    // --- Helper: Calculate Team Totals ---
    const getTeamStats = (team: TeamData) => {
      let vb = 0, h = 0, ca = 0, e = 0;
      team.slots.forEach(slot => {
        [slot.starter, slot.sub].forEach(p => {
          p.scores.flat().forEach(val => {
            const v = val.toUpperCase();
            if (v.includes('H')) h++;
            if (v.includes('●')) ca++;
            if (v.includes('E')) e++;
            // Exclude 'EX' from VB
            if ((v.includes('H') || v.includes('X') || v.includes('E') || v.includes('S')) && !v.includes('EX')) vb++;
          });
        });
      });
      return {
        vb,
        h,
        ca,
        e: Number.isNaN(e) ? 0 : e, // Ensure no NaN
        ave: vb > 0 ? (h / vb) : 0
      };
    };

    return {
      vStats: getTeamStats(visitor),
      lStats: getTeamStats(local)
    };
  }, [shouldCalculate, visitor, local]);

  // General Chart Default Data
  const defaultMetrics = ['VB', 'H', 'CA', 'AVE'];

  const getChartData = (metrics: string[]) => {
    // If not calculating, return empty structures to prevent errors if render happens, though likely unused.
    if (!shouldCalculate) return { dataV: [], dataL: [] };

    const maxVal = Math.max(vStats.vb, lStats.vb, 10);
    const dataV = metrics.map(m => {
      if (m === 'VB') return vStats.vb;
      if (m === 'H') return vStats.h;
      if (m === 'CA') return vStats.ca;
      if (m === 'E') return vStats.e;
      if (m === 'AVE') return vStats.ave * maxVal; // Scaled
      return 0;
    });
    const dataL = metrics.map(m => {
      if (m === 'VB') return lStats.vb;
      if (m === 'H') return lStats.h;
      if (m === 'CA') return lStats.ca;
      if (m === 'E') return lStats.e;
      if (m === 'AVE') return lStats.ave * maxVal; // Scaled
      return 0;
    });
    return { dataV, dataL };
  };

  return (
    <>
      <SubscriptionModal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} />
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-[190] backdrop-blur-sm" onClick={onClose} />}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#1a1a20] shadow-2xl transform transition-all duration-300 overflow-y-auto ${isOpen ? 'translate-x-0 opacity-100 z-[200] pointer-events-auto' : 'translate-x-[20px] opacity-0 z-[-1] pointer-events-none'}`}>
        {/* Internal Upgrade View */}
        {showUpgrade && <PanelSubscriptionView onClose={() => setShowUpgrade(false)} />}

        <div className="p-5 pb-20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
              <TrendingUp size={24} className="text-purple-400" />
              Análisis Avanzado

            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2" title="Activar/Desactivar Gráficos">
                <span className={`text-[10px] uppercase font-bold ${!isPro ? 'text-orange-400' : 'text-white/40'}`}>
                  {!isPro ? 'MEJORAR PLAN' : (chartsEnabled ? 'ON' : 'OFF')}
                </span>
                <button
                  onClick={handleToggle}
                  className={`w-10 h-5 rounded-full p-1 transition-colors relative ${!isPro ? 'bg-orange-500/20 border border-orange-500/50' : (chartsEnabled ? 'bg-purple-500' : 'bg-white/10 border border-white/10')}`}
                >
                  <div className={`w-3 h-3 rounded-full shadow-sm transition-transform duration-200 flex items-center justify-center ${chartsEnabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-white/50'}`}>
                    {!isPro && <Lock size={8} className="text-orange-600" />}
                  </div>
                </button>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Legend */}
            <div className="flex justify-center gap-6 text-xs font-bold">
              <div className="flex items-center gap-2 text-purple-300">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div> {visitorName || 'Visitante'}
              </div>
              <div className="flex items-center gap-2 text-amber-300">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div> {localName || 'Local'}
              </div>
            </div>

            {/* --- MVP Section --- */}
            {shouldCalculate ? (
              <div>
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3">Jugadores Destacados (MVP)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Visitor MVP */}
                  <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-purple-900/50 to-purple-600/20 border border-purple-500/30">
                    <div className="text-[10px] font-bold text-purple-300 mb-1">{visitorName || 'VISITANTE'}</div>
                    <div className="text-sm font-bold text-white truncate">{visitorMVP?.name || '---'}</div>
                    <div className="text-xl font-black text-purple-400 mt-1">{visitorMVP?.ave?.toFixed(3) || '.000'}</div>
                  </div>
                  {/* Local MVP */}
                  <div className="relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-amber-900/50 to-amber-600/20 border border-amber-500/30">
                    <div className="text-[10px] font-bold text-amber-300 mb-1">{localName || 'LOCAL'}</div>
                    <div className="text-sm font-bold text-white truncate">{localMVP?.name || '---'}</div>
                    <div className="text-xl font-black text-amber-400 mt-1">{localMVP?.ave?.toFixed(3) || '.000'}</div>
                  </div>
                </div>
              </div>
            ) : (
              // INFO MESSAGE WHEN DISABLED
              (!chartsEnabled && isOpen) && (
                <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 border-dashed rounded-xl text-center animate-in fade-in duration-500">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <TrendingUp size={24} className="text-white/30" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Módulo Detenido</h3>
                  <p className="text-xs text-white/50 max-w-[200px]">
                    Para ver estadísticas y gráficos en tiempo real, activa el módulo usando el interruptor superior.
                  </p>
                </div>
              )
            )}

            {/* --- Charts Section (Toggleable) --- */}
            {shouldCalculate && (
              <div className="animate-in fade-in slide-in-from-bottom duration-500">

                {/* --- General Chart --- */}
                <div>
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3 mt-6">Comparativa General</h3>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <StatsChart
                      type="line"
                      labels={defaultMetrics}
                      {...getChartData(defaultMetrics)}
                      vName={visitorName} lName={localName}
                    />
                  </div>
                </div>

                {/* --- Custom Charts List --- */}
                {customCharts.map((chart, idx) => (
                  <div key={chart.id} className="animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-2 mt-6">
                      <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Gráfico Personalizado #{idx + 1}</h3>
                      <button onClick={() => removeChart(chart.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <StatsChart
                        type={chart.type}
                        labels={chart.metrics}
                        {...getChartData(chart.metrics)}
                        vName={visitorName} lName={localName}
                      />
                    </div>
                  </div>
                ))}

                {/* --- Add Graph Button --- */}
                {customCharts.length < 3 && !newChartMode && (
                  <button
                    onClick={() => setNewChartMode(true)}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 text-white/30 hover:text-white transition-all flex flex-col items-center gap-2 group mt-4"
                  >
                    <PlusCircle size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-xs uppercase tracking-widest">Añadir Gráfico</span>
                  </button>
                )}

                {/* --- New Chart Wizard --- */}
                {newChartMode && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-4 animate-in fade-in zoom-in-95">
                    <h3 className="font-bold text-white mb-4 flex justify-between items-center">
                      Nuevo Gráfico
                      <button onClick={() => setNewChartMode(false)}><X size={16} className="text-white/50" /></button>
                    </h3>

                    <div className="mb-4">
                      <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Tipo de Gráfico</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewChartType('bar')}
                          className={`flex-1 py-2 rounded border text-xs font-bold transition-colors ${newChartType === 'bar' ? 'bg-purple-500 border-purple-400 text-white' : 'bg-transparent border-white/20 text-white/50'}`}
                        >
                          <BarChart size={14} className="inline mr-1" /> Barras
                        </button>
                        <button
                          onClick={() => setNewChartType('line')}
                          className={`flex-1 py-2 rounded border text-xs font-bold transition-colors ${newChartType === 'line' ? 'bg-purple-500 border-purple-400 text-white' : 'bg-transparent border-white/20 text-white/50'}`}
                        >
                          <LineChart size={14} className="inline mr-1" /> Líneas
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-xs text-white/50 font-bold uppercase mb-2 block">Métricas a Comparar</label>
                      <div className="flex flex-wrap gap-2">
                        {availableMetrics.map(m => (
                          <button
                            key={m}
                            onClick={() => toggleMetric(m)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${selectedMetrics.includes(m) ? 'bg-white text-black border-white' : 'bg-transparent text-white/40 border-white/10'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={addChart}
                      className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white font-bold text-xs shadow-lg active:scale-95 transition-transform"
                    >
                      Crear Gráfico
                    </button>
                  </div>

                )}
              </div>
            )}

          </div>
        </div >
      </div >
    </>
  );
};

const SingleSetScoreCard: React.FC<{
  setNum: number;
  onWinnerUpdate: (winner: { name: string; score: string; isVisitor: boolean } | null) => void;
  currentSet: number;
  setWinners: ({ name: string; score: string; isVisitor: boolean } | null)[];
  onSetChange: (set: number) => void;
}> = ({ setNum, onWinnerUpdate, currentSet, setWinners, onSetChange }) => {
  const [state, setState] = useState<ScoreCardState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [fullScreenMode, setFullScreenMode] = useState<boolean>(false);
  const [showFullScreenHint, setShowFullScreenHint] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('basic');
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    // --- Persistence Logic: Show only first 3 times or until actioned ---
    const hasActioned = localStorage.getItem('hasUsedFullScreen') === 'true';
    const viewCount = parseInt(localStorage.getItem('fullScreenHintViews') || '0');

    if (!hasActioned && viewCount < 3) {
      setShowFullScreenHint(true);
      localStorage.setItem('fullScreenHintViews', (viewCount + 1).toString());
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setIsUserLoggedIn(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', data.user.id)
          .single();

        if (profile?.subscription_tier) {
          setSubscriptionTier(profile.subscription_tier);
        }
      } else {
        setIsUserLoggedIn(false);
      }
    });

    const handleSubscriptionUpdate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsUserLoggedIn(true);
        const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
        if (profile) setSubscriptionTier(profile.subscription_tier);
      } else {
        setIsUserLoggedIn(false);
      }
    };
    window.addEventListener('subscription-updated', handleSubscriptionUpdate);
    return () => window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`b5_scorekeeper_set_${setNum}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Robustness Check: Ensure critical structure exists
        if (parsed && typeof parsed === 'object') {
          // 1. Ensure Teams exist with Slots
          if (!parsed.visitorTeam || !parsed.visitorTeam.slots) parsed.visitorTeam = createEmptyTeam();
          if (!parsed.localTeam || !parsed.localTeam.slots) parsed.localTeam = createEmptyTeam();

          // 2. Ensure Game Info exists
          if (!parsed.gameInfo) parsed.gameInfo = { ...initialState.gameInfo };

          // 3. Patch missing scores arrays (Migration for older data)
          const patchSlots = (slots: any[]) => {
            if (!Array.isArray(slots)) return [];
            return slots.map(slot => {
              if (!slot) return { starter: createEmptyPlayer(), sub: createEmptyPlayer() };
              if (!slot.starter) slot.starter = createEmptyPlayer();
              if (!slot.sub) slot.sub = createEmptyPlayer();

              if (!slot.starter.scores) slot.starter.scores = [['']];
              if (!slot.sub.scores) slot.sub.scores = [['']];
              return slot;
            });
          };

          parsed.visitorTeam.slots = patchSlots(parsed.visitorTeam.slots);
          parsed.localTeam.slots = patchSlots(parsed.localTeam.slots);

          setState(parsed);
        }
      } catch (e) {
        console.error("Error loading/parsing saved state, reverting to default:", e);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(`b5_scorekeeper_set_${setNum}`, JSON.stringify(state));
    }
  }, [state, loaded, setNum]);

  useEffect(() => {
    onWinnerUpdate(state.winner);
  }, [state.winner]);

  useEffect(() => {
    if (fullScreenMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullScreenMode]);

  // --- AUTO ADVANCE INNING LOGIC ---
  useEffect(() => {
    if (state.winner) return; // Don't advance if game over

    const currentInningIdx = state.visitorTeam.slots[0].starter.scores.length - 1;
    // Check if we need to verify inputs to prevent loop? 
    // We only want to advance if the CURRENT inning is full (3 outs each).
    // And if we haven't already advanced (which we check by seeing if length > currentInningIdx, but local scope only knows current).

    const countOuts = (team: TeamData, idx: number) => {
      let outs = 0;
      team.slots.forEach(slot => {
        const inningAtBats = (slot.starter.scores || [])[idx] || [];
        inningAtBats.forEach(val => { if (val && val.toUpperCase().includes('X') && !val.includes('Ex')) outs++; });

        const subAtBats = (slot.sub.scores || [])[idx] || [];
        subAtBats.forEach(val => { if (val && val.toUpperCase().includes('X') && !val.includes('Ex')) outs++; });
      });
      return outs;
    };

    const vOuts = countOuts(state.visitorTeam, currentInningIdx);
    const lOuts = countOuts(state.localTeam, currentInningIdx);

    if (vOuts >= 3 && lOuts >= 3) {
      // Both teams have 3 outs in the current inning.
      // We should advance.
      // Use setTimeout to allow visual confirmation.
      const timer = setTimeout(() => {
        confirmAdvanceInning();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.visitorTeam, state.localTeam, state.winner]);

  // SAFE GUARD: Ensure slots exist before accessing [0]
  const vScores = state.visitorTeam.slots?.[0]?.starter?.scores;
  const currentInningIdx = (vScores && vScores.length > 0) ? vScores.length - 1 : 0;
  const currentInning = currentInningIdx + 1;

  const calculateRunsFromGrid = (team: TeamData) => {
    let runs = 0;
    team.slots.forEach(slot => {
      (slot.starter.scores || []).flat().forEach(val => { if (val && val.includes('●')) runs++; });
      (slot.sub.scores || []).flat().forEach(val => { if (val && val.includes('●')) runs++; });
    });
    return runs;
  };

  const countHits = (team: TeamData) => {
    let hits = 0;
    team.slots.forEach(slot => {
      (slot.starter.scores || []).flat().forEach(val => { if (val && val.includes('H')) hits++; });
      (slot.sub.scores || []).flat().forEach(val => { if (val && val.includes('H')) hits++; });
    });
    return hits;
  };

  const countTotalPlays = (team: TeamData) => {
    let plays = 0;
    team.slots.forEach(slot => {
      (slot.starter.scores || []).flat().forEach(val => { if (val && val.trim() && !val.includes('⇄')) plays++; });
      // Subs share the slot, so their plays count towards the slot's turn usually, 
      // but simple logic: count all non-empty cells in the grid to determine rotation is standard.
      // Better logic: Find the LAST non-empty cell across the whole team history.
      // Simplified Logic for "Next Batter": Total Plays % 9 (or roster size).
      (slot.sub.scores || []).flat().forEach(val => { if (val && val.trim() && !val.includes('⇄')) plays++; });
    });
    return plays;
  };

  const vSlotsLen = state.visitorTeam.slots?.length || 1;
  const lSlotsLen = state.localTeam.slots?.length || 1;
  const visitorNextBatterIdx = countTotalPlays(state.visitorTeam) % (vSlotsLen > 0 ? vSlotsLen : 1);
  const localNextBatterIdx = countTotalPlays(state.localTeam) % (lSlotsLen > 0 ? lSlotsLen : 1);

  const visitorRunsManual = state.inningScores.visitor.reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
  const localRunsManual = state.inningScores.local.reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
  const visitorRunsGrid = calculateRunsFromGrid(state.visitorTeam);
  const localRunsGrid = calculateRunsFromGrid(state.localTeam);

  // Use manual adjustments
  const visitorRunsTotal = Math.max(visitorRunsManual, visitorRunsGrid) + (state.scoreAdjustments?.visitor || 0);
  const localRunsTotal = Math.max(localRunsManual, localRunsGrid) + (state.scoreAdjustments?.local || 0);

  const visitorHits = countHits(state.visitorTeam);
  const localHits = countHits(state.localTeam);

  const countOutsForInning = (team: TeamData, iIdx: number) => {
    let outs = 0;
    team.slots.forEach(slot => {
      ((slot.starter.scores || [])[iIdx] || []).forEach(val => { if (val && val.trim().toUpperCase().includes('X') && !val.includes('Ex')) outs++; });
      ((slot.sub.scores || [])[iIdx] || []).forEach(val => { if (val && val.trim().toUpperCase().includes('X') && !val.includes('Ex')) outs++; });
    });
    return Math.min(outs, 3);
  };

  const visitorOuts = countOutsForInning(state.visitorTeam, currentInningIdx);
  const localOuts = countOutsForInning(state.localTeam, currentInningIdx);

  // Auto-advance disabled manually
  // useEffect(() => {
  //   if (!loaded) return;
  //   if (state.winner) return;
  //
  //   const countOuts = (team: TeamData) => {
  //     const lastInningIdx = team.slots[0].starter.scores.length - 1;
  //     let outs = 0;
  //     team.slots.forEach(slot => {
  //       slot.starter.scores[lastInningIdx].forEach(val => {
  //         if (val.trim().toUpperCase().includes('X')) outs++;
  //       });
  //       slot.sub.scores[lastInningIdx].forEach(val => {
  //         if (val.trim().toUpperCase().includes('X')) outs++;
  //       });
  //     });
  //     return outs;
  //   };
  //
  //   const vOuts = countOuts(state.visitorTeam);
  //   const lOuts = countOuts(state.localTeam);
  //   const currentInningCount = state.visitorTeam.slots[0].starter.scores.length;
  //
  //   if (vOuts >= 3 && lOuts >= 3) {
  //     setState(prev => {
  //       if (prev.visitorTeam.slots[0].starter.scores.length > currentInningCount) return prev;
  //       const newVisitorTeam = { ...prev.visitorTeam };
  //       newVisitorTeam.slots.forEach(slot => { slot.starter.scores.push(['']); slot.sub.scores.push(['']); });
  //       const newLocalTeam = { ...prev.localTeam };
  //       newLocalTeam.slots.forEach(slot => { slot.starter.scores.push(['']); slot.sub.scores.push(['']); });
  //       return {
  //         ...prev,
  //         visitorTeam: newVisitorTeam,
  //         localTeam: newLocalTeam,
  //         inningScores: { visitor: [...prev.inningScores.visitor, ''], local: [...prev.inningScores.local, ''] }
  //       };
  //     });
  //   }
  //
  // }, [state.visitorTeam, state.localTeam, loaded, state.winner]);

  const confirmAdvanceInning = () => {
    setState(prev => {
      const addInningToTeam = (team: TeamData) => ({
        ...team,
        slots: team.slots.map(slot => ({
          ...slot,
          starter: {
            ...slot.starter,
            scores: [...slot.starter.scores, ['']]
          },
          sub: {
            ...slot.sub,
            scores: [...slot.sub.scores, ['']]
          }
        }))
      });

      return {
        ...prev,
        visitorTeam: addInningToTeam(prev.visitorTeam),
        localTeam: addInningToTeam(prev.localTeam),
        inningScores: { visitor: [...prev.inningScores.visitor, ''], local: [...prev.inningScores.local, ''] }
      };
    });
    setShowAdvanceModal(false);
  };



  const handleScoreAdjustment = (team: 'visitor' | 'local', delta: number) => {
    setState(prev => ({
      ...prev,
      scoreAdjustments: {
        ...prev.scoreAdjustments,
        [team]: (prev.scoreAdjustments?.[team] || 0) + delta
      }
    }));
  };

  const updateGameInfo = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setState(prev => ({ ...prev, gameInfo: { ...prev.gameInfo, [parent]: { ...(prev.gameInfo[parent as keyof typeof prev.gameInfo] as any), [child]: value } } }));
    } else {
      setState(prev => ({ ...prev, gameInfo: { ...prev.gameInfo, [field]: value } }));
    }
  };

  const updateTeam = (team: 'visitorTeam' | 'localTeam', index: number, type: 'starter' | 'sub', field: string, value: any, inningIndex?: number, atBatIndex?: number, errorCulprit?: { team: string, slotIdx: number, type: 'starter' | 'sub', updatePos?: string }) => {
    setState(prev => {
      if (prev.winner) return prev;

      const newTeam = { ...prev[team] };
      const newSlots = [...newTeam.slots];
      const slot = { ...newSlots[index] };
      const player = { ...slot[type] };

      let nextHistory = [...prev.history];
      let nextErrors = { ...prev.errors };
      let nextInningScores = { ...prev.inningScores };
      let foundWinner = null;

      const opposingTeamKey = team === 'visitorTeam' ? 'localTeam' : 'visitorTeam';
      let opposingTeamData = { ...prev[opposingTeamKey] };
      let opSlots = [...opposingTeamData.slots];

      if (field === 'score' && inningIndex !== undefined && atBatIndex !== undefined) {
        const newScores = [...player.scores];
        const newInning = [...newScores[inningIndex]];
        let isThirdOut = false;

        // --- CHECK PREVIOUS VALUE FOR UNDO LOGIC ---
        const prevValue = player.scores[inningIndex][atBatIndex];
        if (prevValue.startsWith('S-')) {
          // It was an error with specific culprit
          const culpritNum = prevValue.split('-')[1];
          // Find this player in opposing team and decrement defError
          for (let i = 0; i < opSlots.length; i++) {
            const s = { ...opSlots[i] };
            let pType: 'starter' | 'sub' | null = null;
            if (s.starter.number === culpritNum) pType = 'starter';
            else if (s.sub.number === culpritNum) pType = 'sub';

            if (pType) {
              const p = { ...s[pType] };
              p.defError = Math.max(0, (p.defError || 0) - 1); // Decrement
              s[pType] = p;
              opSlots[i] = s; // Update the slot in the working copy
              break;
            }
          }
        }
        // --- END UNDO LOGIC ---


        let actionDesc = '';
        const vUpper = value.toUpperCase();
        if (vUpper.includes('X')) actionDesc = 'OUT';
        if (vUpper.includes('H')) actionDesc = 'HIT';
        if (vUpper.includes('E')) actionDesc = 'ERROR (Salvado)';
        if (vUpper.includes('●')) actionDesc = actionDesc ? actionDesc + ' + CARRERA' : 'CARRERA';
        if (value === 'Ex1B') actionDesc = 'Corredor en 1B por Extrainning';
        if (value === 'Ex2B') actionDesc = 'Corredor en 2B por Extrainning';
        if (value === 'Ex3B') actionDesc = 'Corredor en 3B por Extrainning';
        if (value === '') actionDesc = 'BORRAR / CAMBIO';

        if (errorCulprit) {
          // Visual only for history, actual update below
          const opTeamData = prev[opposingTeamKey];
          const culpritPlayer = opTeamData.slots[errorCulprit.slotIdx][errorCulprit.type];
          actionDesc += ` (Error de #${culpritPlayer.number})`;
        }

        if (actionDesc) {
          nextHistory.unshift({
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            inning: inningIndex + 1,
            teamName: team === 'visitorTeam' ? (prev.gameInfo.visitor || 'Visitante') : (prev.gameInfo.home || 'Local'),
            playerNum: player.number || `#${index + 1}`,
            playerName: player.name || 'Jugador',
            actionCode: value,
            description: actionDesc
          });
          if (nextHistory.length > 50) nextHistory = nextHistory.slice(0, 50);
        }

        // Check if it's an OUT (contains X) but NOT an Extra Inning Runner (Ex...)
        if (value.toUpperCase().includes('X') && !value.includes('Ex') && !value.includes('■')) {
          let existingOuts = 0;
          prev[team].slots.forEach((s, sIdx) => {
            s.starter.scores[inningIndex].forEach((v, vIdx) => { if (sIdx === index && type === 'starter' && vIdx === atBatIndex) return; if (v.toUpperCase().includes('X') && !v.includes('Ex')) existingOuts++; });
            s.sub.scores[inningIndex].forEach((v, vIdx) => { if (sIdx === index && type === 'sub' && vIdx === atBatIndex) return; if (v.toUpperCase().includes('X') && !v.includes('Ex')) existingOuts++; });
          });

          if (existingOuts === 2) {
            value = value + '■';
            isThirdOut = true;
          }
        }

        newInning[atBatIndex] = value;
        newScores[inningIndex] = newInning;
        player.scores = newScores;

        // const prevValue already captured above
        const hadRun = prevValue.includes('●');
        const hasRun = value.includes('●');

        if (!hadRun && hasRun) {
          const isVisitor = team === 'visitorTeam';
          const currentSummary = parseInt(prev.inningScores[isVisitor ? 'visitor' : 'local'][inningIndex] || '0');
          const targetScores = [...nextInningScores[isVisitor ? 'visitor' : 'local']];
          targetScores[inningIndex] = (currentSummary + 1).toString();
          nextInningScores[isVisitor ? 'visitor' : 'local'] = targetScores;

          // --- WALK-OFF LOGIC (Walk-off) ---
          if (!isVisitor && inningIndex >= 4) { // Bottom of 5th or later (Index 4 = 5th Inning)
            // Need to check total scores with this new run
            const tempState = { ...prev, [team]: newTeam }; // newTeam has the run
            const vRuns = calculateRunsFromGrid(tempState.visitorTeam) + (prev.scoreAdjustments?.visitor || 0);
            const lRuns = calculateRunsFromGrid(tempState.localTeam) + (prev.scoreAdjustments?.local || 0);

            if (lRuns > vRuns) {
              foundWinner = { name: prev.gameInfo.home || 'LOCAL', score: `${lRuns} - ${vRuns}`, isVisitor: false };
            }
          }
        } else if (hadRun && !hasRun) {
          const isVisitor = team === 'visitorTeam';
          const currentSummary = parseInt(prev.inningScores[isVisitor ? 'visitor' : 'local'][inningIndex] || '0');
          const targetScores = [...nextInningScores[isVisitor ? 'visitor' : 'local']];
          targetScores[inningIndex] = Math.max(0, currentSummary - 1).toString();
          nextInningScores[isVisitor ? 'visitor' : 'local'] = targetScores;
        }

        const hadError = prevValue.includes('E');
        const hasError = value.includes('E');
        const errorTeam = team === 'visitorTeam' ? 'local' : 'visitor';

        if (!hadError && hasError) {
          const currentErrors = parseInt(nextErrors[errorTeam] || '0');
          nextErrors[errorTeam] = (currentErrors + 1).toString();
        } else if (hadError && !hasError) {
          const currentErrors = parseInt(nextErrors[errorTeam] || '0');
          nextErrors[errorTeam] = Math.max(0, currentErrors - 1).toString();
        }

        if (isThirdOut) {
          // Simplified Check for win condition
          const tempState = { ...prev, [team]: newTeam };
          const vRuns = calculateRunsFromGrid(tempState.visitorTeam);
          const lRuns = calculateRunsFromGrid(tempState.localTeam);
          const vAdj = prev.scoreAdjustments?.visitor || 0;
          const lAdj = prev.scoreAdjustments?.local || 0;

          const finalV = vRuns + vAdj;
          const finalL = lRuns + lAdj;

          const isVisitorUpdate = (team === 'visitorTeam');

          // Win condition: We are in inning 5+ (index 4), and logic should ideally check if trailing team has had their turn.
          // For simplicity/requirement: If inning >= 5 and score diff exists after pair of innings.
          // But here we check *after every 3rd out*.
          // If Visitor just finished inning 9 top, game isn't over unless Local is already ahead? 
          // Simplified: If inning >= 9 (index 8) or whatever "game end" is. 
          // For now, let's just use the existing logic but FIX THE SCORE calculation.

          // --- WIN CONDITION LOGIC (Reglas B5: 5 innings) ---

          // inningIndex 4 = 5th Inning
          if (inningIndex >= 4) {
            if (isVisitorUpdate) {
              // Top of the inning just ended (Visitor 3rd out)
              // If Local is ALREADY winning, they don't need to bat in bottom of 5th (or later). Game Over.
              if (finalL > finalV) {
                foundWinner = { name: prev.gameInfo.home || 'LOCAL', score: `${finalL} - ${finalV}`, isVisitor: false };
              }
            } else {
              // Bottom of the inning just ended (Local 3rd out)
              // Inning is complete.
              // If Visitor is winning, Game Over.
              // If Local is winning, Game Over (This case is rare to reach here due to Walk-off logic above, but possible if they were already ahead and didn't score this inning, or scored runs but not "walk-off" style - wait, if they are ahead at any point in bottom 5, walk-off triggers. So this is mostly for "Visitor Wins" or "Tie -> Next Inning")
              if (finalV > finalL) {
                foundWinner = { name: prev.gameInfo.visitor || 'VISITANTE', score: `${finalV} - ${finalL}`, isVisitor: true };
              } else if (finalL > finalV) {
                // Should have been caught by walk-off or previous state, but safe to declare.
                foundWinner = { name: prev.gameInfo.home || 'LOCAL', score: `${finalL} - ${finalV}`, isVisitor: false };
              }
            }
          }
        }
      } else {
        (player as any)[field] = value;
      }



      slot[type] = player;
      newSlots[index] = slot;
      newTeam.slots = newSlots;

      if (errorCulprit) {
        // Use existing opSlots from top scope
        let opSlot = { ...opSlots[errorCulprit.slotIdx] };
        let opPlayer = { ...opSlot[errorCulprit.type] };

        // Update Position if requested
        if (errorCulprit.updatePos) {
          opPlayer.pos = errorCulprit.updatePos;
        }

        opPlayer.defError = (opPlayer.defError || 0) + 1;

        opSlot[errorCulprit.type] = opPlayer;
        opSlots[errorCulprit.slotIdx] = opSlot;
      }

      // Ensure the opposingTeamData has the latest slots (modified by Undo or Redo)
      opposingTeamData.slots = opSlots;

      return {
        ...prev,
        [team]: newTeam,
        [opposingTeamKey]: opposingTeamData,
        inningScores: nextInningScores,
        errors: nextErrors,
        winner: foundWinner || prev.winner,
        history: nextHistory
      };
    });
  };

  const updateInningScore = (team: 'visitor' | 'local', index: number, value: string) => {
    setState(prev => {
      const newScores = [...prev.inningScores[team]];
      newScores[index] = value;
      return { ...prev, inningScores: { ...prev.inningScores, [team]: newScores } };
    });
  };

  const handleAddColumn = (inningIndex: number, team: 'visitor' | 'local') => {
    setState(prev => {
      const targetTeamKey = team === 'visitor' ? 'visitorTeam' : 'localTeam';
      const currentTeam = prev[targetTeamKey];

      const newSlots = currentTeam.slots.map(slot => ({
        ...slot,
        starter: {
          ...slot.starter,
          scores: slot.starter.scores.map((inning, idx) =>
            idx === inningIndex ? [...inning, ''] : inning
          )
        },
        sub: {
          ...slot.sub,
          scores: slot.sub.scores.map((inning, idx) =>
            idx === inningIndex ? [...inning, ''] : inning
          )
        }
      }));

      return {
        ...prev,
        [targetTeamKey]: {
          ...currentTeam,
          slots: newSlots
        }
      };
    });
  };

  const swapTeams = () => {
    setState(prev => ({
      ...prev,
      visitorTeam: prev.localTeam,
      localTeam: prev.visitorTeam,
      gameInfo: {
        ...prev.gameInfo,
        visitor: prev.gameInfo.home,
        home: prev.gameInfo.visitor,
        visitorLogo: prev.gameInfo.homeLogo,
        homeLogo: prev.gameInfo.visitorLogo
      },
      inningScores: {
        visitor: prev.inningScores.local,
        local: prev.inningScores.visitor
      },
      errors: {
        visitor: prev.errors.local,
        local: prev.errors.visitor
      },
      timeouts: {
        visitor: prev.timeouts.local,
        local: prev.timeouts.visitor
      }
    }));
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setState(initialState);
    setShowResetConfirm(false);
  };



  const handlePrint = () => {
    window.print();
  };

  return (<>
    {/* --- Sticky Tab Navigation (Moved Up) --- */}
    {/* Mobile: Fixed Bottom, Desktop: Sticky Top */}
    <div className="fixed bottom-0 left-0 right-0 z-[999] bg-[#1e1e24] shadow-[0_-4px_10px_rgba(0,0,0,0.3)] border-t border-white/10 md:sticky md:top-0 md:bg-[#1e1e24] md:shadow-md md:mb-0 md:border-b md:border-t-0 md:w-full md:rounded-t-2xl no-print">
      <div className="flex flex-row items-center gap-1 md:gap-2 px-2 py-2 w-full overflow-x-auto scrollbar-hide md:max-w-[1400px] md:mx-auto">

        {/* 1. Logo */}
        {/* 1. Logo - Visible on Mobile now, Back Action */}
        <div className="shrink-0 cursor-pointer" onClick={() => window.history.back()}>
          <img src="/logo.png" alt="B5Tools" className="h-8 w-8 object-contain" />
        </div>

        {/* 3. Restart Button */}
        <button
          onClick={handleReset}
          className="shrink-0 p-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
          title="Reiniciar Partido"
        >
          <RotateCcw size={18} />
          <span className="hidden md:inline text-xs font-bold uppercase">Reiniciar</span>
        </button>

        {/* 4. Full Screen Button */}
        {/* 4. Full Screen Button */}
        <div className="relative">
          {showFullScreenHint && <FullScreenHintBubble onClose={() => { setShowFullScreenHint(false); /* Dismiss just for session */ }} />}
          <button
            onClick={() => {
              setFullScreenMode(true);
              setShowFullScreenHint(false);
              localStorage.setItem('hasUsedFullScreen', 'true'); // Actioned! Never show again.
            }}
            className={`shrink-0 p-2 rounded-md flex items-center gap-2 transition-all duration-500 relative z-[1001]
              ${showFullScreenHint
                ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.6)] ring-2 ring-purple-400 ring-offset-2 ring-offset-[#1e1e24]'
                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
              }
            `}
            title="Pantalla Completa"
          >
            <Maximize2 size={18} className="stroke-[3]" />
            <span className="hidden md:inline text-xs font-bold uppercase">Pantalla Completa</span>
          </button>
        </div>

        {/* 5. Sets Tabs */}
        <div className="flex flex-row gap-1 shrink-0 ml-2">
          {[1, 2, 3].map(sNum => {
            const winner = setWinners[sNum - 1];
            let label = `Set ${sNum}`;
            let scoreLabel = '';
            if (winner && winner.name) {
              label = `S${sNum}`;
              scoreLabel = winner.score;
            }

            return (
              <button
                key={sNum}
                onClick={() => onSetChange(sNum)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase whitespace-nowrap flex items-center gap-1 transition-all duration-300
                        ${currentSet === sNum
                    ? 'bg-purple-600 text-white shadow-[0_-4px_10px_rgba(147,51,234,0.5)] -translate-y-1 md:shadow-[0_4px_10px_rgba(147,51,234,0.5)] md:translate-y-1'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
              >
                <span className={currentSet === sNum ? '' : 'hidden md:inline'}>{label}</span>
                <span className={currentSet === sNum ? 'hidden' : 'md:hidden'}>{sNum}</span>
                {scoreLabel && <span className="text-[10px] opacity-80 bg-black/20 px-1 rounded">{scoreLabel}</span>}
              </button>
            );
          })}
        </div>


        <div className="flex-1 min-w-[10px]"></div>

        {/* --- DESKTOP ACTIONS (Inline) --- */}
        <div className="hidden md:flex items-center gap-2">

          {/* 6. Swap Button */}
          <button onClick={swapTeams} className="shrink-0 p-2 rounded-full bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" title="Alternar Equipos">
            <ArrowRightLeft size={18} />
          </button>

          {/* 7. Sidebar Toggle */}
          <button onClick={() => setShowSidebar(!showSidebar)} className="shrink-0 p-2 rounded-full bg-white/5 text-white/70 hover:text-white" title={showSidebar ? "Ocultar Panel" : "Mostrar Panel"}>
            {showSidebar ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>

          {/* 8. Stats */}
          <button onClick={() => setShowStats(!showStats)} className={`shrink-0 p-2 rounded-full transition-colors ${showStats ? 'bg-indigo-500 text-white shadow-lg' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'}`} title="Estadísticas">
            <LineChart size={18} />
          </button>

          {/* 9. Advanced Stats */}
          <button onClick={() => setShowAdvancedStats(!showAdvancedStats)} className={`shrink-0 p-2 rounded-full transition-colors ${showAdvancedStats ? 'bg-pink-500 text-white shadow-lg' : 'bg-pink-500/10 text-pink-400 hover:bg-pink-500/20'}`} title="Estadísticas Avanzadas">
            <BarChart size={18} />
          </button>

          {/* 10. Print */}
          <button onClick={handlePrint} className="shrink-0 p-2 rounded-full bg-green-500/10 text-green-300 hover:bg-green-500/20" title="Imprimir">
            <Printer size={18} />
          </button>
        </div>

        {/* --- MOBILE ACTIONS (Combined Menu) --- */}
        <div className="md:hidden flex items-center gap-2 relative">
          {/* Always show Swap on Mobile (Critical) */}
          <button onClick={swapTeams} className="shrink-0 p-2 rounded-full bg-orange-500/10 text-orange-400" title="Alternar Equipos">
            <ArrowRightLeft size={18} />
          </button>

          {/* Hamburger Trigger */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`shrink-0 p-2 rounded-lg transition-colors ${showMobileMenu ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70'}`}
          >
            <MenuIcon size={20} />
          </button>

          {/* Mobile Dropdown Menu */}
          {showMobileMenu && (
            <>
              <div className="fixed inset-0 z-[200] bg-black/50" onClick={() => setShowMobileMenu(false)} />
              <div className="fixed bottom-24 right-4 w-56 bg-[#1e1e24] border border-white/10 rounded-xl shadow-2xl p-2 z-[201] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">

                <button onClick={() => { setShowSidebar(!showSidebar); setShowMobileMenu(false); }} className="p-3 rounded-lg hover:bg-white/5 flex items-center gap-3 text-sm text-white/80">
                  {showSidebar ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                  <span>{showSidebar ? 'Ocultar Panel' : 'Mostrar Panel'}</span>
                </button>

                <button onClick={() => { setShowStats(!showStats); setShowMobileMenu(false); }} className={`p-3 rounded-lg flex items-center gap-3 text-sm ${showStats ? 'bg-indigo-500 text-white' : 'hover:bg-white/5 text-white/80'}`}>
                  <LineChart size={16} /> <span>Estadísticas</span>
                </button>

                <button onClick={() => { setShowAdvancedStats(!showAdvancedStats); setShowMobileMenu(false); }} className={`p-3 rounded-lg flex items-center gap-3 text-sm ${showAdvancedStats ? 'bg-pink-500 text-white' : 'hover:bg-white/5 text-white/80'}`}>
                  <BarChart size={16} /> <span>Avanzadas</span>
                </button>

                <div className="h-px bg-white/10 my-1"></div>

                <button onClick={() => { handlePrint(); setShowMobileMenu(false); }} className="p-3 rounded-lg hover:bg-white/5 flex items-center gap-3 text-sm text-green-400">
                  <Printer size={16} /> <span>Imprimir / PDF</span>
                </button>
              </div>
            </>
          )}
        </div>


      </div>
    </div>

    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-t-none p-4 md:p-8 shadow-2xl relative transition-all duration-300 mb-20 md:mb-0 pb-32 md:pb-8 print-container">

      {/* --- Sticky Tab Navigation (Refactored) --- */}
      {/* --- Sticky Tab Navigation (Refactored) --- */}
      {/* Mobile: Fixed Bottom, Desktop: Sticky Top */}

      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; padding: 0 !important; margin: 0 !important; overflow: visible !important; height: auto !important; }
          #root { height: auto !important; overflow: visible !important; }
          .no-print, .fixed:not(.mini-card), button:not(.mini-maximize) { display: none !important; }
          /* Logic for printing ONLY stats table when requested */
          body.print-stats-only > * { display: none !important; }
          body.print-stats-only .print-stats-table { display: block !important; position: absolute; top: 0; left: 0; width: 100%; margin: 0; }
          body.print-stats-only .print-stats-table * { visibility: visible !important; }

          .print-container { box-shadow: none !important; border: none !important; background: white !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; position: static !important; }
          .print-panel { border: 1px solid #ccc !important; background: transparent !important; box-shadow: none !important; color: black !important; margin-bottom: 20px !important; break-inside: avoid; page-break-inside: avoid; }
          .print-panel input, .print-panel select { color: black !important; border: 1px solid #ddd !important; background: transparent !important; font-size: 10px !important; }
          .print-overflow-visible { overflow: visible !important; }
          .left-sticky { position: static !important; background: white !important; color: black !important; border-color: #ccc !important; }
          .bg-white\\/5 { background: transparent !important; border-color: #ccc !important; }
          .bg-white\\/10 { background: #eee !important; color: black !important; }
          .text-white { color: black !important; }
          .text-white\\/50 { color: #666 !important; }
          .text-white\\/40 { color: #888 !important; }
          .text-white\\/80 { color: #333 !important; }
          .text-white\\/70 { color: #444 !important; }
          .bg-slate-900 { background: white !important; }
        }
      `}</style>

      <WinnerModal winner={state.winner} onClose={() => setState(prev => ({ ...prev, winner: null }))} />
      <ResetConfirmModal isOpen={showResetConfirm} onConfirm={confirmReset} onCancel={() => setShowResetConfirm(false)} />
      <AdvanceInningModal
        isOpen={showAdvanceModal}
        onConfirm={confirmAdvanceInning}
        onCancel={() => setShowAdvanceModal(false)}
        visitorOuts={visitorOuts}
        localOuts={localOuts}
        nextInning={currentInning + 1}
      />

      <LiveGameStatus
        visitorRuns={visitorRunsTotal}
        localRuns={localRunsTotal}
        inning={currentInning}
        visitorOuts={visitorOuts}
        localOuts={localOuts}
        visitorName={state.gameInfo.visitor}
        localName={state.gameInfo.home}
        visitorLogo={state.gameInfo.visitorLogo}
        localLogo={state.gameInfo.homeLogo}
        onSwap={swapTeams}
        onAdjustVisitor={(delta) => handleScoreAdjustment('visitor', delta)}
        onAdjustLocal={(delta) => handleScoreAdjustment('local', delta)}
        visitorHits={visitorHits}
        localHits={localHits}
        visitorErrors={parseInt(state.errors.visitor)}
        localErrors={parseInt(state.errors.local)}
        inningScores={state.inningScores}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 pb-6 border-b border-white/10 mt-20 md:mt-10 no-print">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300">
            Tarjeta de Anotación
          </h2>
          <p className="text-white/40 text-xs mt-1">B5Tools Official Scoring System</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 print-panel p-4 rounded-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <GlassInput placeholder="Juego #" className="text-center" value={state.gameInfo.gameNum} onChange={e => updateGameInfo('gameNum', e.target.value)} />
          <GlassInput placeholder="Set #" className="text-center" value={state.gameInfo.setNum} onChange={e => updateGameInfo('setNum', e.target.value)} />
          <GlassInput placeholder="Fecha" type="date" className="col-span-2 md:col-span-2" value={state.gameInfo.date} onChange={e => updateGameInfo('date', e.target.value)} />
        </div>
      </div>

      {
        showStats && (
          <div className="mb-8 animate-in slide-in-from-top duration-300">
            <StatsTable visitor={state.visitorTeam} local={state.localTeam} visitorName={state.gameInfo.visitor} localName={state.gameInfo.home} competitionName={state.gameInfo.competition} />
          </div>
        )
      }

      {/* Advanced Stats Toggle Button (Draggable) */}
      <DraggableTrigger onClick={() => setShowAdvancedStats(true)} />

      {/* Advanced Stats Panel */}
      <AdvancedStatsPanel
        isOpen={showAdvancedStats}
        onClose={() => setShowAdvancedStats(false)}
        visitor={state.visitorTeam}
        local={state.localTeam}
        visitorName={state.gameInfo.visitor}
        localName={state.gameInfo.home}
        plan={subscriptionTier}
        isUserLoggedIn={isUserLoggedIn}
      />

      <div className={`gap-8 transition-all duration-500 ease-in-out ${showSidebar ? 'flex flex-col xl:grid xl:grid-cols-4' : 'grid grid-cols-1'}`}>
        <div className={`${showSidebar ? 'xl:col-span-3' : 'w-full'} flex flex-col order-2 xl:order-none`}>
          <LineupGrid
            title="Alineación Visitante"
            teamNameValue={state.gameInfo.visitor}
            onTeamNameChange={(val) => updateGameInfo('visitor', val)}
            teamData={state.visitorTeam}
            onUpdate={(idx, type, field, val, iIdx, abIdx, errorCulprit) => updateTeam('visitorTeam', idx, type, field, val, iIdx, abIdx, errorCulprit)}
            onAddColumn={(iIdx) => handleAddColumn(iIdx, 'visitor')}
            theme="purple"
            currentInningIdx={currentInningIdx}
            nextBatterIdx={visitorNextBatterIdx}
            opposingTeam={state.localTeam}
            onAdvanceInning={() => setShowAdvanceModal(true)}
          />
          <LineupGrid
            title="Alineación Local"
            teamNameValue={state.gameInfo.home}
            onTeamNameChange={(val) => updateGameInfo('home', val)}
            teamData={state.localTeam}
            onUpdate={(idx, type, field, val, iIdx, abIdx, errorCulprit) => updateTeam('localTeam', idx, type, field, val, iIdx, abIdx, errorCulprit)}
            onAddColumn={(iIdx) => handleAddColumn(iIdx, 'local')}
            theme="amber"
            currentInningIdx={currentInningIdx}
            nextBatterIdx={localNextBatterIdx}
            opposingTeam={state.visitorTeam}
            onAdvanceInning={() => setShowAdvanceModal(true)}
          />

          <div className="order-first lg:order-last mb-8 lg:mb-0 lg:mt-0 mt-8 bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-2xl print-panel">
            <div className="flex bg-white/10 text-xs font-bold text-center border-b border-white/10">
              <div className="w-32 md:w-48 p-3 text-left pl-6 text-white/60">EQUIPO</div>
              {state.inningScores.visitor.map((_, i) => (
                <div key={i} className="flex-1 p-3 text-white/80 border-l border-white/5">{i + 1 > 5 ? `E${i - 4}` : i + 1}</div>
              ))}
              <div className="w-12 p-3 bg-white/5 border-l border-white/5 text-purple-300">C</div>
              <div className="w-12 p-3 bg-white/5 border-l border-white/5 text-green-300">H</div>
              <div className="w-12 p-3 bg-white/5 border-l border-white/5 text-red-300">E</div>
            </div>

            <div className="flex border-b border-white/10 items-center hover:bg-white/5 transition-colors">
              <div className="w-32 md:w-48 p-2 pl-6 text-sm font-bold text-purple-300 truncate uppercase tracking-wide">
                {state.gameInfo.visitor || 'VISITANTE'}
              </div>
              {state.inningScores.visitor.map((score, i) => (
                <div key={i} className="flex-1 p-1 border-l border-white/5">
                  <input
                    type="text"
                    className="w-full bg-transparent text-center text-white font-mono font-bold focus:outline-none focus:text-purple-300"
                    placeholder="-"
                    value={score}
                    onChange={e => updateInningScore('visitor', i, e.target.value)}
                  />
                </div>
              ))}
              <div className="w-12 p-2 font-black text-center bg-white/5 border-l border-white/5 text-white">{visitorRunsTotal}</div>
              <div className="w-12 p-2 font-bold text-center bg-white/5 border-l border-white/5 text-white/70">{visitorHits}</div>
              <div className="w-12 p-2 font-bold text-center bg-white/5 border-l border-white/5 text-white/70">{state.errors.visitor || '0'}</div>
            </div>

            <div className="flex items-center hover:bg-white/5 transition-colors">
              <div className="w-32 md:w-48 p-2 pl-6 text-sm font-bold text-orange-300 truncate uppercase tracking-wide">
                {state.gameInfo.home || 'LOCAL'}
              </div>
              {state.inningScores.local.map((score, i) => (
                <div key={i} className="flex-1 p-1 border-l border-white/5">
                  <input
                    type="text"
                    className="w-full bg-transparent text-center text-white font-mono font-bold focus:outline-none focus:text-orange-300"
                    placeholder="-"
                    value={score}
                    onChange={e => updateInningScore('local', i, e.target.value)}
                  />
                </div>
              ))}
              <div className="w-12 p-2 font-black text-center bg-white/5 border-l border-white/5 text-white">{localRunsTotal}</div>
              <div className="w-12 p-2 font-bold text-center bg-white/5 border-l border-white/5 text-white/70">{localHits}</div>
              <div className="w-12 p-2 font-bold text-center bg-white/5 border-l border-white/5 text-white/70">{state.errors.local || '0'}</div>
            </div>
          </div>
        </div>

        <div className={`contents xl:flex xl:flex-col gap-6 xl:col-span-1 transition-all duration-300 xl:order-none ${showSidebar ? 'opacity-100 translate-x-0' : 'hidden opacity-0 translate-x-10 no-print'}`}>
          <div className="bg-white/5 rounded-xl border border-white/10 shadow-lg overflow-hidden flex flex-col max-h-[400px] print-panel order-3 xl:order-none">
            <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
              <GlassTitle className="text-sm mb-0 pb-0 border-0 flex items-center gap-2">
                <History size={14} className="text-purple-300" /> Historial de Jugadas
              </GlassTitle>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-white/40 uppercase font-bold">En Vivo</span>
              </div>
            </div>

            <div className="overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1">
              {state.history.length === 0 ? (
                <div className="text-center py-8 text-white/20 italic text-xs">
                  Aún no hay jugadas registradas...
                </div>
              ) : (
                state.history.map((event) => (
                  <div key={event.id} className="flex gap-3 items-start animate-in slide-in-from-left duration-300">
                    <div className="text-[10px] font-mono text-white/30 pt-1 min-w-[35px]">{event.timestamp}</div>
                    <div className="flex-1">
                      <div className="bg-white/5 border border-white/5 rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${event.teamName === (state.gameInfo.visitor || 'Visitante') ? 'text-purple-300' : 'text-orange-300'}`}>
                            {event.teamName}
                          </span>
                          <span className="text-[9px] bg-white/10 px-1 rounded text-white/50">INN {event.inning}</span>
                        </div>
                        <div className="text-xs text-white">
                          <span className="font-bold mr-1">#{event.playerNum} {event.playerName}:</span>
                          <span className={event.actionCode.includes('X') ? 'text-red-300' : event.actionCode.includes('H') ? 'text-green-300' : event.actionCode.includes('●') ? 'text-rose-400 font-bold' : 'text-white/80'}>
                            {event.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-lg print-panel order-1 xl:order-none">
            <GlassTitle className="text-sm">Datos del Partido</GlassTitle>
            <div className="space-y-3">
              <GlassInput label="Competencia" value={state.gameInfo.competition} onChange={e => updateGameInfo('competition', e.target.value)} />
              <GlassInput label="Lugar" value={state.gameInfo.place} onChange={e => updateGameInfo('place', e.target.value)} />
              <GlassInput type="time" label="Hora de Inicio" value={state.gameInfo.times.start} onChange={e => updateGameInfo('times.start', e.target.value)} />

              <div className="flex gap-2 items-end">
                <GlassInput label="Visitador" containerClassName="border-l-2 border-purple-500 pl-2 flex-1" value={state.gameInfo.visitor} onChange={e => updateGameInfo('visitor', e.target.value)} />
                <label className="cursor-pointer p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 mb-1 transition-colors group">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => updateGameInfo('visitorLogo', reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                  <Upload size={16} className={`text-white/40 group-hover:text-purple-300 ${state.gameInfo.visitorLogo ? 'text-purple-500' : ''}`} />
                </label>
              </div>

              <div className="flex gap-2 items-end">
                <GlassInput label="Home Club" containerClassName="border-l-2 border-amber-500 pl-2 flex-1" value={state.gameInfo.home} onChange={e => updateGameInfo('home', e.target.value)} />
                <label className="cursor-pointer p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 mb-1 transition-colors group">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => updateGameInfo('homeLogo', reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                  <Upload size={16} className={`text-white/40 group-hover:text-amber-300 ${state.gameInfo.homeLogo ? 'text-amber-500' : ''}`} />
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-lg print-panel order-4 xl:order-none">
            <GlassTitle className="text-sm">Oficiales</GlassTitle>
            <div className="space-y-3">
              <GlassInput label="Oficial del Plato" value={state.gameInfo.officials.plate} onChange={e => updateGameInfo('officials.plate', e.target.value)} />
              <GlassInput label="1er Oficial del Campo" value={state.gameInfo.officials.field1} onChange={e => updateGameInfo('officials.field1', e.target.value)} />
              <GlassInput label="2do Oficial del Campo" value={state.gameInfo.officials.field2} onChange={e => updateGameInfo('officials.field2', e.target.value)} />
              <GlassInput label="3er Oficial del Campo" value={state.gameInfo.officials.field3} onChange={e => updateGameInfo('officials.field3', e.target.value)} />
              <GlassInput label="Oficial de Mesa" value={state.gameInfo.officials.table} onChange={e => updateGameInfo('officials.table', e.target.value)} />
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs shadow-lg print-panel order-5 xl:order-none">
            <h4 className="font-bold text-white mb-3 border-b border-white/10 pb-1 uppercase tracking-wider flex items-center gap-2">
              <Hash size={12} /> Nomenclatura
            </h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
              <div className="flex items-center gap-2">
                <X size={14} className="text-red-400 stroke-[3]" /> <span className="text-white/80">Out</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-green-400 text-sm">H</span> <span className="text-white/80">Hit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-yellow-400 text-sm">E</span> <span className="text-white/80">Error</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 border-t border-white/5 pt-2 mt-1">
                <ArrowRightLeft size={14} className="text-purple-300" /> <span className="text-white/80">Sustitución</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Square size={14} className="text-amber-500 fill-amber-500" /> <span className="text-white/80">Fin de la entrada</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Circle size={14} className="text-red-500 fill-red-500" /> <span className="text-white/80">Carrera Anotada</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 border-t border-white/5 pt-2 mt-1">
                <span className="font-bold text-blue-300 text-[10px] uppercase">Ex(1-3)B</span> <span className="text-white/80 text-xs">Corredor en Base (Extrainning)</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg print-panel order-6 xl:order-none">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-black/20 p-2 rounded border border-white/5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-white/50 mb-1 uppercase tracking-wider"><Clock size={10} /> INICIO</div>
                <input
                  type="time"
                  className="bg-transparent text-white text-sm w-full focus:outline-none"
                  value={state.gameInfo.times.start}
                  onChange={e => updateGameInfo('times.start', e.target.value)}
                />
              </div>
              <div className="bg-black/20 p-2 rounded border border-white/5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-white/50 mb-1 uppercase tracking-wider"><Clock size={10} /> FIN</div>
                <input
                  type="time"
                  className="bg-transparent text-white text-sm w-full focus:outline-none"
                  value={state.gameInfo.times.end}
                  onChange={e => updateGameInfo('times.end', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest border-b border-white/10 pb-1">Tiempos Fuera</div>
              <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span className="text-xs font-semibold">VISITANTE</span>
                <div className="flex gap-2">
                  <input
                    type="checkbox"
                    className="accent-purple-500 w-4 h-4 cursor-pointer"
                    checked={state.timeouts.visitor[0]}
                    onChange={e => setState(p => ({ ...p, timeouts: { ...p.timeouts, visitor: [e.target.checked, p.timeouts.visitor[1]] } }))}
                  />
                  <input
                    type="checkbox"
                    className="accent-purple-500 w-4 h-4 cursor-pointer"
                    checked={state.timeouts.visitor[1]}
                    onChange={e => setState(p => ({ ...p, timeouts: { ...p.timeouts, visitor: [p.timeouts.visitor[0], e.target.checked] } }))}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span className="text-xs font-semibold">LOCAL</span>
                <div className="flex gap-2">
                  <input
                    type="checkbox"
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                    checked={state.timeouts.local[0]}
                    onChange={e => setState(p => ({ ...p, timeouts: { ...p.timeouts, local: [e.target.checked, p.timeouts.local[1]] } }))}
                  />
                  <input
                    type="checkbox"
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                    checked={state.timeouts.local[1]}
                    onChange={e => setState(p => ({ ...p, timeouts: { ...p.timeouts, local: [p.timeouts.local[0], e.target.checked] } }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScoreSheetFullScreen
        isOpen={fullScreenMode}
        onClose={() => setFullScreenMode(false)}
        title={`${state.gameInfo.visitor} vs ${state.gameInfo.home}`}
        setNum={state.gameInfo.setNum || '1'}
        visitorData={state.visitorTeam}
        localData={state.localTeam}
        gameInfo={state.gameInfo}
        updateGameInfo={updateGameInfo}
        updateTeam={updateTeam}
        handleAddColumn={handleAddColumn}
        currentInningIdx={currentInningIdx}
        visitorNextBatterIdx={visitorNextBatterIdx}
        localNextBatterIdx={localNextBatterIdx}
        onAdvanceInning={() => setShowAdvanceModal(true)}
        liveStatusProps={{
          visitorRuns: visitorRunsTotal,
          localRuns: localRunsTotal,
          inning: currentInning,
          visitorOuts: visitorOuts,
          localOuts: localOuts,
          visitorName: state.gameInfo.visitor,
          localName: state.gameInfo.home,
          visitorLogo: state.gameInfo.visitorLogo,
          localLogo: state.gameInfo.homeLogo,
          onSwap: swapTeams,
          onAdjustVisitor: (delta) => handleScoreAdjustment('visitor', delta),
          onAdjustLocal: (delta) => handleScoreAdjustment('local', delta),
          visitorHits: visitorHits,
          localHits: localHits,
          visitorErrors: parseInt(state.errors.visitor) || 0,
          localErrors: parseInt(state.errors.local) || 0,
          inningScores: state.inningScores
        }}
      />
    </div>
  </>);
};



// --- General Stats Logic ---
const GeneralStatsModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<{ visitor: any, local: any } | null>(null);
  const [matchSummary, setMatchSummary] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const sets = [1, 2, 3].map(i => {
      try { return JSON.parse(localStorage.getItem(`b5_scorekeeper_set_${i}`) || 'null'); }
      catch { return null; }
    }).filter(Boolean);

    if (sets.length === 0) return;

    // Use names from the LATEST set to reflect current team positions (swapped or not)
    const latestSet = sets[sets.length - 1];
    const vName = latestSet.gameInfo.visitor;
    const lName = latestSet.gameInfo.home;

    const aggregate = (targetTeamName: string) => {
      const playerMap = new Map<string, any>();

      sets.forEach(set => {
        // Find which side the target team is on in this set
        let side: 'visitorTeam' | 'localTeam' | null = null;
        if (set.gameInfo.visitor === targetTeamName) side = 'visitorTeam';
        else if (set.gameInfo.home === targetTeamName) side = 'localTeam';

        if (!side) return; // Team name mismatch in this set? Skip.

        set[side].slots.forEach((slot: any) => {
          [slot.starter, slot.sub].forEach((p: PlayerStats) => {
            if (!p.scores || !Array.isArray(p.scores)) return;
            const key = `${p.number}-${p.name}`;
            if (!playerMap.has(key)) playerMap.set(key, { name: p.name || 'J' + p.number, no: p.number, vb: 0, h: 0, ca: 0, e: 0 });

            const data = playerMap.get(key);
            p.scores.flat().forEach(val => {
              const v = val.toUpperCase();
              if (v.includes('H')) data.h++;
              if (v.includes('●')) data.ca++;
              if (v.includes('E')) data.e++;
              // Exclude 'EX' from VB
              if ((v.includes('H') || v.includes('X') || v.includes('E') || v.includes('S')) && !v.includes('EX')) data.vb++;
            });
          });
        });
      });

      return Array.from(playerMap.values()).map(p => ({
        ...p,
        ave: p.vb > 0 ? (p.h / p.vb).toFixed(3) : '.000'
      }));
    };

    setStats({
      visitor: { name: vName, players: aggregate(vName) },
      local: { name: lName, players: aggregate(lName) }
    });

    // --- Match Summary Aggregation ---
    // We want to show a summary row FOR EACH SET played
    const summaryData = sets.map((set, idx) => {
      const vRuns = set.inningScores.visitor.reduce((sum: number, val: string) => sum + (parseInt(val) || 0), 0) + (set.scoreAdjustments?.visitor || 0);
      const lRuns = set.inningScores.local.reduce((sum: number, val: string) => sum + (parseInt(val) || 0), 0) + (set.scoreAdjustments?.local || 0);

      // Calculate Hits & Errors for the set
      let vHits = 0; let lHits = 0;
      let vErrors = 0; let lErrors = 0;
      set.visitorTeam.slots.forEach((slot: any) => {
        [slot.starter, slot.sub].forEach((p: any) => {
          p.scores.flat().forEach((val: string) => {
            if (val.toUpperCase().includes('H')) vHits++;
            if (val.toUpperCase().includes('E')) vErrors++; // Assuming S is Error on Base? Or just check set.errors if reliable?
            // Actually set.errors might be string "0" in state, let's trust set.errors if available, but for players stats we counted manually.
            // Let's use the explicit counters from the set state if available for consistency with top bar
          });
        });
      });
      set.localTeam.slots.forEach((slot: any) => {
        [slot.starter, slot.sub].forEach((p: any) => {
          p.scores.flat().forEach((val: string) => {
            if (val.toUpperCase().includes('H')) lHits++;
            if (val.toUpperCase().includes('E')) lErrors++;
          });
        });
      });

      // Use stored errors if simple count is preferred or if logic matches LiveGameStatus
      // In LiveGameStatus we use state.errors.visitor directly.
      // Let's rely on set.errors from the saved state
      const vE = parseInt(set.errors?.visitor || '0');
      const lE = parseInt(set.errors?.local || '0');

      // Hits need to be counted from players as they aren't stored in simple state
      // Recalculating Hits properly:
      const countHits = (teamData: any) => {
        let h = 0;
        teamData.slots.forEach((slot: any) => {
          [slot.starter, slot.sub].forEach((p: any) => {
            p.scores.flat().forEach((val: string) => { if (val?.toUpperCase().includes('H')) h++; });
          });
        });
        return h;
      };
      const vH = countHits(set.visitorTeam);
      const lH = countHits(set.localTeam);

      return {
        set: idx + 1,
        visitorName: set.gameInfo.visitor,
        localName: set.gameInfo.home,
        visitor: { runs: vRuns, hits: vH, errors: vE, inningScores: set.inningScores.visitor },
        local: { runs: lRuns, hits: lH, errors: lE, inningScores: set.inningScores.local }
      };
    });

    setMatchSummary(summaryData);

  }, [isOpen]);

  // --- Print Handling: Render directly if isOpen=true OR if we are printing and configured to show stats? 
  // Wait, GeneralStatsModal is a MODAL. We can't reuse it easily for print if we want it embedded in the page flow.
  // Instead, let's extract the Table Rendering to a component we can use in both places.
  // Done in MatchStatsView below. This component now just wraps it.

  if (!isOpen || !stats) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#1e1e24] w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl relative">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart className="text-purple-400" /> Estadísticas Generales (Acumulado)
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <MatchStatsView stats={stats} matchSummary={matchSummary} />
        </div>
      </div>
    </div>
  );
};

// --- Extracted Stats View for Reusability (Modal & Print) ---
const MatchStatsView: React.FC<{ stats: { visitor: any, local: any }, matchSummary: any[] }> = ({ stats, matchSummary }) => {

  const RenderTable = ({ teamName, players, color }: any) => {
    const totalStats = players.reduce((acc: any, p: any) => ({
      vb: acc.vb + p.vb,
      h: acc.h + p.h,
      ca: acc.ca + p.ca,
      e: acc.e + p.e,
      h_total: (acc.h_total || 0) + p.h,
      vb_total: (acc.vb_total || 0) + p.vb
    }), { vb: 0, h: 0, ca: 0, e: 0, h_total: 0, vb_total: 0 });

    totalStats.ave = totalStats.vb_total > 0 ? (totalStats.h_total / totalStats.vb_total).toFixed(3) : '.000';

    return (
      <div className="mb-8 break-inside-avoid">
        <h3 className={`text-lg font-bold mb-2 uppercase tracking-wide ${color} text-black print:text-black`}>{teamName}</h3>
        <div className="overflow-x-auto rounded-lg border border-white/10 print:border-black/20">
          <table className="w-full text-left text-xs text-white/70 print:text-black">
            <thead className="bg-white/5 uppercase font-bold text-white/50 print:text-black print:bg-gray-100">
              <tr>
                <th className="p-2 text-center text-black print:text-black">VB</th>
                <th className="p-2 text-center text-black print:text-black">H</th>
                <th className="p-2 text-center text-black print:text-black">CA</th>
                <th className="p-2 text-center text-black print:text-black">E</th>
                <th className="p-2 text-center text-black print:text-black">AVE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-black/20">
              <tr className="hover:bg-white/5 print:hover:bg-transparent">
                <td className="p-2 text-center font-bold text-white print:text-black">{totalStats.vb}</td>
                <td className="p-2 text-center font-bold text-white print:text-black">{totalStats.h}</td>
                <td className="p-2 text-center font-bold text-white print:text-black">{totalStats.ca}</td>
                <td className="p-2 text-center font-bold text-white print:text-black">{totalStats.e}</td>
                <td className="p-2 text-center font-bold text-yellow-400 print:text-black font-mono">{totalStats.ave}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  };

  return (
    <div>
      {/* Match Summary Table */}
      <div className="mb-8 p-4 bg-black/20 rounded-xl border border-white/5 print:bg-transparent print:border-none print:p-0 break-inside-avoid">
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-4 flex items-center gap-2 print:text-black">
          <Trophy size={14} className="text-yellow-500 print:text-black" /> Resumen del Partido
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] md:text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider bg-white/5 print:text-black print:bg-gray-100 print:border-black">
                <th className="p-3 text-left w-[50px] text-black print:text-black">Set</th>
                <th className="p-3 text-left w-[120px] text-black print:text-black">Equipo</th>

                {(() => {
                  const maxInnings = Math.max(5, ...matchSummary.map(m => Math.max(m.visitor.inningScores.length, m.local.inningScores.length)));
                  const headers = Array.from({ length: maxInnings }, (_, i) => i + 1);
                  return headers.map(i => (
                    <th key={i} className="p-2 text-center w-[40px] border-l border-white/5 print:border-black text-black print:text-black">{i}</th>
                  ));
                })()}

                <th className="p-3 text-center text-white/70 font-bold bg-white/5 border-l border-white/5 w-[50px] text-black print:text-black">C</th>
                <th className="p-3 text-center text-green-400/70 font-bold bg-white/5 border-l border-white/5 w-[50px] text-black print:text-black">H</th>
                <th className="p-3 text-center text-yellow-400/70 font-bold bg-white/5 border-l border-white/5 w-[50px] text-black print:text-black">E</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-black">
              {matchSummary.map((item) => {
                const globalMax = Math.max(5, ...matchSummary.map(m => Math.max(m.visitor.inningScores.length, m.local.inningScores.length)));
                const fillCount = globalMax;

                return (
                  <React.Fragment key={item.set}>
                    {/* Visitor Row */}
                    <tr className="bg-white/[0.02] hover:bg-white/5 transition-colors print:bg-transparent">
                      <td rowSpan={2} className="p-3 font-bold text-white border-r border-white/5 text-center bg-white/5 print:text-black print:border-black">{item.set}</td>
                      <td className="p-3 font-bold text-purple-300 border-r border-white/5 print:text-black print:border-black">{item.visitorName}</td>

                      {Array.from({ length: fillCount }).map((_, i) => (
                        <td key={i} className="p-2 text-center border-r border-white/5 text-white/80 font-mono print:text-black print:border-black">
                          {item.visitor.inningScores[i] || (i < 5 ? '0' : '-')}
                        </td>
                      ))}

                      <td className="p-3 text-center font-black text-white text-sm bg-white/5 border-l border-white/5 print:text-black print:border-black">{item.visitor.runs}</td>
                      <td className="p-3 text-center font-bold text-white/60 bg-white/5 border-l border-white/5 print:text-black print:border-black">{item.visitor.hits}</td>
                      <td className="p-3 text-center font-bold text-white/60 bg-white/5 border-l border-white/5 print:text-black print:border-black">{item.visitor.errors}</td>
                    </tr>
                    {/* Local Row */}
                    <tr className="bg-white/[0.02] hover:bg-white/5 transition-colors print:bg-transparent">
                      <td className="p-3 font-bold text-orange-300 border-r border-white/5 print:text-black print:border-black">{item.localName}</td>

                      {Array.from({ length: fillCount }).map((_, i) => (
                        <td key={i} className="p-2 text-center border-r border-white/5 text-white/80 font-mono print:text-black print:border-black">
                          {item.local.inningScores[i] || (i < 5 ? '0' : '-')}
                        </td>
                      ))}

                      <td className="p-3 text-center font-black text-white text-sm bg-white/5 border-l border-white/5 print:text-black print:border-black">{item.local.runs}</td>
                      <td className="p-3 text-center font-bold text-white/60 bg-white/5 border-l border-white/5 print:text-black print:border-black">{item.local.hits}</td>
                      <td className="p-3 text-center font-bold text-white/60 bg-white/5 border-l border-white/5 print:text-black print:border-black">{item.local.errors}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <RenderTable teamName={stats.visitor.name} players={stats.visitor.players} color="text-purple-400" />
      <RenderTable teamName={stats.local.name} players={stats.local.players} color="text-orange-400" />
    </div>
  );
}

// --- Printable Stats Utility Wrapper ---
// This component aggregates the data JUST like GeneralStatsModal but is mounted in the main DOM for printing
const PrintableMatchStats: React.FC = () => {
  const [stats, setStats] = useState<{ visitor: any, local: any } | null>(null);
  const [matchSummary, setMatchSummary] = useState<any[]>([]);

  useEffect(() => {
    // Identical logic to GeneralStatsModal but runs once on mount/update
    const sets = [1, 2, 3].map(i => {
      try { return JSON.parse(localStorage.getItem(`b5_scorekeeper_set_${i}`) || 'null'); }
      catch { return null; }
    }).filter(Boolean);

    if (sets.length === 0) return;

    // Use names from the LATEST set to reflect current team positions
    const latestSet = sets[sets.length - 1];
    const vName = latestSet.gameInfo.visitor;
    const lName = latestSet.gameInfo.home;

    const aggregate = (targetTeamName: string) => {
      const playerMap = new Map<string, any>();
      sets.forEach(set => {
        let side: 'visitorTeam' | 'localTeam' | null = null;
        if (set.gameInfo.visitor === targetTeamName) side = 'visitorTeam';
        else if (set.gameInfo.home === targetTeamName) side = 'localTeam';

        if (!side) return;

        set[side].slots.forEach((slot: any) => {
          [slot.starter, slot.sub].forEach((p: PlayerStats) => {
            if (!p.scores || !Array.isArray(p.scores)) return;
            const key = `${p.number}-${p.name}`;
            if (!playerMap.has(key)) playerMap.set(key, { name: p.name || 'J' + p.number, no: p.number, vb: 0, h: 0, ca: 0, e: 0 });
            const data = playerMap.get(key);
            p.scores.flat().forEach(val => {
              const v = val.toUpperCase();
              if (v.includes('H')) data.h++;
              if (v.includes('●')) data.ca++;
              if (v.includes('E')) data.e++;
              if (v.includes('H') || v.includes('X') || v.includes('E') || v.includes('S')) data.vb++;
            });
          });
        });
      });
      return Array.from(playerMap.values()).map(p => ({ ...p, ave: p.vb > 0 ? (p.h / p.vb).toFixed(3) : '.000' }));
    };

    setStats({ visitor: { name: vName, players: aggregate(vName) }, local: { name: lName, players: aggregate(lName) } });

    const summaryData = sets.map((set, idx) => {
      const vRuns = set.inningScores.visitor.reduce((sum: number, val: string) => sum + (parseInt(val) || 0), 0) + (set.scoreAdjustments?.visitor || 0);
      const lRuns = set.inningScores.local.reduce((sum: number, val: string) => sum + (parseInt(val) || 0), 0) + (set.scoreAdjustments?.local || 0);
      let vHits = 0; let lHits = 0; let vErrors = 0; let lErrors = 0;

      const countHits = (teamData: any) => {
        let h = 0;
        teamData.slots.forEach((slot: any) => {
          [slot.starter, slot.sub].forEach((p: any) => {
            p.scores.flat().forEach((val: string) => { if (val?.toUpperCase().includes('H')) h++; });
          });
        });
        return h;
      };

      set.visitorTeam.slots.forEach((slot: any) => { [slot.starter, slot.sub].forEach((p: any) => { p.scores.flat().forEach((val: string) => { if (val.toUpperCase().includes('E')) vErrors++; }); }); });
      set.localTeam.slots.forEach((slot: any) => { [slot.starter, slot.sub].forEach((p: any) => { p.scores.flat().forEach((val: string) => { if (val.toUpperCase().includes('E')) lErrors++; }); }); });

      const vH = countHits(set.visitorTeam);
      const lH = countHits(set.localTeam);
      const vE = parseInt(set.errors?.visitor || '0');
      const lE = parseInt(set.errors?.local || '0');

      return {
        set: idx + 1,
        visitorName: set.gameInfo.visitor,
        localName: set.gameInfo.home,
        visitor: { runs: vRuns, hits: vH, errors: vE, inningScores: set.inningScores.visitor },
        local: { runs: lRuns, hits: lH, errors: lE, inningScores: set.inningScores.local }
      };
    });
    setMatchSummary(summaryData);
  }, []);

  if (!stats) return null;
  return <MatchStatsView stats={stats} matchSummary={matchSummary} />;
};


interface PrintConfig {
  showInfo: boolean;
  showStats: boolean;
}

const PrintConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: PrintConfig) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [showInfo, setShowInfo] = useState(true);
  const [showStats, setShowStats] = useState(false);

  if (!isOpen) return null;

  return (
    <ModalBackdrop zIndex="z-[300]">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full no-print">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Printer className="text-purple-400" /> Descargar PDF
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-white/60 mb-2">Selecciona qué deseas incluir:</p>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={showInfo}
              onChange={(e) => setShowInfo(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-white font-medium">Datos del Torneo y Anotación</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={showStats}
              onChange={(e) => setShowStats(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-white font-medium">Estadísticas</span>
          </label>

          <button
            onClick={() => { setShowInfo(true); setShowStats(true); }}
            className="text-xs text-purple-300 hover:text-purple-200 underline pl-1"
          >
            Marcar Todo
          </button>
        </div>

        <button
          onClick={() => onConfirm({ showInfo, showStats })}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <FileDown size={20} />
          Generar y Descargar
        </button>
      </div>
    </ModalBackdrop>
  );
};

export const MatchWinnerModal: React.FC<{
  matchWinner: { name: string; score: string; setsWon: number } | null;
  onClose: () => void;
}> = ({ matchWinner, onClose }) => {
  if (!matchWinner) return null;

  return (
    <ModalBackdrop>
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-amber-500/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.3)] max-w-md w-full text-center relative overflow-hidden no-print">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent animate-pulse"></div>

        <div className="relative z-10 flex flex-col items-center">
          <Trophy size={64} className="text-amber-400 mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-bounce-slow" />

          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mb-2 filter drop-shadow-lg">
            {matchWinner.name}
          </h1>
          <p className="text-white/60 text-lg font-mono mb-8">GANADOR DEL PARTIDO</p>

          <div className="bg-white/10 rounded-xl px-6 py-3 border border-white/10 mb-8">
            <span className="text-2xl font-bold text-white">Sets: {matchWinner.score}</span>
          </div>

          <button
            onClick={onClose}
            className="px-8 py-3 bg-white text-purple-900 font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg cursor-pointer active:scale-95 transform"
          >
            Cerrar
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

export const ScoreCard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [setWinners, setSetWinners] = useState<({ name: string; score: string; isVisitor: boolean } | null)[]>([null, null, null]);
  const [matchWinner, setMatchWinner] = useState<{ name: string; score: string; setsWon: number } | null>(null);
  const [printConfigModalOpen, setPrintConfigModalOpen] = useState(false);
  const [printConfig, setPrintConfig] = useState<PrintConfig | null>(null);
  const [generalStatsOpen, setGeneralStatsOpen] = useState(false);

  // New View Mode State for Mobile/Tablet Optimization


  const handlePrintRequest = () => {
    setPrintConfigModalOpen(true);
  };

  const executePrint = (config: PrintConfig) => {
    setPrintConfigModalOpen(false);
    setPrintConfig(config);
    // Give React time to render the print view
    setTimeout(() => {
      window.print();
    }, 100);
  };

  useEffect(() => {
    const cleanup = () => setPrintConfig(null);
    window.addEventListener('afterprint', cleanup);
    return () => window.removeEventListener('afterprint', cleanup);
  }, []);

  const handleSetChange = (set: number) => {
    // setLoading(true); // Removed to prevent header flash/reload perception
    setCurrentSet(set);
    // setTimeout(() => setLoading(false), 50);
  };

  const handleWinnerUpdate = (winner: { name: string; score: string; isVisitor: boolean } | null) => {
    setSetWinners(prev => {
      const newWinners = [...prev];
      newWinners[currentSet - 1] = winner;
      return newWinners;
    });

    // Check Match Winner Logic (Best of 3)
    let vWins = 0;
    let lWins = 0;
    let vName = 'Visitante';
    let lName = 'Local';

    for (let i = 1; i <= 3; i++) {
      // We rely on localStorage as the source of truth for completed sets to determine match winner across components/reloads
      const saved = localStorage.getItem(`b5_scorekeeper_set_${i}`);
      if (saved) {
        try {
          const p = JSON.parse(saved);
          if (p.winner) {
            if (p.winner.isVisitor) vWins++; else lWins++;
            if (i === 1) { vName = p.gameInfo.visitor; lName = p.gameInfo.home; }
          }
        } catch (e) { console.error("Error reading saved set", e); }
      }
    }

    if (vWins >= 2) setMatchWinner({ name: vName, score: `${vWins}-${lWins}`, setsWon: vWins });
    else if (lWins >= 2) setMatchWinner({ name: lName, score: `${lWins}-${vWins}`, setsWon: lWins });
  };

  return (
    <div className={`min-h-screen bg-transparent pb-20 ${printConfig ? 'printing-mode' : ''}`}>
      <style>{`
        @media print {
          @page { size: landscape; margin: 5mm; }
          body { 
            background: white !important; 
            color: black !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .no-print { display: none !important; }
          .printing-mode { background: white !important; overflow: visible !important; height: auto !important; }
          * { color: black !important; text-shadow: none !important; box-shadow: none !important; }
          .border-white\\/10, .border-white\\/20, .border-white\\/5 { border-color: #000 !important; }
          .bg-white\\/5, .bg-white\\/10 { background: transparent !important; }
          .text-white, .text-white\\/70, .text-white\\/40, .text-white\\/50 { color: black !important; }
          .text-purple-200, .text-orange-200 { color: black !important; font-weight: bold !important; }
          .bg-slate-900, .bg-[#1e1b4b], .bg-[#2a1205] { background: transparent !important; }
          .print-section-info { display: ${printConfig?.showInfo ? 'block' : 'none'} !important; }
          .print-section-stats { display: ${printConfig?.showStats ? 'block' : 'none'} !important; width: 100% !important; margin-top: 20px !important; }
          .print-logo-header { display: flex !important; width: 100%; justify-content: space-between; align-items: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
          table, th, td { color: black !important; border-color: black !important; }
          .print-section-stats button { display: none !important; }
        }
      `}</style>

      <PrintConfigModal
        isOpen={printConfigModalOpen}
        onClose={() => setPrintConfigModalOpen(false)}
        onConfirm={executePrint}
      />

      {loading ? (
        <div className="h-[50vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          <div className="print-section-info">
            <SingleSetScoreCard
              key={currentSet}
              setNum={currentSet}
              onWinnerUpdate={handleWinnerUpdate}
              currentSet={currentSet}
              setWinners={setWinners}
              onSetChange={handleSetChange}
            />
          </div>

          <div className="print-section-stats hidden print:block">
            <h2 className="text-2xl font-bold uppercase mb-4 text-black border-b-2 border-black pb-2 mt-8">Estadísticas Generales</h2>
            <PrintableMatchStats />
          </div>
        </>
      )}



      <MatchWinnerModal matchWinner={matchWinner} onClose={() => setMatchWinner(null)} />
      <GeneralStatsModal isOpen={generalStatsOpen} onClose={() => setGeneralStatsOpen(false)} />


    </div >
  );
};

export default ScoreCard;