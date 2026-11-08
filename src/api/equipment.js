import { respond, ApiError, uid, requireAdmin, requireUser, findOr404, sportOf } from './db';

const view = (db, e) => ({ ...e, sport: sportOf(db, e.sportId), onLoan: e.totalQty - e.availableQty });

// GET /api/equipment
export const listEquipment = () =>
  respond((db) => {
    requireUser(db);
    return db.equipment.map((e) => view(db, e));
  });

// POST /api/equipment (admin)
export const createEquipment = ({ name, sportId, totalQty }) =>
  respond((db) => {
    requireAdmin(db);
    const qty = Number(totalQty);
    if (!name?.trim()) throw new ApiError('Item name is required');
    if (!Number.isInteger(qty) || qty < 1) throw new ApiError('Quantity must be at least 1');
    const item = { id: uid('eq'), name: name.trim(), sportId, totalQty: qty, availableQty: qty };
    db.equipment.push(item);
    return view(db, item);
  });

// PUT /api/equipment/:id (admin). Changing the total moves availability by the same amount.
export const updateEquipment = (id, { name, sportId, totalQty }) =>
  respond((db) => {
    requireAdmin(db);
    const item = findOr404(db.equipment, id, 'Item');
    const qty = Number(totalQty);
    const onLoan = item.totalQty - item.availableQty;
    if (!name?.trim()) throw new ApiError('Item name is required');
    if (!Number.isInteger(qty) || qty < Math.max(1, onLoan)) throw new ApiError(`Total must be at least ${Math.max(1, onLoan)} (${onLoan} on loan)`);
    Object.assign(item, { name: name.trim(), sportId, totalQty: qty, availableQty: qty - onLoan });
    return view(db, item);
  });

// DELETE /api/equipment/:id (admin)
export const deleteEquipment = (id) =>
  respond((db) => {
    requireAdmin(db);
    const item = findOr404(db.equipment, id, 'Item');
    if (item.availableQty < item.totalQty) throw new ApiError('Some of this item is still on loan');
    db.equipment = db.equipment.filter((e) => e.id !== id);
    db.loans = db.loans.filter((l) => l.equipmentId !== id);
    return true;
  });
