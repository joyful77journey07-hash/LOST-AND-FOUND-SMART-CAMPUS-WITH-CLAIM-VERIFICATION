import { useAuth } from '../session';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get } from '../api';

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [err, setErr] = useState('');
  const user = useAuth();
  useEffect(() => { get('/api/items/' + id).then(setItem).catch(e=>setErr(e.message)); }, [id]);
  if (err) return <p className="error">{err}</p>;
  if (!item) return <p>Loading...</p>;
  const canClaim = user && item.type === 'found' && item.reported_by !== user.user_id && item.status === 'open';
  return (
    <div className="detail">
      {item.image_path
        ? <img src={item.image_path} alt={item.name} className="detailimg" />
        : <div className="detailimg placeholder">📦</div>
      }
      <h2>{item.name}</h2>
      <div className="row">
        <span className={`badge ${item.type}`}>{item.type.toUpperCase()}</span>
        <span className={`badge status-${String(item.status).toLowerCase().replace(/\s+/g,'-')}`}>{item.status}</span>
      </div>
      <table className="infotable">
        <tbody>
          <tr><td>Category</td><td>{item.category_name}</td></tr>
          <tr><td>Description</td><td>{item.description}</td></tr>
          <tr><td>Location</td><td>{item.location}</td></tr>
          <tr><td>Date</td><td>{item.item_date}</td></tr>
          <tr><td>Reporter</td><td>{item.reporter_name} ({item.reporter_contact || item.reporter_email})</td></tr>
          <tr><td>Reported on</td><td>{item.created_at}</td></tr>
        </tbody>
      </table>
      {item.hidden_verification && (
        <div className="hiddenbox">
          <h4>Hidden verification details (privileged)</h4>
          <p>{item.hidden_verification}</p>
        </div>
      )}
      {canClaim && <Link to={`/claim/${item.item_id}`} className="btn">Claim this item</Link>}
      {!user && <p className="muted"><Link to="/login">Login</Link> to claim.</p>}
    </div>
  );
}
