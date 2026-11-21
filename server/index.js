import { createApp } from './app.js';
import { connectStore } from './store.js';

const { MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!MONGODB_URI || !JWT_SECRET || Buffer.byteLength(JWT_SECRET) < 32) {
  throw new Error('Set MONGODB_URI and a JWT_SECRET of at least 32 bytes.');
}
process.env.TZ = process.env.PLAYBOOK_TIMEZONE || 'Asia/Karachi';
const transaction = await connectStore(MONGODB_URI, {
  demo: process.env.PLAYBOOK_DEMO === 'true',
  adminEmail: ADMIN_EMAIL,
  adminPassword: ADMIN_PASSWORD,
});
const port = process.env.PORT || 3001;
const secure = process.env.NODE_ENV === 'production';
createApp({ transaction, secure, secret: JWT_SECRET, serveFrontend: true })
  .listen(port, () => console.log(`PlayBook listening on port ${port}`));
