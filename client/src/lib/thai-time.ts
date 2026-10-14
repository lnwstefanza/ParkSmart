/**
 * ParkSmart Thai 24-hour Time & Date Utilities (Asia/Bangkok)
 * Strictly formats dates as dd/mm/yyyy with Buddhist Era (B.E. 2569)
 */

export function parseDateSafe(dateInput?: string | Date | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  let s = String(dateInput).trim();
  if (!s) return null;

  // If already standard ISO with Z or timezone offset (+07:00 or -05:00)
  if (s.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }

  // Handle "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss"
  s = s.replace(' ', 'T');
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // Fallback: try appending Bangkok timezone (+07:00)
  d = new Date(s + '+07:00');
  if (!isNaN(d.getTime())) return d;

  return null;
}

export function formatThai24hTime(timeStr?: string): string {
  if (!timeStr) return '--:-- น.';
  const match = timeStr.match(/(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]} น.`;
  }
  return `${timeStr} น.`;
}

/**
 * Formats date and time strictly as dd/mm/yyyy HH:mm น. in Buddhist Era (e.g. 14/10/2569 เวลา 10:00 น.)
 */
export function formatThaiDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  const d = parseDateSafe(dateInput);
  if (!d) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543; // Buddhist Era (2569)
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} เวลา ${hours}:${minutes} น.`;
}

/**
 * Formats date only as dd/mm/yyyy in Buddhist Era (e.g. 14/10/2569)
 */
export function formatThaiDateOnly(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  const d = parseDateSafe(dateInput);
  if (!d) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543;

  return `${day}/${month}/${year}`;
}

export function getCurrentThaiTime(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDurationMinutes(minutes: number = 0): string {
  if (isNaN(minutes) || minutes <= 0) return '0 นาที';
  if (minutes < 60) {
    return `${minutes} นาที`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ชั่วโมง ${m} นาที` : `${h} ชั่วโมง`;
}

export function formatTimeOnly(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  const d = parseDateSafe(dateInput);
  if (!d) return String(dateInput);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} น.`;
}

export function formatSmartTime(targetDateStr?: string, baseDateStr?: string): string {
  if (!targetDateStr) return '-';
  const target = parseDateSafe(targetDateStr);
  if (!target) return String(targetDateStr);

  const hours = String(target.getHours()).padStart(2, '0');
  const minutes = String(target.getMinutes()).padStart(2, '0');

  if (baseDateStr) {
    const base = parseDateSafe(baseDateStr);
    if (base && target.toDateString() === base.toDateString()) {
      return `${hours}:${minutes} น.`;
    }
  }

  const day = String(target.getDate()).padStart(2, '0');
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const year = target.getFullYear() + 543;

  return `${day}/${month}/${year} เวลา ${hours}:${minutes} น.`;
}

export function getOvertimeSummary(bookedEnd?: string, actualOut?: string) {
  if (!bookedEnd || !actualOut) return null;
  const endDate = parseDateSafe(bookedEnd);
  const outDate = parseDateSafe(actualOut);
  if (!endDate || !outDate) return null;

  const endMs = endDate.getTime();
  const outMs = outDate.getTime();
  if (isNaN(endMs) || isNaN(outMs)) return null;

  // If actual out is before or at booked end, there is NO overtime
  if (outMs <= endMs) return null;

  const diffMinutes = Math.max(0, Math.ceil((outMs - endMs) / 60000));
  if (diffMinutes <= 0 || isNaN(diffMinutes)) return null;

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  let durationText = '';
  if (hours > 0 && mins > 0) {
    durationText = `${hours} ชั่วโมง ${mins} นาที`;
  } else if (hours > 0) {
    durationText = `${hours} ชั่วโมง`;
  } else {
    durationText = `${mins} นาที`;
  }

  const endStr = formatSmartTime(bookedEnd);
  const outStr = formatSmartTime(actualOut, bookedEnd);

  return {
    diffMinutes,
    hours,
    mins,
    durationText,
    endStr,
    outStr,
    sentence: `ผู้ใช้งานจอดเกินเวลามา ${durationText} (จากเวลาที่ต้องออก ${endStr} แต่ผู้ใช้งานออก ${outStr})`
  };
}
