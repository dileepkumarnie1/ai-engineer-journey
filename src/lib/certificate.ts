import { formatLong, type ISODate } from './dates';

export interface CertificateData {
  name: string;
  phaseOrder: number;
  phaseTitle: string;
  score: number;
  date: ISODate;
  goal?: string;
}

const W = 1600;
const H = 1000;
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

const wrap = (g: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
};

/** Draws the certificate entirely in the browser, so it works offline. */
export const drawCertificate = (d: CertificateData): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  if (!g) return canvas;

  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#6d28d9');
  bg.addColorStop(0.55, '#4f46e5');
  bg.addColorStop(1, '#06b6d4');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  g.beginPath();
  g.roundRect(70, 70, W - 140, H - 140, 48);
  g.fillStyle = '#ffffff';
  g.fill();
  g.beginPath();
  g.roundRect(100, 100, W - 200, H - 200, 32);
  g.strokeStyle = '#c4b5fd';
  g.lineWidth = 4;
  g.stroke();

  g.textAlign = 'center';
  g.fillStyle = '#7c3aed';
  g.font = `700 30px ${FONT}`;
  g.fillText('C E R T I F I C A T E   O F   M A S T E R Y', W / 2, 210);

  g.font = `96px ${FONT}`;
  g.fillText('⚔️', W / 2, 340);

  g.fillStyle = '#475569';
  g.font = `400 34px ${FONT}`;
  g.fillText('This certifies that', W / 2, 420);

  g.fillStyle = '#0f172a';
  g.font = `800 76px ${FONT}`;
  g.fillText(d.name.slice(0, 40), W / 2, 510);

  g.fillStyle = '#475569';
  g.font = `400 34px ${FONT}`;
  g.fillText('defeated the boss checkpoint of', W / 2, 580);

  g.fillStyle = '#4f46e5';
  g.font = `700 52px ${FONT}`;
  g.fillText(`Phase ${d.phaseOrder} · ${d.phaseTitle}`, W / 2, 650);

  g.fillStyle = '#334155';
  g.font = `600 32px ${FONT}`;
  g.fillText(`Score ${d.score}%  ·  ${formatLong(d.date)}`, W / 2, 715);

  if (d.goal) {
    g.fillStyle = '#64748b';
    g.font = `italic 400 28px ${FONT}`;
    wrap(g, `“${d.goal}”`, W - 400).forEach((line, i) => g.fillText(line, W / 2, 785 + i * 38));
  }

  g.fillStyle = '#94a3b8';
  g.font = `600 24px ${FONT}`;
  g.fillText('AI Engineer Journey', W / 2, H - 130);
  return canvas;
};

export const downloadCertificate = (d: CertificateData) => {
  drawCertificate(d).toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-engineer-journey-phase-${d.phaseOrder}-certificate.png`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
};
