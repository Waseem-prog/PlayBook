import express from 'express';
import jwt from 'jsonwebtoken';
import { resolve } from 'node:path';
import { ApiError, publicUser, runWithData, uid } from './domain/db.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { createRouter } from './routes.js';

const sessionCookie = 'playbook_session';
const sessionSeconds = 8 * 60 * 60;

export function createApp({ transaction, secret, secure, serveFrontend = false }) {
  const app = express();
  app.disable('x-powered-by');
  const api = express.Router();
  api.use(express.json({ limit: '32kb' }));
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const cookie = (req.headers.cookie || '').split(';').map(value => value.trim())
      .find(value => value.startsWith(sessionCookie + '='));
    if (cookie) {
      try {
        req.userId = jwt.verify(cookie.slice(sessionCookie.length + 1), secret, {
          algorithms: ['HS256'], issuer: 'playbook',
        }).sub;
      } catch {
        // Invalid or expired sessions are anonymous.
      }
    }
    next();
  });

  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure, path: '/api' };
  function signIn(res, user) {
    const token = jwt.sign({}, secret, { issuer: 'playbook', subject: user.id, expiresIn: sessionSeconds });
    res.cookie(sessionCookie, token, { ...cookieOptions, maxAge: sessionSeconds * 1000 });
    res.json(user);
  }

  function credentials(req) {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 256) {
      throw new ApiError('Enter a valid email and password');
    }
    return { email: email.trim().toLowerCase(), password };
  }

  api.post('/auth/login', async (req, res) => {
    const { email, password } = credentials(req);
    const user = await transaction(async db => {
      const account = db.users.find(user => user.email === email);
      if (!account || !await verifyPassword(password, account.passwordHash)) {
        throw new ApiError('Invalid email or password', 401);
      }
      return publicUser(db, account.id);
    }, false);
    signIn(res, user);
  });
  api.post('/auth/register', async (req, res) => {
    const { email, password } = credentials(req);
    const { name } = req.body;
    if (typeof name !== 'string' || !name.trim() || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new ApiError('Enter a name and a valid email address');
    }
    if (password.length < 6) throw new ApiError('Password must be at least 6 characters');
    const passwordHash = await hashPassword(password);
    const user = await transaction(db => {
      if (db.users.some(user => user.email === email)) throw new ApiError('An account with this email already exists', 409);
      const id = uid('u');
      db.users.push({
        id, name: name.trim(), email, passwordHash, role: 'student',
        createdAt: new Date().toISOString(),
        profile: { sportIds: [], skillLevel: 'Beginner', position: '', bio: '', available: false },
      });
      return publicUser(db, id);
    }, true);
    signIn(res, user);
  });
  api.get('/auth/me', async (req, res) => {
    const user = req.userId ? await transaction(db => db.users.some(user => user.id === req.userId)
      ? publicUser(db, req.userId) : null, false) : null;
    res.json(user);
  });
  api.post('/auth/logout', (req, res) => {
    res.clearCookie(sessionCookie, cookieOptions).json(true);
  });
  api.use(createRouter((req, action, write) =>
    transaction(db => runWithData(db, req.userId, action), write)));
  api.use((req, res) => res.status(404).json({ message: 'API endpoint not found' }));
  api.use((error, req, res, next) => {
    if (error instanceof ApiError) return res.status(error.status).json({ message: error.message });
    if (error.code === 11000) return res.status(409).json({ message: 'This entry already exists' });
    if (error instanceof TypeError || error.status === 400 || error.status === 413) {
      return res.status(error.status || 400).json({ message: 'Invalid request data' });
    }
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  });
  app.use('/api', api);
  if (serveFrontend) {
    const dist = resolve('dist');
    app.use(express.static(dist));
    app.get('/{*path}', (req, res) => res.sendFile(resolve(dist, 'index.html')));
  }
  return app;
}
