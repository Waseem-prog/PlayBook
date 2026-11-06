import { respond, ApiError, requireUser, requireAdmin, publicUser, findOr404 } from './db';

// PUT /api/users/me
export const updateProfile = ({ name, profile }) =>
  respond((db) => {
    const user = requireUser(db);
    if (name !== undefined) {
      if (!name.trim()) throw new ApiError('Name cannot be empty');
      user.name = name.trim();
    }
    if (profile) user.profile = { ...user.profile, ...profile };
    return publicUser(db, user.id);
  });

// GET /api/users/players?sport=&availableOnly=&search=
export const listPlayers = ({ sportId = '', availableOnly = true, search = '' } = {}) =>
  respond((db) => {
    requireUser(db);
    const q = search.trim().toLowerCase();
    return db.users
      .filter((u) => u.role === 'student')
      .filter((u) => !availableOnly || u.profile.available)
      .filter((u) => !sportId || u.profile.sportIds.includes(sportId))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || (u.profile.position || '').toLowerCase().includes(q))
      .map((u) => publicUser(db, u.id));
  });

// GET /api/users/students (for pickers, e.g. adding members or issuing gear)
export const listStudents = () =>
  respond((db) => {
    requireUser(db);
    return db.users.filter((u) => u.role === 'student').map((u) => publicUser(db, u.id));
  });

// GET /api/users (admin)
export const listUsers = () =>
  respond((db) => {
    requireAdmin(db);
    return db.users.map((u) => publicUser(db, u.id));
  });

// PATCH /api/users/:id/role (admin)
export const setRole = (id, role) =>
  respond((db) => {
    const admin = requireAdmin(db);
    if (id === admin.id) throw new ApiError('You cannot change your own role');
    if (!['student', 'admin'].includes(role)) throw new ApiError('Invalid role');
    findOr404(db.users, id, 'User').role = role;
    return publicUser(db, id);
  });

// DELETE /api/users/:id (admin)
export const removeUser = (id) =>
  respond((db) => {
    const admin = requireAdmin(db);
    if (id === admin.id) throw new ApiError('You cannot remove yourself');
    findOr404(db.users, id, 'User');
    if (db.teams.some((t) => t.captainId === id && t.status !== 'rejected')) {
      throw new ApiError('This user captains a team. Remove or reject the team first.');
    }
    if (db.loans.some((l) => l.userId === id && !l.returnedAt)) {
      throw new ApiError('This user still has equipment on loan');
    }
    db.users = db.users.filter((u) => u.id !== id);
    db.teams.forEach((t) => (t.memberIds = t.memberIds.filter((m) => m !== id)));
    db.bookings = db.bookings.filter((b) => b.userId !== id);
    return true;
  });
