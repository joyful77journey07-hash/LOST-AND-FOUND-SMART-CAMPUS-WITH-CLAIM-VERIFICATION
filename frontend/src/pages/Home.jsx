import { useAuth } from '../session';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api';
import ItemCard from '../components/ItemCard';

export default function Home() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const user = useAuth();

  // Typewriter: rotates through taglines
  const LINES = [
    'Lost something on campus? We help you find it.',
    'Found something? Return it to its rightful owner.',
    'Smart claim verification stops false claims.',
    'Report. Search. Verify. Reunite.'
  ];
  const [typed, setTyped] = useState('');
  useEffect(() => {
    let line = 0, ch = 0, deleting = false, t;
    const tick = () => {
      const full = LINES[line];
      if (!deleting) {
        ch++; setTyped(full.slice(0, ch));
        if (ch === full.length) { deleting = true; t = setTimeout(tick, 1800); return; }
        t = setTimeout(tick, 45);
      } else {
        ch--; setTyped(full.slice(0, ch));
        if (ch === 0) { deleting = false; line = (line + 1) % LINES.length; t = setTimeout(tick, 400); return; }
        t = setTimeout(tick, 22);
      }
    };
    t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    get('/api/items').then(setItems).catch(()=>{});
    get('/api/admin/stats').then(setStats).catch(()=>{});
  }, []);

  return (
    <div className="home">
      <div>

        <div className="hero">

          <p className="hero-kicker fade-up" style={{'--i':0}}>SMART CAMPUS</p>
          <h1 className="hero-title fade-up" style={{'--i':1}}>
            <span className="shimmer">LOST</span><span className="amp">&amp;</span><span className="shimmer">FOUND</span>
          </h1>
          <p className="creator fade-up" style={{'--i':2}}>Created by Aditya Kumar</p>

          <p className="typeline fade-up" style={{'--i':3}}>
            <span className="typed">{typed}</span><span className="caret">|</span>
          </p>

          {user && <p className="welcome fade-up" style={{'--i':4}}>Welcome back, {user.name}!</p>}
          {user && user.photo_path && (
            <img src={user.photo_path} alt="profile" className="avatar fade-up" style={{'--i':4}} />
          )}

          <div className="hero-steps fade-up" style={{'--i':5}}>
            <span className="chip">Report</span><span className="arrow">→</span>
            <span className="chip">Search</span><span className="arrow">→</span>
            <span className="chip">Verify</span><span className="arrow">→</span>
            <span className="chip">Reunite</span>
          </div>

          <div className="fade-up" style={{'--i':6,display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginTop:18}}>
            <Link to="/search" className="btn cyan pulse">Browse Items</Link>
            {user && <Link to="/report-lost" className="btn outline">Report Lost</Link>}
            {user && <Link to="/report-found" className="btn outline">Report Found</Link>}
            {!user && <Link to="/login" className="btn outline">Login to Report</Link>}
            {!user && <Link to="/register" className="btn cyan">Register</Link>}
          </div>
        </div>

        {stats && (
          <div className="stats">
            <div className="stat"><b>{stats.items}</b><span>Total Reports</span></div>
            <div className="stat"><b>{stats.lost}</b><span>Lost</span></div>
            <div className="stat"><b>{stats.found}</b><span>Found</span></div>
            <div className="stat"><b>{stats.returned}</b><span>Returned</span></div>
            <div className="stat"><b>{stats.claims}</b><span>Claims</span></div>
          </div>
        )}

        <h2 className="cyan">How it works</h2>
        <div className="how">
          <div className="howcard"><h4>1. Report</h4><p className="muted small">Post a lost or found item with details and a photo.</p></div>
          <div className="howcard"><h4>2. Search</h4><p className="muted small">Filter by keyword, category, location or date.</p></div>
          <div className="howcard"><h4>3. Verify &amp; Claim</h4><p className="muted small">Finder stores hidden details; claimant answers ownership questions.</p></div>
        </div>

        <h2 className="green">Recent Reports</h2>
        <div className="grid">
          {items.slice(0, 8).map(i => <ItemCard key={i.item_id} item={i} />)}
        </div>
        {items.length === 0 && (
          <div className="empty">
            <p>No reports yet. Be the first to report!</p>
          </div>
        )}
      </div>
    </div>
  );
}