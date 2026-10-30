import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getToken, useAuth } from './session';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import Search from './pages/Search';
import ItemDetail from './pages/ItemDetail';
import Claim from './pages/Claim';
import MyActivity from './pages/MyActivity';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import VerifyClaims from './pages/VerifyClaims';
import FlaggedUsers from './pages/FlaggedUsers';
import BackButton from './components/BackButton';
import PageBgPicker from './components/PageBgPicker';

function Private({ children }) {
  const user = useAuth();
  return (user && getToken()) ? children : <Navigate to="/login" />;
}
function Admin({ children }) {
  const user = useAuth();
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
}

export default function App() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  useEffect(() => {
    document.body.classList.add('theme-dark');
  }, []);
  return (
    <>
      {!isHome && <PageBgPicker />}
      <Navbar />
      <div className={'container wallcontent' + (isHome ? '' : ' pagepanel')}>
        <BackButton />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/report-lost" element={<Private><ReportLost /></Private>} />
          <Route path="/report-found" element={<Private><ReportFound /></Private>} />
          <Route path="/claim/:id" element={<Private><Claim /></Private>} />
          <Route path="/my" element={<Private><MyActivity /></Private>} />
          <Route path="/profile" element={<Private><Profile /></Private>} />
          <Route path="/verify" element={<Private><VerifyClaims /></Private>} />
          <Route path="/admin" element={<Admin><AdminDashboard /></Admin>} />
          <Route path="/admin/flagged" element={<Admin><FlaggedUsers /></Admin>} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}
