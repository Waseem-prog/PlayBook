export const OPEN_TIME = '09:00';
export const CLOSE_TIME = '17:00';

const pad = (n) => String(n).padStart(2, '0');

export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toMinutes(hhmm) {
  if (!/^\d{2}:\d{2}$/.test(hhmm || '')) return NaN;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export const fromMinutes = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

// 30-minute slots between opening and closing time
export function timeSlots(from = OPEN_TIME, to = CLOSE_TIME) {
  const out = [];
  for (let t = toMinutes(from); t <= toMinutes(to); t += 30) out.push(fromMinutes(t));
  return out;
}

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const fmtShortDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export const fmtTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const fmtDateTime = (iso) => `${fmtDate(iso)}, ${fmtTime(iso)}`;

export function fmtRange(start, end) {
  const s = fmtShortDate(start);
  const e = fmtShortDate(end);
  return s === e ? fmtDate(start) : `${s} – ${fmtDate(end)}`;
}

// Value for <input type="datetime-local"> / <input type="date">
export function toLocalInput(date, withTime = true) {
  const d = new Date(date);
  const base = todayStr(d);
  return withTime ? `${base}T${pad(d.getHours())}:${pad(d.getMinutes())}` : base;
}

export function relativeDays(iso) {
  const ms = new Date(iso) - new Date();
  const days = Math.round(ms / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export const labelOf = (status = '') => status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
