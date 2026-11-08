import { useState } from 'react';
import { Package, Search } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { equipmentApi, loansApi, sportsApi } from '../../api';
import { PageHeader, Card, Spinner, StatusBadge, EmptyState, Select, Table } from '../../components/ui';
import { fmtShortDate, relativeDays } from '../../utils/format';

export function StockBar({ available, total }) {
  const pct = total ? (available / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${pct === 0 ? 'bg-rose-400' : pct < 30 ? 'bg-amber-400' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-600">{available}/{total}</span>
    </div>
  );
}

export default function Equipment() {
  const [sportId, setSportId] = useState('');
  const [q, setQ] = useState('');
  const { data, loading } = useAsync(async () => {
    const [items, loans, sports] = await Promise.all([equipmentApi.listEquipment(), loansApi.listMyLoans(), sportsApi.listSports()]);
    return { items, loans, sports };
  });

  if (loading || !data) return <Spinner />;
  const items = data.items.filter((i) => (!sportId || i.sportId === sportId) && (!q || i.name.toLowerCase().includes(q.toLowerCase())));
  const active = data.loans.filter((l) => !l.returnedAt);

  return (
    <>
      <PageHeader title="Equipment room" subtitle="Live availability of gear. Visit the sports office desk to borrow an item." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Availability"
          bodyClass="p-0"
          actions={
            <div className="flex gap-2">
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="input w-40 py-1.5 pl-8" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="w-36">
                <Select value={sportId} onChange={(e) => setSportId(e.target.value)} placeholder="All sports" options={data.sports.map((s) => ({ value: s.id, label: s.name }))} />
              </div>
            </div>
          }
        >
          <Table
            rows={items}
            empty={<EmptyState icon={Package} title="No items match" />}
            columns={[
              { key: 'name', label: 'Item', render: (i) => <span className="font-medium">{i.name}</span> },
              { key: 'sport', label: 'Sport', render: (i) => i.sport.name },
              { key: 'stock', label: 'Available', render: (i) => <StockBar available={i.availableQty} total={i.totalQty} /> },
              { key: 'onLoan', label: 'On loan', render: (i) => i.onLoan },
              { key: 'status', label: '', render: (i) => <StatusBadge status={i.availableQty ? 'available' : 'unavailable'} label={i.availableQty ? 'In stock' : 'All out'} /> },
            ]}
          />
        </Card>

        <Card title={`My loans (${active.length} active)`} bodyClass="divide-y divide-slate-100">
          {data.loans.length ? (
            data.loans.map((l) => (
              <div key={l.id} className="flex items-start gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{l.qty} × {l.equipment.name}</p>
                  <p className="text-xs text-slate-500">
                    Issued {fmtShortDate(l.issuedAt)} ·{' '}
                    {l.returnedAt ? `returned ${fmtShortDate(l.returnedAt)}` : `due ${fmtShortDate(l.dueDate)} (${relativeDays(l.dueDate)})`}
                  </p>
                </div>
                <StatusBadge status={l.returnedAt ? 'returned' : l.overdue ? 'overdue' : 'active'} label={l.returnedAt ? 'Returned' : l.overdue ? 'Overdue' : 'On loan'} />
              </div>
            ))
          ) : (
            <EmptyState icon={Package} title="You haven't borrowed anything" />
          )}
        </Card>
      </div>
    </>
  );
}
