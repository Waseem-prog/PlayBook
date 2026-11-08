import { respond, ApiError, uid, requireUser, requireAdmin, findOr404, publicUser } from './db';

export const isOverdue = (loan) => !loan.returnedAt && new Date(loan.dueDate) < new Date();

const view = (db, l) => ({
  ...l,
  equipment: db.equipment.find((e) => e.id === l.equipmentId) || { id: l.equipmentId, name: 'Removed item' },
  user: publicUser(db, l.userId),
  overdue: isOverdue(l),
});

// GET /api/loans/mine
export const listMyLoans = () =>
  respond((db) => {
    const user = requireUser(db);
    return db.loans
      .filter((l) => l.userId === user.id)
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
      .map((l) => view(db, l));
  });

// GET /api/loans?status=active|overdue|returned (admin)
export const listLoans = ({ status = '' } = {}) =>
  respond((db) => {
    requireAdmin(db);
    return db.loans
      .filter((l) => {
        if (status === 'active') return !l.returnedAt;
        if (status === 'overdue') return isOverdue(l);
        if (status === 'returned') return !!l.returnedAt;
        return true;
      })
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
      .map((l) => view(db, l));
  });

// POST /api/loans (admin issues gear)
export const issueLoan = ({ equipmentId, userId, qty, dueDate }) =>
  respond((db) => {
    requireAdmin(db);
    const item = findOr404(db.equipment, equipmentId, 'Item');
    const student = findOr404(db.users, userId, 'Student');
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) throw new ApiError('Quantity must be at least 1');
    if (n > item.availableQty) throw new ApiError(`Only ${item.availableQty} × ${item.name} available`);
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) throw new ApiError('Choose a due date');
    if (due < new Date()) throw new ApiError('Due date must be in the future');
    item.availableQty -= n;
    const loan = { id: uid('l'), equipmentId, userId: student.id, qty: n, issuedAt: new Date().toISOString(), dueDate: due.toISOString(), returnedAt: null };
    db.loans.push(loan);
    return view(db, loan);
  });

// PATCH /api/loans/:id/return (admin receives gear back)
export const returnLoan = (id) =>
  respond((db) => {
    requireAdmin(db);
    const loan = findOr404(db.loans, id, 'Loan');
    if (loan.returnedAt) throw new ApiError('This item was already returned');
    const item = db.equipment.find((e) => e.id === loan.equipmentId);
    if (item) item.availableQty = Math.min(item.totalQty, item.availableQty + loan.qty);
    loan.returnedAt = new Date().toISOString();
    return view(db, loan);
  });
