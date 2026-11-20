import mongoose from 'mongoose';
import { isDeepStrictEqual } from 'node:util';
import { hashPassword } from './passwords.js';
import { buildSeed } from './domain/seed.js';

const resources = {
  users: 'users', sports: 'sports', teams: 'teams', matches: 'matches',
  tournaments: 'tournaments', venues: 'venues', bookings: 'bookings',
  equipment: 'equipmentitems', loans: 'equipmentloans',
};

export async function connectStore(uri, { demo, adminEmail, adminPassword }) {
  await mongoose.connect(uri);
  const models = Object.fromEntries(Object.entries(resources).map(([key, name]) => {
    const schema = new mongoose.Schema({ id: { type: String, required: true, unique: true } }, {
      strict: false, versionKey: false, collection: name,
    });
    if (key === 'users') schema.index({ email: 1 }, { unique: true });
    if (key === 'bookings') schema.index({ venueId: 1, date: 1, startTime: 1 }, { unique: true });
    return [key, mongoose.model(key, schema)];
  }));
  await Promise.all(Object.values(models).map(model => model.init()));

  const revision = mongoose.connection.collection('playbook_revision');
  await revision.updateOne({ _id: 'data' }, { $setOnInsert: { initialized: false, version: 0 } }, { upsert: true });

  async function transaction(operation, write) {
    return mongoose.connection.transaction(async session => {
      // Serialize mutations across processes so overlap and stock checks see the latest data.
      if (write) await revision.updateOne({ _id: 'data' }, { $inc: { version: 1 } }, { session });
      const db = {};
      for (const [key, model] of Object.entries(models)) {
        db[key] = await model.find({}, { _id: 0 }).session(session).lean();
      }
      const before = write ? structuredClone(db) : null;
      const result = await operation(db, session);
      if (write) {
        for (const [key, model] of Object.entries(models)) {
          const previous = new Map(before[key].map(item => [item.id, item]));
          const changes = [];
          for (const item of db[key]) {
            if (!isDeepStrictEqual(previous.get(item.id), item)) {
              changes.push({ replaceOne: { filter: { id: item.id }, replacement: item, upsert: true } });
            }
            previous.delete(item.id);
          }
          for (const id of previous.keys()) changes.push({ deleteOne: { filter: { id } } });
          if (changes.length) await model.bulkWrite(changes, { session });
        }
      }
      return result;
    });
  }

  await transaction(async (db, session) => {
    const state = await revision.findOne({ _id: 'data' }, { session });
    if (state.initialized) {
      if (state.demo !== demo) throw new Error('Use separate databases for demo and real data.');
      return;
    }
    if (demo) {
      Object.assign(db, buildSeed());
      await Promise.all(db.users.map(async user => {
        user.passwordHash = await hashPassword(user.password);
        delete user.password;
      }));
    } else {
      if (!adminEmail || !adminPassword || adminPassword.length < 12) {
        throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters for initial setup.');
      }
      db.users.push({
        id: 'initial_admin', name: 'Sports Office', email: adminEmail.trim().toLowerCase(),
        passwordHash: await hashPassword(adminPassword), role: 'admin',
        profile: { sportIds: [], skillLevel: 'Beginner', position: '', bio: '', available: false },
        createdAt: new Date().toISOString(),
      });
    }
    await revision.updateOne({ _id: 'data' }, { $set: { initialized: true, demo } }, { session });
  }, true);
  return transaction;
}
