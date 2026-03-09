import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Shift, Job } from '../types';
import { calcShiftPay, formatCurrency, formatHours } from './pay';

function shiftRows(shifts: Shift[], job: Job) {
  return shifts
    .filter((s) => s.endTime !== null)
    .map((s) => {
      const p = calcShiftPay(s, job);
      return {
        date: format(s.startTime, 'MMM d, yyyy'),
        start: format(s.startTime, 'h:mm a'),
        end: format(s.endTime!, 'h:mm a'),
        hours: formatHours(p.totalHours),
        overtime: formatHours(p.overtimeHours),
        gross: formatCurrency(p.grossPay, job.currency),
        net: formatCurrency(p.netPay, job.currency),
      };
    });
}

export function exportCSV(shifts: Shift[], job: Job, label: string): void {
  const rows = shiftRows(shifts, job);
  const header = 'Date,Start,End,Hours,Overtime,Gross,Net\n';
  const body = rows.map((r) => `${r.date},${r.start},${r.end},${r.hours},${r.overtime},${r.gross},${r.net}`).join('\n');
  const blob = new Blob([header + body], { type: 'text/csv' });
  triggerDownload(blob, `hours-tracker-${label}.csv`);
}

export function exportPDF(shifts: Shift[], job: Job, label: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('Hours Tracker Pro — Timesheet', 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Job: ${job.name}`, 14, 30);
  doc.text(`Period: ${label}`, 14, 36);
  doc.text(`Generated: ${format(Date.now(), 'MMM d, yyyy h:mm a')}`, 14, 42);

  const rows = shiftRows(shifts, job);
  autoTable(doc, {
    startY: 50,
    head: [['Date', 'Start', 'End', 'Hours', 'Overtime', 'Gross', 'Net']],
    body: rows.map((r) => [r.date, r.start, r.end, r.hours, r.overtime, r.gross, r.net]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
  });

  // Totals
  const totalGross = shifts.filter((s) => s.endTime).reduce((acc, s) => acc + calcShiftPay(s, job).grossPay, 0);
  const totalNet = shifts.filter((s) => s.endTime).reduce((acc, s) => acc + calcShiftPay(s, job).netPay, 0);
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(`Total Gross: ${formatCurrency(totalGross, job.currency)}`, 14, finalY);
  doc.text(`Total Net (est.): ${formatCurrency(totalNet, job.currency)}`, 14, finalY + 7);

  doc.save(`hours-tracker-${label}.pdf`);
}

export function exportText(shifts: Shift[], job: Job, label: string): string {
  const rows = shiftRows(shifts, job);
  const lines = [
    `Hours Tracker Pro — ${job.name}`,
    `Period: ${label}`,
    '─'.repeat(50),
    ...rows.map(
      (r) =>
        `${r.date}  ${r.start}–${r.end}  ${r.hours}  Gross: ${r.gross}  Net: ${r.net}`,
    ),
    '─'.repeat(50),
  ];
  const totalGross = shifts.filter((s) => s.endTime).reduce((acc, s) => acc + calcShiftPay(s, job).grossPay, 0);
  lines.push(`TOTAL GROSS: ${formatCurrency(totalGross, job.currency)}`);
  return lines.join('\n');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
