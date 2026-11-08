import { Crown } from 'lucide-react';

function roundName(index, total) {
  const fromEnd = total - index;
  if (fromEnd === 1) return 'Final';
  if (fromEnd === 2) return 'Semi-finals';
  if (fromEnd === 3) return 'Quarter-finals';
  return `Round ${index + 1}`;
}

// Single-elimination bracket. `onPick(round, match, teamId)` is passed only for admins.
export default function Bracket({ bracket, teamName, championId, onPick, disabled }) {
  if (!bracket?.length) return null;

  function Slot({ teamId, match, r, i, isBye }) {
    const won = match.winner && match.winner === teamId;
    const lost = match.winner && teamId && match.winner !== teamId;
    const canPick = onPick && !disabled && match.a && match.b && teamId;
    const Tag = canPick ? 'button' : 'div';
    return (
      <Tag
        type={canPick ? 'button' : undefined}
        onClick={canPick ? () => onPick(r, i, teamId) : undefined}
        className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${won ? 'bg-brand-50 font-semibold text-brand-800' : lost ? 'text-slate-400 line-through' : 'text-slate-700'} ${canPick ? 'hover:bg-brand-50/70' : ''}`}
        title={canPick ? `Mark ${teamName(teamId)} as winner` : undefined}
      >
        <span className="truncate">{teamId ? teamName(teamId) : isBye ? <i className="text-slate-400">bye</i> : <span className="text-slate-400">TBD</span>}</span>
        {won && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
      </Tag>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-8">
        {bracket.map((round, r) => (
          <div key={r} className="flex w-56 flex-col">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{roundName(r, bracket.length)}</p>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {round.map((m, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <Slot teamId={m.a} match={m} r={r} i={i} />
                  <div className="border-t border-slate-100" />
                  <Slot teamId={m.b} match={m} r={r} i={i} isBye={r === 0 && !m.b} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex w-48 flex-col">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Champion</p>
          <div className="flex flex-1 items-center">
            <div className={`w-full rounded-lg border-2 px-3 py-3 text-center text-sm font-semibold ${championId ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-dashed border-slate-300 text-slate-400'}`}>
              {championId ? (
                <span className="inline-flex items-center gap-1.5"><Crown className="h-4 w-4" /> {teamName(championId)}</span>
              ) : (
                'TBD'
              )}
            </div>
          </div>
        </div>
      </div>
      {onPick && !disabled && <p className="mt-3 text-xs text-slate-500">Click a team to record it as the winner of that match.</p>}
    </div>
  );
}
