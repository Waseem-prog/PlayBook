# PlayBook: Connecting Players, Teams & Tournaments

Web Programming project (BDS-7A), by Anosha Aamer (23L-2633) and Muhammad Waseem (23L-2545). Instructor: Mahhek Tahir.

React frontend with an Express REST API and MongoDB persistence. The server runs the approval, squad, scheduling, booking and inventory rules. Passwords are hashed with scrypt and sessions use an HTTP-only JWT cookie.

## Run it

1. Use Node.js 22 or later and a MongoDB Atlas cluster or a local MongoDB replica set. Transactions are required. For a new local instance, start MongoDB with `mongod --dbpath <data-directory> --replSet rs0 --bind_ip 127.0.0.1`, then run `mongosh --eval "rs.initiate()"` once.
2. Copy `.env.example` to `.env`. Set `MONGODB_URI` to the database you want to use and set `JWT_SECRET` to a random value of at least 32 bytes. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
3. Run `npm ci`. In one terminal run `npm run api`. In a second terminal run `npm run dev` and open http://localhost:5173. Vite forwards API requests to port 3001.

Run `npm run build` and then `npm run api` to serve the compiled frontend and API together on port 3001. Use HTTPS when running with `NODE_ENV=production` so the browser can send the secure session cookie.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Student (captain of Thunder FC) | `ali@student.edu` | `student123` |
| Sports Office (admin) | `admin@playbook.edu` | `admin123` |

The example environment seeds the demo database on first launch and shows the demo buttons. Every seeded student uses `student123`. For a real deployment, use a separate empty database, set both demo flags to `false`, and supply `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the first startup.

## Features

### Students
- **Build a squad**: create a team for any sport, add or remove teammates within the sport's min/max squad size. A team goes live only after sports office approval. Rejected or on-hold teams can be resubmitted.
- **Find people to play with**: player profile (skill level, position, bio, sports) with an "available" toggle. Browse available players by sport and add them to a team you captain.
- **Find someone to play against**: pick your sport and team to see every other approved team, and challenge any of them.
- **Tournaments**: browse open tournaments, propose your own, register or withdraw your team and track confirmation status, and view the participants and bracket.
- **Matches**: calendar (month/week/agenda) and list views with live status (scheduled → ongoing → completed) and final results.
- **Book a court/field**: same-day booking within 9 AM–5 PM, with a visual timeline of each venue. Overlapping bookings are blocked.
- **Equipment**: real-time availability of gear, plus your own loans with due dates and overdue warnings.

### Sports Office (admins)
- **Approval queue**: approve, hold or reject new teams, match requests and tournament proposals, with an optional note to the student.
- **Tournaments**: status flow proposed → approved → ongoing → completed or cancelled. Confirm or reject team registrations, draw or shuffle a single-elimination bracket, and click teams to advance them to a champion.
- **Matches**: approve, start, complete and record scores (winner computed automatically).
- **League setup**: add sports with min/max squad sizes, and add venues and mark them available or unavailable.
- **Equipment & bookings desk**: manage inventory, issue gear to students, receive returns, track overdue items, and view or cancel all bookings.
- **User management**: search the directory, change roles, remove users.

## Project structure

```
src/
  api/          HTTP clients grouped by resource
  components/   Layout, ProtectedRoute, Modal/Confirm/Review dialogs, cards, Bracket, calendar, UI kit
  context/      AuthContext (current user, login/register/logout)
  hooks/        useAsync (data loading) and useAction (mutations + toasts)
  pages/
    auth/       Login, Register
    student/    Dashboard, Profile, Teams, Players, Opponents, Tournaments, Matches, Booking, Equipment
    admin/      Dashboard, Approval Queue, Tournaments, Matches, Sports, Venues, Equipment Desk, Bookings, Users
  utils/        Date/time formatting helpers
server/
  domain/       Server-side business rules and demo seed data
  app.js        Express authentication and API setup
  routes.js     REST endpoints
  store.js      Mongoose collections and transactions
```

MongoDB transactions keep cross-resource changes together and prevent concurrent bookings or equipment loans from bypassing their checks. The store loads the project data within each transaction, which keeps the original rules together for this college-scale application.

**Tech:** React 18, Vite, React Router 6, Tailwind CSS, react-big-calendar, date-fns, lucide-react, react-hot-toast.

> Note: `package.json` overrides Rollup with its WebAssembly build (`@rollup/wasm-node`), because Windows Application Control on the development machine blocks Rollup's native binary. Output is the same, just slightly slower to build.
