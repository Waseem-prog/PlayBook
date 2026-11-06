import { respond, ApiError, uid, setSessionId, currentUser, publicUser } from './db';

// POST /api/auth/login
export const login = (email, password) =>
  respond((db) => {
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) throw new ApiError('Invalid email or password', 401);
    setSessionId(user.id);
    return publicUser(db, user.id);
  });

// POST /api/auth/register (students only; admins are created by the sports office)
export const register = ({ name, email, password }) =>
  respond((db) => {
    if (!name?.trim() || !email?.trim() || !password) throw new ApiError('All fields are required');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError('Enter a valid email address');
    if (password.length < 6) throw new ApiError('Password must be at least 6 characters');
    if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new ApiError('An account with this email already exists', 409);
    }
    const user = {
      id: uid('u'),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'student',
      createdAt: new Date().toISOString(),
      profile: { sportIds: [], skillLevel: 'Beginner', position: '', bio: '', available: false },
    };
    db.users.push(user);
    setSessionId(user.id);
    return publicUser(db, user.id);
  });

// GET /api/auth/me
export const me = () =>
  respond((db) => {
    const user = currentUser(db);
    return user ? publicUser(db, user.id) : null;
  });

export const logout = () =>
  respond(() => {
    setSessionId(null);
    return true;
  });
