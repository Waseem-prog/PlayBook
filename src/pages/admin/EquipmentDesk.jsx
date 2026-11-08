import { useState } from 'react';
import { Plus, Pencil, Trash2, PackagePlus, PackageCheck, Package } from 'lucide-react';
import { useAsync, useAction } from '../../hooks/useAsync';
import { equipmentApi, loansApi, sportsApi, usersApi } from '../../api';
import { PageHeader, Card, Spinner, Table, Tabs, Field, Input, Select, StatusBadge, EmptyState } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { StockBar } from '../student/Equipment';
import { fmtShortDate, relativeDays, toLocalInput } from '../../utils/format';

const EMPTY_ITEM = { name: '', sportId: '', totalQty: 1 };

function defaultDue() {
  const d = new Date(Date.now() + 2 * 86400000);
  d.setHours(17, 0, 0, 0);
  return toLocalInput(d);
}

export default function EquipmentDesk() {
  const { busy, run } = useAction();
  const [tab, setTab] = useState('active');
  const [editing, setEditing] = useState(null);
  const [item, setItem] = useState(EMPTY_ITEM);
  const [deleting, setDeleting] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [issue, setIssue] = useState({ equipmentId: '', userId: '', qty: 1, dueDate: defaultDue() });

  const { data, loading, reload } = useAsync(async () => {
    const [items, loans, sports, students] = await Promise.all([equipmentApi.listEquipment(), loansApi.listLoans(), sportsApi.listSports(), usersApi.listStudents()]);
    return { items, loans, sports, students };
  });

  if (loading && !data) return <Spinner />;

  const loanFilters = {
    active: (l) => !l.returnedAt && !l.overdue,
    overdue: (l) => l.overdue,
    returned: (l) => !!l.returnedAt,
  };
  const loans = data.loans.filter(loanFilters[tab]);

  function openItem(i) {
    setEditing(i || 'new');
    setItem(i ? { name: i.name, sportId: i.sportId, totalQty: i.totalQty } : { ...EMPTY_ITEM, sportId: data.sports[0]?.id || '' });
  }

  async function saveItem(e) {
    e.preventDefault();
    const isNew = editing === 'new';
    const { ok } = await run(() => (isNew ? equipmentApi.createEquipment(item) : equipmentApi.updateEquipment(editing.id, item)), isNew ? 'Item added' : 'Item updated');
    if (ok) {
      setEditing(null);
      reload();
    }
  }

  function openIssue(equipmentId = '') {
    setIssue({ equipmentId: equipmentId || data.items.find((i) => i.availableQty)?.id || '', userId: '', qty: 1, dueDate: defaultDue() });
    setIssuing(true);
  }

  async function submitIssue(e) {
    e.preventDefault();
    const { ok } = await run(() => loansApi.issueLoan(issue), 'Equipment issued');
    if (ok) {
      setIssuing(false);
      setTab('active');
      reload();
    }
  }

  const receive = (l) => run(() => loansApi.returnLoan(l.id), `${l.equipment.name} received back`).then(({ ok }) => ok && reload());
  const selectedItem = data.items.find((i) => i.id === issue.equipmentId);

  return (
    <>
      <PageHeader
        title="Equipment & loans desk"
        subtitle="Issue gear to students, receive it back and chase overdue returns."
        actions={
          <>
            <button className="btn-primary" onClick={() => openIssue()}><PackagePlus className="h-4 w-4" /> Issue equipment</button>
            <button className="btn-secondary" onClick={() => openItem()}><Plus className="h-4 w-4" /> Add item</button>
          </>
        }
      />

      <Card title="Inventory" bodyClass="p-0" className="mb-6">
        <Table
          rows={data.items}
          empty={<EmptyState icon={Package} title="No equipment yet" />}
          columns={[
            { key: 'name', label: 'Item', render: (i) => <span className="font-medium">{i.name}</span> },
            { key: 'sport', label: 'Sport', render: (i) => i.sport.name },
            { key: 'stock', label: 'Available', render: (i) => <StockBar available={i.availableQty} total={i.totalQty} /> },
            { key: 'onLoan', label: 'On loan', render: (i) => i.onLoan },
            {
              key: 'actions',
              label: '',
              render: (i) => (
                <div className="flex justify-end gap-1">
                  <button className="btn-secondary btn-sm" disabled={!i.availableQty} onClick={() => openIssue(i.id)}>Issue</button>
                  <button className="btn-ghost p-1.5" onClick={() => openItem(i)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button className="btn-ghost p-1.5 text-slate-400 hover:text-rose-600" onClick={() => setDeleting(i)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'active', label: 'On loan', count: data.loans.filter(loanFilters.active).length },
          { value: 'overdue', label: 'Overdue', count: data.loans.filter(loanFilters.overdue).length },
          { value: 'returned', label: 'Returned', count: data.loans.filter(loanFilters.returned).length },
        ]}
      />
      <Card bodyClass="p-0">
        <Table
          rows={loans}
          empty={<EmptyState icon={PackageCheck} title={tab === 'overdue' ? 'Nothing overdue 🎉' : 'No loans here'} />}
          columns={[
            { key: 'item', label: 'Item', render: (l) => <span className="font-medium">{l.qty} × {l.equipment.name}</span> },
            { key: 'student', label: 'Student', render: (l) => <div><p>{l.user.name}</p><p className="text-xs text-slate-500">{l.user.email}</p></div> },
            { key: 'issued', label: 'Issued', render: (l) => fmtShortDate(l.issuedAt) },
            {
              key: 'due',
              label: tab === 'returned' ? 'Returned' : 'Due',
              render: (l) =>
                l.returnedAt ? fmtShortDate(l.returnedAt) : <span className={l.overdue ? 'font-medium text-rose-600' : ''}>{fmtShortDate(l.dueDate)} ({relativeDays(l.dueDate)})</span>,
            },
            { key: 'status', label: 'Status', render: (l) => <StatusBadge status={l.returnedAt ? 'returned' : l.overdue ? 'overdue' : 'active'} label={l.returnedAt ? 'Returned' : l.overdue ? 'Overdue' : 'On loan'} /> },
            {
              key: 'actions',
              label: '',
              render: (l) => !l.returnedAt && <button className="btn-primary btn-sm" disabled={busy} onClick={() => receive(l)}><PackageCheck className="h-3.5 w-3.5" /> Receive</button>,
            },
          ]}
        />
      </Card>

      <Modal
        open={issuing}
        onClose={() => setIssuing(false)}
        title="Issue equipment"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setIssuing(false)}>Cancel</button>
            <button className="btn-primary" form="issue-form" disabled={busy}>Issue</button>
          </>
        }
      >
        <form id="issue-form" onSubmit={submitIssue} className="space-y-4">
          <Field label="Item" hint={selectedItem ? `${selectedItem.availableQty} of ${selectedItem.totalQty} available` : undefined}>
            <Select
              required
              value={issue.equipmentId}
              onChange={(e) => setIssue({ ...issue, equipmentId: e.target.value })}
              placeholder="Choose item"
              options={data.items.map((i) => ({ value: i.id, label: `${i.name} (${i.availableQty} left)`, disabled: !i.availableQty }))}
            />
          </Field>
          <Field label="Student">
            <Select required value={issue.userId} onChange={(e) => setIssue({ ...issue, userId: e.target.value })} placeholder="Choose student" options={data.students.map((s) => ({ value: s.id, label: `${s.name} (${s.email})` }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input type="number" min="1" max={selectedItem?.availableQty} required value={issue.qty} onChange={(e) => setIssue({ ...issue, qty: e.target.value })} />
            </Field>
            <Field label="Due back">
              <Input type="datetime-local" required value={issue.dueDate} onChange={(e) => setIssue({ ...issue, dueDate: e.target.value })} />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add item' : `Edit ${editing?.name}`}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" form="item-form" disabled={busy}>Save</button>
          </>
        }
      >
        <form id="item-form" onSubmit={saveItem} className="space-y-4">
          <Field label="Name">
            <Input required value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} placeholder="e.g. Volleyball" />
          </Field>
          <Field label="Sport">
            <Select value={item.sportId} onChange={(e) => setItem({ ...item, sportId: e.target.value })} options={data.sports.map((s) => ({ value: s.id, label: s.name }))} />
          </Field>
          <Field label="Total quantity" hint={editing !== 'new' && editing ? `${editing.onLoan} currently on loan` : undefined}>
            <Input type="number" min="1" required value={item.totalQty} onChange={(e) => setItem({ ...item, totalQty: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.name}?`}
        message="Items that are still on loan can't be deleted."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={async () => {
          const { ok } = await run(() => equipmentApi.deleteEquipment(deleting.id), 'Item deleted');
          setDeleting(null);
          if (ok) reload();
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
