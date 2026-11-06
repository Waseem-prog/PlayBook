import { Trophy, Users, CalendarDays, MapPin } from 'lucide-react';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Trophy className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">PlayBook</span>
        </div>
        <div>
          <h2 className="max-w-md text-4xl font-bold leading-tight text-white">Connecting players, teams &amp; tournaments.</h2>
          <p className="mt-4 max-w-md text-brand-50">Build your squad, find rivals, book a court and borrow gear, all approved by your college sports office in one place.</p>
          <ul className="mt-8 space-y-3 text-sm text-brand-50">
            <li className="flex items-center gap-3"><Users className="h-5 w-5" /> Create teams and find teammates</li>
            <li className="flex items-center gap-3"><CalendarDays className="h-5 w-5" /> Schedule matches and track results</li>
            <li className="flex items-center gap-3"><MapPin className="h-5 w-5" /> Book venues and borrow equipment</li>
          </ul>
        </div>
        <p className="text-xs text-brand-100">Web Programming Project · BDS-7A</p>
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full border-[40px] border-white/10" />
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">PlayBook</span>
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
