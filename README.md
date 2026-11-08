# PlayBook: Connecting Players, Teams & Tournaments

Web Programming project (BDS-7A), by Anosha Aamer (23L-2633) and Muhammad Waseem (23L-2545). Instructor: Mahhek Tahir.

**Deliverable 1** is the complete, working **frontend** (React). The Express + MongoDB backend arrives in Deliverable 2. Until then the app runs on a mock data layer stored in the browser's `localStorage`, so every feature can be used end to end.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. To build for production, run `npm run build`; the output goes to `dist/`.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Student (captain of Thunder FC) | `ali@student.edu` | `student123` |
| Sports Office (admin) | `admin@playbook.edu` | `admin123` |

Every seeded student (`sara@`, `omar@`, `fatima@`, `usman@` … `@student.edu`) uses `student123`. The login page has buttons that fill in the two main accounts, and you can also register a new student account.

**Reset demo data** (bottom of the sidebar) restores the original sample data.

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
  api/          Mock REST layer (one module per resource) + localStorage db + seed data
  components/   Layout, ProtectedRoute, Modal/Confirm/Review dialogs, cards, Bracket, calendar, UI kit
  context/      AuthContext (current user, login/register/logout)
  hooks/        useAsync (data loading) and useAction (mutations + toasts)
  pages/
    auth/       Login, Register
    student/    Dashboard, Profile, Teams, Players, Opponents, Tournaments, Matches, Booking, Equipment
    admin/      Dashboard, Approval Queue, Tournaments, Matches, Sports, Venues, Equipment Desk, Bookings, Users
  utils/        Date/time formatting helpers
```

Each function in `src/api/*.js` is async and mirrors a planned REST endpoint (each one has a comment such as `// POST /api/teams`). Business rules live there too: approvals, squad limits, booking hours and overlaps, venue clashes, stock counts, and bracket progression. In Deliverable 2 each function body becomes an Axios call to the Express API, and the pages stay unchanged.

**Tech:** React 18, Vite, React Router 6, Tailwind CSS, react-big-calendar, date-fns, lucide-react, react-hot-toast.

> Note: `package.json` overrides Rollup with its WebAssembly build (`@rollup/wasm-node`), because Windows Application Control on the development machine blocks Rollup's native binary. Output is the same, just slightly slower to build.
