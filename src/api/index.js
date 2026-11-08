// Single entry point for all data access. Pages import from here so that
// Deliverable 2 can swap these mock modules for real HTTP calls in one place.
export * as authApi from './auth';
export * as usersApi from './users';
export * as sportsApi from './sports';
export * as venuesApi from './venues';
export * as equipmentApi from './equipment';
export * as teamsApi from './teams';
export * as matchesApi from './matches';
export * as tournamentsApi from './tournaments';
export * as bookingsApi from './bookings';
export * as loansApi from './loans';
export * as adminApi from './admin';
