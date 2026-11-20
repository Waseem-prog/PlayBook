// Demo data loaded on first run (and by "Reset demo data").
// Dates are relative to "now" so the demo always looks current.

const DAY = 24 * 60 * 60 * 1000;

function at(daysFromToday, hour, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return new Date(d.getTime() + daysFromToday * DAY).toISOString();
}

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const student = (id, name, email, profile) => ({
  id,
  name,
  email,
  password: 'student123',
  role: 'student',
  createdAt: at(-30, 10),
  profile: { sportIds: [], skillLevel: 'Intermediate', position: '', bio: '', available: false, ...profile },
});

export function buildSeed() {
  const sports = [
    { id: 'sp_football', name: 'Football', minPlayers: 5, maxPlayers: 11 },
    { id: 'sp_cricket', name: 'Cricket', minPlayers: 7, maxPlayers: 15 },
    { id: 'sp_basketball', name: 'Basketball', minPlayers: 5, maxPlayers: 10 },
    { id: 'sp_volleyball', name: 'Volleyball', minPlayers: 6, maxPlayers: 12 },
    { id: 'sp_badminton', name: 'Badminton', minPlayers: 1, maxPlayers: 4 },
  ];

  const venues = [
    { id: 've_main', name: 'Main Football Ground', sportIds: ['sp_football', 'sp_cricket'], available: true },
    { id: 've_court', name: 'Basketball Court A', sportIds: ['sp_basketball'], available: true },
    { id: 've_hall', name: 'Indoor Sports Hall', sportIds: ['sp_badminton', 'sp_volleyball', 'sp_basketball'], available: true },
    { id: 've_nets', name: 'Cricket Nets', sportIds: ['sp_cricket'], available: false },
  ];

  const equipment = [
    { id: 'eq_football', name: 'Football (Size 5)', sportId: 'sp_football', totalQty: 12, availableQty: 9 },
    { id: 'eq_bibs', name: 'Training Bibs (set of 10)', sportId: 'sp_football', totalQty: 6, availableQty: 5 },
    { id: 'eq_bball', name: 'Basketball', sportId: 'sp_basketball', totalQty: 8, availableQty: 7 },
    { id: 'eq_bat', name: 'Cricket Bat', sportId: 'sp_cricket', totalQty: 10, availableQty: 10 },
    { id: 'eq_cball', name: 'Cricket Ball (Tape)', sportId: 'sp_cricket', totalQty: 20, availableQty: 20 },
    { id: 'eq_vnet', name: 'Volleyball Net', sportId: 'sp_volleyball', totalQty: 2, availableQty: 2 },
    { id: 'eq_racket', name: 'Badminton Racket', sportId: 'sp_badminton', totalQty: 16, availableQty: 16 },
  ];

  const users = [
    {
      id: 'u_admin',
      name: 'Sports Office',
      email: 'admin@playbook.edu',
      password: 'admin123',
      role: 'admin',
      createdAt: at(-60, 9),
      profile: { sportIds: [], skillLevel: '', position: '', bio: 'College Sports Office', available: false },
    },
    student('u_ali', 'Ali Raza', 'ali@student.edu', { sportIds: ['sp_football', 'sp_basketball'], skillLevel: 'Advanced', position: 'Striker', bio: 'Captain of Thunder FC. Always up for a 5-a-side.', available: true }),
    student('u_sara', 'Sara Khan', 'sara@student.edu', { sportIds: ['sp_basketball', 'sp_volleyball'], skillLevel: 'Advanced', position: 'Point Guard', bio: 'Fast break specialist.', available: true }),
    student('u_hamza', 'Hamza Tariq', 'hamza@student.edu', { sportIds: ['sp_football'], position: 'Goalkeeper', available: false }),
    student('u_ayesha', 'Ayesha Noor', 'ayesha@student.edu', { sportIds: ['sp_football', 'sp_cricket'], position: 'Midfielder', available: true }),
    student('u_bilal', 'Bilal Ahmed', 'bilal@student.edu', { sportIds: ['sp_football'], skillLevel: 'Beginner', position: 'Defender' }),
    student('u_zain', 'Zain Malik', 'zain@student.edu', { sportIds: ['sp_football', 'sp_cricket'], position: 'Winger', available: true }),
    student('u_fatima', 'Fatima Iqbal', 'fatima@student.edu', { sportIds: ['sp_basketball', 'sp_badminton'], position: 'Shooting Guard', available: true }),
    student('u_usman', 'Usman Shah', 'usman@student.edu', { sportIds: ['sp_cricket'], skillLevel: 'Advanced', position: 'All-rounder', available: true }),
    student('u_hira', 'Hira Javed', 'hira@student.edu', { sportIds: ['sp_volleyball', 'sp_badminton'], skillLevel: 'Beginner', position: 'Libero', available: true }),
    student('u_omar', 'Omar Farooq', 'omar@student.edu', { sportIds: ['sp_football', 'sp_basketball'], position: 'Center' }),
    student('u_maryam', 'Maryam Aslam', 'maryam@student.edu', { sportIds: ['sp_basketball'], position: 'Forward', available: false }),
    student('u_danish', 'Danish Butt', 'danish@student.edu', { sportIds: ['sp_cricket', 'sp_football'], skillLevel: 'Beginner', position: 'Bowler', available: true }),
    student('u_noor', 'Noor Fatima', 'noor@student.edu', { sportIds: ['sp_football'], position: 'Defender', available: true }),
  ];

  const team = (id, name, sportId, captainId, memberIds, status, daysAgo = 10) => ({
    id,
    name,
    sportId,
    captainId,
    memberIds,
    status,
    adminNote: '',
    createdAt: at(-daysAgo, 11),
  });

  const teams = [
    team('t_thunder', 'Thunder FC', 'sp_football', 'u_ali', ['u_ali', 'u_hamza', 'u_ayesha', 'u_bilal', 'u_zain', 'u_noor'], 'approved', 20),
    team('t_strikers', 'Lahore Strikers', 'sp_football', 'u_omar', ['u_omar', 'u_danish', 'u_bilal', 'u_zain', 'u_hamza'], 'approved', 18),
    team('t_diggers', 'Goal Diggers', 'sp_football', 'u_ayesha', ['u_ayesha', 'u_noor', 'u_danish', 'u_usman', 'u_omar'], 'approved', 15),
    team('t_hoops', 'Hoop Dreams', 'sp_basketball', 'u_sara', ['u_sara', 'u_fatima', 'u_maryam', 'u_omar', 'u_ali'], 'approved', 14),
    team('t_dunk', 'Dunk Squad', 'sp_basketball', 'u_fatima', ['u_fatima', 'u_maryam', 'u_omar', 'u_sara', 'u_hira'], 'approved', 12),
    team('t_ninjas', 'Net Ninjas', 'sp_basketball', 'u_ali', ['u_ali', 'u_omar', 'u_maryam', 'u_fatima', 'u_sara'], 'pending', 2),
    team('t_boundary', 'Boundary Breakers', 'sp_cricket', 'u_usman', ['u_usman', 'u_danish', 'u_zain', 'u_ayesha', 'u_ali', 'u_hamza', 'u_bilal'], 'pending', 1),
  ];

  const match = (id, home, away, sportId, venueId, dateTime, approval, status, result = null, extra = {}) => ({
    id,
    homeTeamId: home,
    awayTeamId: away,
    sportId,
    venueId,
    dateTime,
    approval,
    status,
    result,
    tournamentId: null,
    createdById: 'u_ali',
    adminNote: '',
    createdAt: at(-5, 12),
    ...extra,
  });

  const matches = [
    match('m_1', 't_thunder', 't_strikers', 'sp_football', 've_main', at(-6, 15), 'approved', 'completed', { homeScore: 3, awayScore: 1, winnerId: 't_thunder' }),
    match('m_2', 't_hoops', 't_dunk', 'sp_basketball', 've_court', at(-3, 14), 'approved', 'completed', { homeScore: 54, awayScore: 58, winnerId: 't_dunk' }, { createdById: 'u_sara' }),
    match('m_3', 't_thunder', 't_diggers', 'sp_football', 've_main', at(0, 16), 'approved', 'ongoing'),
    match('m_4', 't_strikers', 't_diggers', 'sp_football', 've_main', at(3, 15), 'approved', 'scheduled', null, { createdById: 'u_omar' }),
    match('m_5', 't_dunk', 't_hoops', 'sp_basketball', 've_court', at(5, 13), 'pending', 'scheduled', null, { createdById: 'u_fatima' }),
    match('m_6', 't_thunder', 't_strikers', 'sp_football', 've_main', at(8, 11), 'pending', 'scheduled'),
  ];

  const tournaments = [
    {
      id: 'tr_cup',
      name: 'Inter-Department Football Cup',
      sportId: 'sp_football',
      venueId: 've_main',
      startDate: at(10, 9),
      endDate: at(14, 17),
      description: 'Annual knockout cup between department teams. Winner takes the trophy and bragging rights.',
      organizerId: 'u_admin',
      status: 'approved',
      registrations: [
        { teamId: 't_thunder', status: 'confirmed', registeredAt: at(-4, 10) },
        { teamId: 't_strikers', status: 'pending', registeredAt: at(-2, 10) },
      ],
      bracket: null,
      championId: null,
      adminNote: '',
      createdAt: at(-8, 10),
    },
    {
      id: 'tr_winter',
      name: 'Winter Basketball League',
      sportId: 'sp_basketball',
      venueId: 've_court',
      startDate: at(20, 10),
      endDate: at(27, 17),
      description: 'Round of games over a week in the winter break. Proposed by students.',
      organizerId: 'u_sara',
      status: 'proposed',
      registrations: [],
      bracket: null,
      championId: null,
      adminNote: '',
      createdAt: at(-1, 10),
    },
    {
      id: 'tr_futsal',
      name: 'Fall Futsal Fiesta',
      sportId: 'sp_football',
      venueId: 've_hall',
      startDate: at(-25, 9),
      endDate: at(-24, 17),
      description: 'Two-day indoor futsal tournament.',
      organizerId: 'u_admin',
      status: 'completed',
      registrations: [
        { teamId: 't_thunder', status: 'confirmed', registeredAt: at(-35, 10) },
        { teamId: 't_strikers', status: 'confirmed', registeredAt: at(-35, 11) },
        { teamId: 't_diggers', status: 'confirmed', registeredAt: at(-34, 10) },
      ],
      bracket: [
        [
          { a: 't_thunder', b: null, winner: 't_thunder' },
          { a: 't_strikers', b: 't_diggers', winner: 't_diggers' },
        ],
        [{ a: 't_thunder', b: 't_diggers', winner: 't_diggers' }],
      ],
      championId: 't_diggers',
      adminNote: '',
      createdAt: at(-40, 10),
    },
  ];

  const today = todayStr();
  const bookings = [
    { id: 'b_1', venueId: 've_court', userId: 'u_sara', date: today, startTime: '10:00', endTime: '11:00', purpose: 'Shooting practice', createdAt: at(0, 8) },
    { id: 'b_2', venueId: 've_main', userId: 'u_omar', date: today, startTime: '13:00', endTime: '14:30', purpose: 'Team drills', createdAt: at(0, 8, 30) },
    { id: 'b_3', venueId: 've_hall', userId: 'u_hira', date: today, startTime: '09:00', endTime: '10:00', purpose: 'Badminton casual', createdAt: at(0, 8, 45) },
  ];

  const loans = [
    { id: 'l_1', equipmentId: 'eq_football', userId: 'u_ali', qty: 2, issuedAt: at(-4, 10), dueDate: at(-1, 17), returnedAt: null },
    { id: 'l_2', equipmentId: 'eq_football', userId: 'u_omar', qty: 1, issuedAt: at(-1, 12), dueDate: at(2, 17), returnedAt: null },
    { id: 'l_3', equipmentId: 'eq_bibs', userId: 'u_ali', qty: 1, issuedAt: at(0, 9), dueDate: at(1, 17), returnedAt: null },
    { id: 'l_4', equipmentId: 'eq_bball', userId: 'u_sara', qty: 1, issuedAt: at(-6, 10), dueDate: at(-3, 17), returnedAt: null },
    { id: 'l_5', equipmentId: 'eq_bat', userId: 'u_usman', qty: 2, issuedAt: at(-10, 10), dueDate: at(-8, 17), returnedAt: at(-8, 16) },
  ];

  return { sports, venues, equipment, users, teams, matches, tournaments, bookings, loans };
}
