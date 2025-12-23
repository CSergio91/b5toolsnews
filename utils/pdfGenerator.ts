import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TournamentMatch, TournamentSet } from '../types/tournament';

export interface PlayerStats {
  name: string;
  gender: string;
  number: string;
  pos: string;
  scores: string[][];
  defError?: number;
}

export interface RosterSlot {
  starter: PlayerStats;
  sub: PlayerStats;
}

export interface TeamData {
  slots: RosterSlot[];
}

export interface ScoreCardState {
  gameInfo: {
    competition: string;
    place: string;
    date: string;
    gameNum: string;
    setNum: string;
    visitor: string;
    home: string;
    visitorLogo?: string;
    homeLogo?: string;
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
  scoreAdjustments?: {
    visitor: number;
    local: number;
  };
}

export interface PDFConfig {
  showInfo: boolean;
  showStats: boolean;
  teamOnly?: 'visitor' | 'local';
}

const getImageDataUrl = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
};

const drawProfessionalHeader = (doc: jsPDF, state: ScoreCardState, logoBase64: string, title: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 50, 'F');
  if (logoBase64) doc.addImage(logoBase64, 'PNG', 15, 10, 30, 30);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('B5Tools', 50, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(title, 50, 33);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(state.gameInfo.competition?.toUpperCase() || 'COMPETICIÓN B5', pageWidth - 15, 20, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${state.gameInfo.date} | Lugar: ${state.gameInfo.place || 'N/A'}`, pageWidth - 15, 26, { align: 'right' });
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(pageWidth - 65, 35, 50, 7, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(`JUEGO #: ${state.gameInfo.gameNum || 'N/A'}  |  SET #: ${state.gameInfo.setNum || '1'}`, pageWidth - 40, 40, { align: 'center' });
};

const applyGlobalBranding = (doc: jsPDF, logoBase64: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let j = 1; j <= pageCount; j++) {
    doc.setPage(j);
    if (logoBase64) {
      try {
        (doc as any).setAlpha(0.04);
        doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 50, pageHeight / 2 - 50, 100, 100);
        (doc as any).setAlpha(1);
      } catch (e) { }
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`B5TOOLS.COM - REPORTE OFICIAL GENERADO`, 15, pageHeight - 10);
    doc.text(`Página ${j} de ${pageCount} | ${new Date().toLocaleString()}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }
};

export const generateProfessionalPDF = async (state: ScoreCardState, config: PDFConfig) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  (doc as any).lastAutoTable = { finalY: config.showInfo ? 20 : 50 }; // Below header if info skipped
  let logoBase64 = '';
  try { logoBase64 = await getImageDataUrl('/logo.png'); } catch (e) { }

  const drawSectionHeader = (title: string, y: number, color: number[]) => {
    doc.setFillColor(color[0], color[1], color[2]);
    // Rounded header for the section
    doc.roundedRect(15, y, doc.internal.pageSize.getWidth() - 30, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y + 5.5);
  };

  const getReportTitle = () => {
    if (config.teamOnly) {
      const teamName = config.teamOnly === 'visitor' ? state.gameInfo.visitor : state.gameInfo.home;
      return `REPORTE DE EQUIPO: ${teamName.toUpperCase()}`;
    }
    return config.showInfo && config.showStats ? 'REPORTE OFICIAL DE ANOTACIÓN Y ESTADÍSTICAS' :
      config.showStats ? 'REPORTE TÉCNICO DE ESTADÍSTICAS' : 'REPORTE OFICIAL DE ANOTACIÓN';
  };

  if (config.showInfo) {
    drawProfessionalHeader(doc, state, logoBase64, getReportTitle());

    // --- Game Officials Section ---
    autoTable(doc, {
      startY: 60,
      head: [['DATOS TÉCNICOS Y OFICIALES DEL PARTIDO']],
      body: [
        [`Árbitro de Home: ${state.gameInfo.officials.plate || '-'} | Árbitro 1B: ${state.gameInfo.officials.field1 || '-'} | Árbitro 2B: ${state.gameInfo.officials.field2 || '-'} | Árbitro 3B: ${state.gameInfo.officials.field3 || '-'}`],
        [`Anotador: ${state.gameInfo.officials.table || '-'} | Hora Inicio: ${state.gameInfo.times.start || '--:--'} | Hora Fin: ${state.gameInfo.times.end || '--:--'}`]
      ],
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1, textColor: [71, 85, 105] },
      headStyles: { fontSize: 9, fontStyle: 'bold', textColor: [30, 41, 59] }
    });

    // --- Box Score ---
    const totalInnings = Math.max(state.inningScores.visitor.length, state.inningScores.local.length, 5);
    const getInningLine = (team: TeamData, manual: string[]) => {
      return Array.from({ length: totalInnings }, (_, i) => {
        let r = 0;
        team.slots.forEach(s => [s.starter, s.sub].forEach((p, pIdx) => {
          const isStarter = pIdx === 0;
          const hasSubMarker = isStarter && (p.scores || []).flat().some(sx => sx && sx.includes('⇄'));
          const hasActivity = p.name || p.number || (p.scores || []).flat().length > 0 || (p.defError || 0) > 0;

          if ((isStarter || hasSubMarker || hasActivity) && p.scores[i]) {
            p.scores[i].forEach(v => { if (v.includes('●')) r++; });
          }
        }));
        const manVal = parseInt(manual[i]);
        return (manVal > r) ? manVal.toString() : r.toString();
      });
    };

    const calculateSums = (team: TeamData, adj = 0) => {
      let runs = 0, hits = 0;
      team.slots.forEach(s => [s.starter, s.sub].forEach((p, pIdx) => {
        const isStarter = pIdx === 0;
        const hasSubMarker = isStarter && p.scores.flat().some(sx => sx && sx.includes('⇄'));
        const hasActivity = p.name || p.number || p.scores.flat().length > 0 || (p.defError || 0) > 0;

        if (!isStarter && !hasSubMarker && !hasActivity) return;

        p.scores.flat().forEach(v => {
          if (v.includes('●')) runs++;
          if (v.toUpperCase().includes('H')) hits++;
        });
      }));
      return { runs: runs + adj, hits };
    };

    const vS = calculateSums(state.visitorTeam, state.scoreAdjustments?.visitor || 0);
    const lS = calculateSums(state.localTeam, state.scoreAdjustments?.local || 0);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['EQUIPOS', ...Array.from({ length: totalInnings }, (_, i) => (i + 1).toString()), 'C', 'H', 'E']],
      body: [
        [state.gameInfo.visitor || 'VISITANTE', ...getInningLine(state.visitorTeam, state.inningScores.visitor), vS.runs, vS.hits, state.errors.visitor || '0'],
        [state.gameInfo.home || 'LOCAL', ...getInningLine(state.localTeam, state.inningScores.local), lS.runs, lS.hits, state.errors.local || '0']
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], halign: 'center', cellPadding: 2.5 },
      styles: { halign: 'center', fontStyle: 'bold', fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { halign: 'left', cellWidth: 40, fillColor: [248, 250, 252] } },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.1,
    });

    const renderRoster = (team: TeamData, name: string, color: number[]) => {
      const startY = (doc as any).lastAutoTable.finalY + 15;
      if (startY > 240) doc.addPage();

      drawSectionHeader(`ALINEACIÓN: ${name.toUpperCase()}`, (doc as any).lastAutoTable.finalY + 12, color);

      const rows: any[] = [];
      team.slots.forEach((s, idx) => {
        const fmt = (sc: string[][]) => Array.from({ length: totalInnings }, (_, i) =>
          (sc[i] || []).filter(x => x).map(x => x.replace('■', '').replace('●', '+R').replace('⇄', ' SUST')).join(' ') || '-'
        );
        rows.push([(idx + 1), s.starter.number, s.starter.name, s.starter.pos, ...fmt(s.starter.scores)]);

        const hasSubMarker = s.starter.scores.flat().some(x => x && x.includes('⇄'));
        const hasSubActivity = s.sub.name || s.sub.number || s.sub.scores.flat().length > 0 || (s.sub.defError || 0) > 0;

        if (hasSubMarker || hasSubActivity) {
          rows.push(['', s.sub.number, `${s.sub.name || 'Sustituto'} (S)`, s.sub.pos, ...fmt(s.sub.scores)]);
        }
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['#', 'Nº', 'JUGADOR', 'P', ...Array.from({ length: totalInnings }, (_, i) => (i + 1).toString())]],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], fontSize: 8, halign: 'center' },
        styles: { fontSize: 8, halign: 'center' },
        columnStyles: { 2: { halign: 'left', cellWidth: 45 } }
      });
    };

    if (!config.teamOnly || config.teamOnly === 'visitor') {
      renderRoster(state.visitorTeam, state.gameInfo.visitor, [124, 58, 237]);
    }
    if (!config.teamOnly || config.teamOnly === 'local') {
      renderRoster(state.localTeam, state.gameInfo.home, [217, 119, 6]);
    }
  }

  if (config.showStats) {
    if (config.showInfo) {
      doc.addPage(); // Separation
      // Reset table tracking for the new page
      (doc as any).lastAutoTable = { finalY: 50 };
    }

    drawProfessionalHeader(doc, state, logoBase64, config.showInfo ? getReportTitle() : 'REPORTE TÉCNICO DE ESTADÍSTICAS ACUMULADAS');

    const renderStatsTable = (team: TeamData, name: string, color: number[]) => {
      const startY = (doc as any).lastAutoTable.finalY + 15;
      if (startY > 240) {
        doc.addPage();
        (doc as any).lastAutoTable = { finalY: 20 };
      }

      const tableY = (doc as any).lastAutoTable.finalY + 15;
      drawSectionHeader(`ESTADÍSTICAS: ${name.toUpperCase()}`, tableY - 12, color);

      const rows: any[] = [];
      team.slots.forEach((slot, idx) => {
        [slot.starter, slot.sub].forEach((p, pIdx) => {
          const isStarter = pIdx === 0;
          const hasSubMarker = isStarter && p.scores.flat().some(sx => sx && sx.includes('⇄'));
          const hasActivity = p.name || p.number || p.scores.flat().length > 0 || (p.defError || 0) > 0;

          if (!isStarter && !hasSubMarker && !hasActivity) return;

          let vb = 0, h = 0, ca = 0, e_emb = 0;
          p.scores.flat().forEach(v => {
            const u = v.toUpperCase();
            if (u.includes('H')) h++;
            if (u.includes('●')) ca++;
            if (u.includes('E')) e_emb++;
            if ((u.includes('H') || u.includes('X') || u.includes('E')) && !u.includes('EX')) vb++;
          });
          rows.push([
            p.number || '-',
            p.name || (isStarter ? `Jugador ${idx + 1}` : 'Sustituto'),
            vb, h, ca,
            p.defError || 0,
            e_emb,
            vb > 0 ? (h / vb).toFixed(3) : '.000'
          ]);
        });
      });

      autoTable(doc, {
        startY: tableY,
        head: [['Nº', 'JUGADOR', 'VB', 'H', 'CA', 'E (DEF)', 'E (EMB)', 'AVE']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], halign: 'center' },
        styles: { fontSize: 9, halign: 'center' },
        columnStyles: { 1: { halign: 'left', cellWidth: 60 } }
      });
    };

    if (!config.teamOnly || config.teamOnly === 'visitor') {
      renderStatsTable(state.visitorTeam, state.gameInfo.visitor, [124, 58, 237]);
    }
    if (!config.teamOnly || config.teamOnly === 'local') {
      renderStatsTable(state.localTeam, state.gameInfo.home, [217, 119, 6]);
    }
  }

  applyGlobalBranding(doc, logoBase64);
  const finalTeamSuffix = config.teamOnly ? `_${config.teamOnly === 'visitor' ? state.gameInfo.visitor : state.gameInfo.home}` : '';
  doc.save(`B5Tools_Reporte${finalTeamSuffix}_${state.gameInfo.date}.pdf`);
};

export const generateStatsPDF = async (state: ScoreCardState) => {
  // Deprecated in favor of merged professional generator
  return generateProfessionalPDF(state, { showInfo: false, showStats: true });
};

export const generatePDF = async () => { };

// --- NEW MATCH REPORT GENERATOR ---
export const generateMatchReport = async (
  match: TournamentMatch,
  sets: TournamentSet[],
  context: {
    tournamentName?: string,
    tournamentLogo?: string,
    fieldName?: string,
    localTeam?: any,
    visitorTeam?: any,
    scorerName?: string
  }
) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // 1. Load Tournament Logo
  let logoBase64 = '';
  try {
    if (context.tournamentLogo) logoBase64 = await getImageDataUrl(context.tournamentLogo);
    else logoBase64 = await getImageDataUrl('/logo.png');
  } catch (e) { }

  // 2. Load Team Logos
  let localLogo = null;
  let visitorLogo = null;
  try {
    if (context.localTeam?.logo_url) localLogo = await getImageDataUrl(context.localTeam.logo_url);
    if (context.visitorTeam?.logo_url) visitorLogo = await getImageDataUrl(context.visitorTeam.logo_url);
  } catch (e) { console.error("Error loading team logos", e); }

  // Prepare Header Data
  const dateStr = match.start_time ? new Date(match.start_time).toLocaleDateString() : new Date().toLocaleDateString();
  const gameNum = match.name || match.id.slice(0, 5).toUpperCase();
  const setNum = sets.every(s => s.status === 'finished') ? 'FINAL' : `${sets.length} SETS`;

  const headerState: ScoreCardState = {
    gameInfo: {
      competition: context.tournamentName || 'TORNEO B5TOOLS',
      place: context.fieldName || match.location || 'B5 Arena',
      date: dateStr,
      gameNum: gameNum,
      setNum: setNum,
      visitor: context.visitorTeam?.name || 'VISITANTE',
      home: context.localTeam?.name || 'LOCAL',
    } as any,
    visitorTeam: { slots: [] }, localTeam: { slots: [] },
    inningScores: { visitor: [], local: [] },
    totals: { visitor: '0', local: '0' },
    errors: { visitor: '0', local: '0' }
  };

  drawProfessionalHeader(doc, headerState, logoBase64, 'REPORTE FINAL DE PARTIDO');

  // Title Section (Teams + Logos)
  const titleBarY = 55;
  const titleBarHeight = 15; // Increased height for logos
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(15, titleBarY, 180, titleBarHeight, 1, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);

  // Center Point
  const centerX = 105;
  const logoSize = 12;
  const logoY = titleBarY + 1.5;
  const textY = titleBarY + 9.5;

  const vName = (context.visitorTeam?.name || 'VISITANTE').toUpperCase();
  const lName = (context.localTeam?.name || 'LOCAL').toUpperCase();

  // Draw Visitor (Left)
  let vTextX = centerX - 10; // Offset from center VS
  if (visitorLogo) {
    try {
      doc.addImage(visitorLogo, 'PNG', 20, logoY, logoSize, logoSize);
      // Align text left of logo roughly? No, let's put logos on far ends or near center?
      // Let's put logos next to names.
      // Layout: [Logo V] [Name V]  VS  [Name L] [Logo L] ?
      // Or: [Name V] vs [Name L] with logos inside?

      // Standard Layout: 
      // [Logo V (20, y)]  [Name V (35)] ........ VS (center) ........ [Name L] [Logo L]

      doc.text(vName, 35, textY);
    } catch (e) {
      doc.text(vName, 20, textY);
    }
  } else {
    doc.text(vName, 20, textY);
  }

  // Draw Local (Right)
  // Align right
  if (localLogo) {
    try {
      doc.addImage(localLogo, 'PNG', 190 - logoSize, logoY, logoSize, logoSize);
      doc.text(lName, 190 - logoSize - 2, textY, { align: 'right' });
    } catch (e) {
      doc.text(lName, 190, textY, { align: 'right' });
    }
  } else {
    doc.text(lName, 190, textY, { align: 'right' });
  }

  // Draw VS center
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(10);
  doc.text('vs', centerX, textY, { align: 'center' });


  let currentY = titleBarY + titleBarHeight + 5;

  sets.sort((a, b) => a.set_number - b.set_number).forEach((set) => {
    // Prepare Miniscore Data
    const vParams = [
      set.vis_inn1, set.vis_inn2, set.vis_inn3, set.vis_inn4, set.vis_inn5,
      set.vis_ex6, set.vis_ex7
    ].filter(x => x !== undefined).map(v => v !== null ? v.toString() : '-').slice(0, 10);

    // Auto-fill to at least 5 columns
    while (vParams.length < 5) vParams.push('-');

    const lParams = [
      set.loc_inn1, set.loc_inn2, set.loc_inn3, set.loc_inn4, set.loc_inn5,
      set.loc_ex6, set.loc_ex7
    ].filter(x => x !== undefined).map(v => v !== null ? v.toString() : '-').slice(0, 10);
    while (lParams.length < 5) lParams.push('-');


    const vRun = set.away_score ?? set.visitor_runs ?? 0;
    const lRun = set.home_score ?? set.local_runs ?? 0;
    const vHit = set.away_hits ?? 0;
    const lHit = set.home_hits ?? 0;
    const vErr = set.away_errors ?? 0;
    const lErr = set.home_errors ?? 0;

    // Draw Section Header for Set
    doc.setFillColor(71, 85, 105);
    doc.roundedRect(15, currentY, 180, 7, 1, 1, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`SET ${set.set_number} - ${set.status === 'finished' ? 'FINALIZADO' : 'PENDIENTE'}`, 20, currentY + 4.5);

    // Build Table Header
    const colCount = Math.max(vParams.length, 5);
    const headerRow = ['EQUIPO', ...Array.from({ length: colCount }, (_, i) => (i + 1).toString()), 'C', 'H', 'E'];

    // Table
    autoTable(doc, {
      startY: currentY + 8,
      head: [headerRow],
      body: [
        [context.visitorTeam?.name || 'VISITANTE', ...vParams, vRun, vHit, vErr],
        [context.localTeam?.name || 'LOCAL', ...lParams, lRun, lHit, lErr]
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], halign: 'center', fontSize: 9 },
      styles: { halign: 'center', fontSize: 9 },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 } },
      margin: { left: 15, right: 15 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  });

  applyGlobalBranding(doc, logoBase64);
  doc.save(`B5Tools_Match_${match.id.slice(0, 6)}_${dateStr.replace(/\//g, '-')}.pdf`);
};
