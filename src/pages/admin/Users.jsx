import { useState } from 'react';
import { Trash2, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync, useAction } from '../../hooks/useAsync';
import { usersApi, sportsApi } from '../../api';
import { PageHeader, Card, Spinner, Table, FilterBar, Field, Input, Select, Avatar, StatusBadge, EmptyState } from '../../components/ui';
import { ConfirmDialog } from '../../components/Modal';
import { fmtShortDate } from '../../utils/format';

export default function UsersPage() {
  const { user: me } = useAuth();
  const { busy, run } = useAction();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [removing, setRemoving] = useState(null);
  const [roleChange, setRoleChange] = useState(null);
  const { data, loading, reload } = useAsync(async () => {
    const [users, sports] = await Promise.all([usersApi.listUsers(), sportsApi.listSports()]);
    return { users, sports };
  });

  if (loading && !data) return <Spinner />;
  const s = q.trim().toLowerCase();
  const rows = data.users.filter((u) => (!role || u.role === role) && (!s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)));
  const sportNames = (ids) => ids.map((id) => data.sports.find((x) => x.id === id)?.name).filter(Boolean).join(', ');

  return (
    <>
      <PageHeader title="User directory" subtitle={`${data.users.filter((u) => u.role === 'student').length} students · ${data.users.filter((u) => u.role === 'admin').length} admins`} />
      <FilterBar>
        <Field label="Search" className="lg:col-span-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email" />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value)} placeholder="All roles" options={[{ value: 'student', label: 'Students' }, { value: 'admin', label: 'Admins' }]} />
        </Field>
      </FilterBar>
      <Card bodyClass="p-0">
        <Table
          rows={rows}
          empty={<EmptyState icon={UsersIcon} title="No users match" />}
          columns={[
            {
              key: 'name',
              label: 'User',
              render: (u) => (
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" />
                  <div>
                    <p className="font-medium">{u.name} {u.id === me.id && <span className="text-xs text-slate-400">(you)</span>}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
              ),
            },
            { key: 'sports', label: 'Sports', render: (u) => <span className="text-slate-600">{sportNames(u.profile.sportIds) || '—'}</span> },
            { key: 'avail', label: 'Available', render: (u) => (u.role === 'student' ? <StatusBadge status={u.profile.available ? 'available' : 'unavailable'} label={u.profile.available ? 'Yes' : 'No'} /> : '—') },
            { key: 'joined', label: 'Joined', render: (u) => fmtShortDate(u.createdAt) },
            {
              key: 'role',
              label: 'Role',
              render: (u) =>
                u.id === me.id ? (
                  <StatusBadge status="admin" />
                ) : (
                  <select className="input w-28 py-1 text-xs" value={u.role} onChange={(e) => setRoleChange({ user: u, role: e.target.value })}>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                ),
            },
            {
              key: 'x',
              label: '',
              render: (u) => u.id !== me.id && <button className="btn-ghost p-1.5 text-slate-400 hover:text-rose-600" onClick={() => setRemoving(u)} aria-label={`Remove ${u.name}`}><Trash2 className="h-4 w-4" /></button>,
            },
          ]}
        />
      </Card>

      <ConfirmDialog
        open={!!roleChange}
        title="Change role?"
        message={roleChange && `Make ${roleChange.user.name} ${roleChange.role === 'admin' ? 'an admin (sports office access)' : 'a student'}?`}
        confirmLabel="Change role"
        busy={busy}
        onConfirm={async () => {
          const { ok } = await run(() => usersApi.setRole(roleChange.user.id, roleChange.role), 'Role updated');
          setRoleChange(null);
          if (ok) reload();
        }}
        onClose={() => setRoleChange(null)}
      />
      <ConfirmDialog
        open={!!removing}
        title={`Remove ${removing?.name}?`}
        message="They will be removed from all teams and their bookings cancelled. Users who captain a team or have gear on loan can't be removed."
        confirmLabel="Remove user"
        danger
        busy={busy}
        onConfirm={async () => {
          const { ok } = await run(() => usersApi.removeUser(removing.id), 'User removed');
          setRemoving(null);
          if (ok) reload();
        }}
        onClose={() => setRemoving(null)}
      />
    </>
  );
}
