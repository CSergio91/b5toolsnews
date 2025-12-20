import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
