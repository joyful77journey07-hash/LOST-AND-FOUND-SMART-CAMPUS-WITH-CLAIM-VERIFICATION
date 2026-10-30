import { useAuth, clearSession } from '../session';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const user = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const logout = () => { clearSession(); setOpen && setOpen(false); navigate('/'); };
  const photo = user && user.photo_path;
  return (
    <nav className="navbar">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <span className="brand">LOST &amp; FOUND</span>
        <span style={{fontSize:'.72rem',opacity:.8,fontStyle:'italic'}}>Created by Aditya Kumar</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <Link to="/" className="btn small">Home</Link>
        {user ? (
          <div style={{position:'relative'}}>
            <button onClick={() => setOpen(!open)} className="menubtn" aria-label="menu">
              {photo ? <img src={photo} alt="" style={{width:34,height:34,borderRadius:'50%',objectFit:'cover',border:'2px solid #fff'}} /> : <span style={{fontSize:'1.3rem'}}>&#9776;</span>}
            </button>
            {open && (
              <div className="dropdown" onClick={() => setOpen(false)}>
                <div className="dd-header">
                  {photo && <img src={photo} alt="" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover'}} />}
                  <div><b>{user.name}</b><br/><span className="muted small">{user.email}</span></div>
                </div>
                <Link to="/report-lost" className="dd-item">Report Lost</Link>
                <Link to="/report-found" className="dd-item">Report Found</Link>
                <Link to="/search" className="dd-item">Search Items</Link>
                <Link to="/my" className="dd-item">My Activity</Link>
                <Link to="/verify" className="dd-item">Verify Claims</Link>
                <Link to="/profile" className="dd-item">Profile</Link>
                {user.role === 'admin' && <Link to="/admin" className="dd-item">Admin Dashboard</Link>}
                {user.role === 'admin' && <Link to="/admin/flagged" className="dd-item">Flagged Users</Link>}
                <button onClick={logout} className="dd-item dd-logout">Logout</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{display:'flex',gap:6}}>
            <Link to="/login" className="btn small">Login</Link>
            <Link to="/register" className="btn small">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
