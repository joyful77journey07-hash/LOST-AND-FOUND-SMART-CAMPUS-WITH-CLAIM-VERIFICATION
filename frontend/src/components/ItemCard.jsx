import { Link } from 'react-router-dom';

export default function ItemCard({ item }) {
  return (
    <div className="card">
      {item.image_path
        ? <img src={item.image_path} alt={item.name} className="cardimg" />
        : <div className="cardimg placeholder">📦</div>
      }
      <div className="cardbody">
        <div className="row" style={{gap:4,marginBottom:6}}>
          <span className={`badge ${item.type}`}>{item.type}</span>
          <span className={`badge status-${String(item.status).toLowerCase().replace(/\s+/g,'-')}`}>{item.status}</span>
        </div>
        <h3>{item.name}</h3>
        <p className="muted">{item.category_name || 'Uncategorized'} · {item.location}</p>
        <p className="carddesc">{(item.description || '').slice(0, 80)}</p>
        <Link to={`/items/${item.item_id}`} className="btn small green">View Details</Link>
      </div>
    </div>
  );
}
