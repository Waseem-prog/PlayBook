import { Router } from 'express';
import * as sports from './domain/sports.js';
import * as venues from './domain/venues.js';
import * as teams from './domain/teams.js';
import * as users from './domain/users.js';
import * as matches from './domain/matches.js';
import * as tournaments from './domain/tournaments.js';
import * as bookings from './domain/bookings.js';
import * as equipment from './domain/equipment.js';
import * as loans from './domain/loans.js';
import * as admin from './domain/admin.js';

const body = req => req.body ?? {};
const byId = req => [req.params.id];
const update = req => [req.params.id, body(req)];
const review = req => [req.params.id, body(req).decision, body(req).note];
const status = req => [req.params.id, body(req).status, body(req).note];
const data = req => [body(req)];
const team = req => [req.params.id, req.params.teamId ?? body(req).teamId];
const flag = (value, fallback = false) => value === undefined ? fallback : value === 'true';

export function createRouter(run) {
  const router = Router();
  const route = (method, path, action, args = () => []) => {
    router[method](path, async (req, res, next) => {
      try {
        res.json(await run(req, () => action(...args(req)), method !== 'get'));
      } catch (error) {
        next(error);
      }
    });
  };

  route('get', '/sports', sports.listSports);
  route('post', '/sports', sports.createSport, data);
  route('put', '/sports/:id', sports.updateSport, update);
  route('delete', '/sports/:id', sports.deleteSport, byId);
  route('get', '/venues', venues.listVenues);
  route('post', '/venues', venues.createVenue, data);
  route('put', '/venues/:id', venues.updateVenue, update);
  route('delete', '/venues/:id', venues.deleteVenue, byId);
  route('get', '/teams/mine', teams.listMyTeams);
  route('get', '/teams/opponents', teams.findOpponents, req => [{ sportId: req.query.sport, teamId: req.query.team }]);
  route('get', '/teams', teams.listTeams, req => [{ status: req.query.status, sportId: req.query.sport }]);
  route('get', '/teams/:id', teams.getTeam, byId);
  route('post', '/teams', teams.createTeam, data);
  route('post', '/teams/:id/members', teams.addMember, req => [req.params.id, body(req).userId]);
  route('delete', '/teams/:id/members/:userId', teams.removeMember, req => [req.params.id, req.params.userId]);
  route('post', '/teams/:id/resubmit', teams.resubmitTeam, byId);
  route('delete', '/teams/:id', teams.disbandTeam, byId);
  route('patch', '/teams/:id/review', teams.reviewTeam, review);
  route('put', '/users/me', users.updateProfile, data);
  route('get', '/users/players', users.listPlayers, req => [{
    sportId: req.query.sport, search: req.query.search, availableOnly: flag(req.query.availableOnly, true),
  }]);
  route('get', '/users/students', users.listStudents);
  route('get', '/users', users.listUsers);
  route('patch', '/users/:id/role', users.setRole, req => [req.params.id, body(req).role]);
  route('delete', '/users/:id', users.removeUser, byId);
  route('get', '/matches', matches.listMatches, req => [{
    approval: req.query.approval, status: req.query.status, mineOnly: flag(req.query.mineOnly),
  }]);
  route('get', '/matches/:id', matches.getMatch, byId);
  route('post', '/matches', matches.createMatch, data);
  route('delete', '/matches/:id', matches.cancelMatch, byId);
  route('patch', '/matches/:id/review', matches.reviewMatch, review);
  route('patch', '/matches/:id/status', matches.setMatchStatus, status);
  route('put', '/matches/:id/result', matches.recordResult, update);
  route('get', '/tournaments', tournaments.listTournaments, req => [{ status: req.query.status }]);
  route('get', '/tournaments/:id', tournaments.getTournament, byId);
  route('post', '/tournaments', tournaments.proposeTournament, data);
  route('post', '/tournaments/:id/register', tournaments.registerTeam, team);
  route('delete', '/tournaments/:id/register/:teamId', tournaments.withdrawTeam, team);
  route('patch', '/tournaments/:id/registrations/:teamId', tournaments.reviewRegistration,
    req => [...team(req), body(req).status]);
  route('patch', '/tournaments/:id/status', tournaments.setTournamentStatus, status);
  route('post', '/tournaments/:id/bracket', tournaments.generateBracket, update);
  route('patch', '/tournaments/:id/bracket', tournaments.setBracketWinner,
    req => [req.params.id, body(req).roundIndex, body(req).matchIndex, body(req).teamId]);
  route('get', '/bookings/mine', bookings.listMyBookings);
  route('get', '/bookings/all', bookings.listAllBookings);
  route('get', '/bookings', bookings.listBookings, req => [{ date: req.query.date, venueId: req.query.venue }]);
  route('post', '/bookings', bookings.createBooking, data);
  route('delete', '/bookings/:id', bookings.cancelBooking, byId);
  route('get', '/equipment', equipment.listEquipment);
  route('post', '/equipment', equipment.createEquipment, data);
  route('put', '/equipment/:id', equipment.updateEquipment, update);
  route('delete', '/equipment/:id', equipment.deleteEquipment, byId);
  route('get', '/loans/mine', loans.listMyLoans);
  route('get', '/loans', loans.listLoans, req => [{ status: req.query.status }]);
  route('post', '/loans', loans.issueLoan, data);
  route('patch', '/loans/:id/return', loans.returnLoan, byId);
  route('get', '/admin/queue', admin.getQueue);
  route('get', '/admin/stats', admin.getStats);
  return router;
}
