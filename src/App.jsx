import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeFor } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Spinner } from './components/ui';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import StudentDashboard from './pages/student/Dashboard';
import Profile from './pages/student/Profile';
import MyTeams from './pages/student/MyTeams';
import CreateTeam from './pages/student/CreateTeam';
import TeamDetail from './pages/student/TeamDetail';
import FindPlayers from './pages/student/FindPlayers';
import FindOpponents from './pages/student/FindOpponents';
import Tournaments from './pages/student/Tournaments';
import TournamentDetail from './pages/student/TournamentDetail';
import ProposeTournament from './pages/student/ProposeTournament';
import Matches from './pages/student/Matches';
import MatchDetail from './pages/student/MatchDetail';
import BookVenue from './pages/student/BookVenue';
import Equipment from './pages/student/Equipment';

import AdminDashboard from './pages/admin/AdminDashboard';
import ApprovalQueue from './pages/admin/ApprovalQueue';
import ManageTournaments from './pages/admin/ManageTournaments';
import ManageMatches from './pages/admin/ManageMatches';
import Sports from './pages/admin/Sports';
import Venues from './pages/admin/Venues';
import EquipmentDesk from './pages/admin/EquipmentDesk';
import AllBookings from './pages/admin/AllBookings';
import UsersPage from './pages/admin/Users';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return <Navigate to={user ? homeFor(user) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute role="student" />}>
        <Route path="/student" element={<Layout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="teams" element={<MyTeams />} />
          <Route path="teams/new" element={<CreateTeam />} />
          <Route path="teams/:id" element={<TeamDetail />} />
          <Route path="players" element={<FindPlayers />} />
          <Route path="opponents" element={<FindOpponents />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="tournaments/new" element={<ProposeTournament />} />
          <Route path="tournaments/:id" element={<TournamentDetail />} />
          <Route path="matches" element={<Matches />} />
          <Route path="matches/:id" element={<MatchDetail />} />
          <Route path="book" element={<BookVenue />} />
          <Route path="equipment" element={<Equipment />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<Layout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="queue" element={<ApprovalQueue />} />
          <Route path="tournaments" element={<ManageTournaments />} />
          <Route path="tournaments/new" element={<ProposeTournament />} />
          <Route path="tournaments/:id" element={<TournamentDetail admin />} />
          <Route path="matches" element={<ManageMatches />} />
          <Route path="matches/:id" element={<MatchDetail admin />} />
          <Route path="teams/:id" element={<TeamDetail admin />} />
          <Route path="sports" element={<Sports />} />
          <Route path="venues" element={<Venues />} />
          <Route path="equipment" element={<EquipmentDesk />} />
          <Route path="bookings" element={<AllBookings />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
