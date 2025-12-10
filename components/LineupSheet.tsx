import React from 'react';
import { GlassInput, GlassTitle, LogoPlaceholder } from './GlassInput';

const PlayerRow: React.FC<{ number: number; type: 'starter' | 'sub' }> = ({ number, type }) => (
  <div className="flex gap-2 mb-3 items-center">
    <div className={`
      flex items-center justify-center w-8 h-10 rounded font-bold shrink-0 shadow-lg
      ${type === 'starter' ? 'bg-amber-400 text-slate-900' : 'bg-purple-500/50 text-white'}
    `}>
      {number}
    </div>
    <div className="flex-grow">
      <GlassInput placeholder="Nombre del Jugador" className="h-10" />
    </div>
    <div className="w-16 shrink-0">
      <GlassInput placeholder="M/F" className="h-10 text-center uppercase" maxLength={1} />
    </div>
    <div className="w-16 shrink-0">
      <GlassInput placeholder="No." type="number" className="h-10 text-center" />
    </div>
  </div>
);

export const LineupSheet: React.FC = () => {
  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
      {/* Decorative large background number */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40rem] font-bold text-white/5 select-none pointer-events-none z-0">
        B5
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300">
            Alineación Oficial
          </h1>
          <div className="flex gap-4">
            <LogoPlaceholder text="Gandía Beisbol Club" />
            <LogoPlaceholder text="WBSC Baseball 5" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Players */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Starters */}
            <section className="bg-white/5 p-6 rounded-xl border border-white/5">
              <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                <h3 className="text-xl font-bold text-amber-400 uppercase">Abridores</h3>
                <div className="flex gap-8 text-xs font-semibold text-white/50 uppercase pr-4">
                  <span>M/F</span>
                  <span>No</span>
                </div>
              </div>
              {[1, 2, 3, 4, 5].map(num => (
                <PlayerRow key={`starter-${num}`} number={num} type="starter" />
              ))}
            </section>

            {/* Substitutes */}
            <section className="bg-white/5 p-6 rounded-xl border border-white/5">
               <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                <h3 className="text-xl font-bold text-purple-300 uppercase">Sustituciones</h3>
                <div className="flex gap-8 text-xs font-semibold text-white/50 uppercase pr-4">
                  <span>M/F</span>
                  <span>No</span>
                </div>
              </div>
              {[1, 2, 3, 4, 5].map(num => (
                <PlayerRow key={`sub-${num}`} number={num} type="sub" />
              ))}
            </section>
          </div>

          {/* Right Column: Game Info */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/5 h-full">
              <GlassTitle>Detalles del Juego</GlassTitle>
              
              <div className="space-y-4">
                <GlassInput label="Competencia" />
                <GlassInput label="Lugar" />
                <GlassInput label="Fecha" type="date" />
                
                <div className="grid grid-cols-2 gap-4">
                  <GlassInput label="Juego #" type="number" />
                  <GlassInput label="Set #" type="number" />
                </div>
                
                <div className="my-6 border-t border-white/10"></div>
                
                <GlassInput label="Visitador" placeholder="Nombre del equipo visitante" />
                <GlassInput label="Home Club" placeholder="Nombre del equipo local" />
              </div>

              <div className="mt-12 space-y-6">
                 <GlassTitle className="text-sm text-purple-200">Firmas y Aprobación</GlassTitle>
                 <GlassInput label="Equipo" />
                 <GlassInput label="Director" />
                 <div className="pt-4">
                    <label className="text-xs font-semibold text-purple-200/70 uppercase tracking-wider ml-1 mb-2 block">
                      Firma
                    </label>
                    <div className="h-24 bg-white/5 border border-white/10 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                      <span className="text-white/30 text-sm">Espacio para firma digital o manual</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};