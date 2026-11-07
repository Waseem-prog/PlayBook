import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (d) => startOfWeek(d, { weekStartsOn: 1 }), getDay, locales: { 'en-US': enUS } });

const COLORS = {
  scheduled: '#0284c7',
  ongoing: '#7c3aed',
  completed: '#64748b',
  pending: '#d97706',
  on_hold: '#ea580c',
  rejected: '#e11d48',
};

export default function MatchCalendar({ matches, onSelect }) {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  const events = matches.map((m) => {
    const start = new Date(m.dateTime);
    return {
      id: m.id,
      title: `${m.homeTeam.name} vs ${m.awayTeam.name}${m.result ? ` (${m.result.homeScore}–${m.result.awayScore})` : ''}`,
      start,
      end: new Date(start.getTime() + 90 * 60000),
      resource: m,
    };
  });

  return (
    <div className="h-[640px]">
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={['month', 'week', 'agenda']}
        popup
        onSelectEvent={(e) => onSelect?.(e.resource)}
        eventPropGetter={(e) => {
          const m = e.resource;
          const key = m.approval === 'approved' ? m.status : m.approval;
          return { style: { backgroundColor: COLORS[key], border: 'none', opacity: m.approval === 'approved' ? 1 : 0.85 } };
        }}
      />
    </div>
  );
}

export const CalendarLegend = () => (
  <div className="flex flex-wrap gap-3 text-xs text-slate-600">
    {[['scheduled', 'Scheduled'], ['ongoing', 'Ongoing'], ['completed', 'Completed'], ['pending', 'Awaiting approval']].map(([k, l]) => (
      <span key={k} className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[k] }} /> {l}
      </span>
    ))}
  </div>
);
