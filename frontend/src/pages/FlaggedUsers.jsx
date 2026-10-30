import { useEffect, useState } from 'react';
import { get, put } from '../api';
import ActionModal from '../components/ActionModal';

const fmt = (d) => d ? String(d).replace('T', ' ').slice(0, 16) : '';

export default function FlaggedUsers() {
  const [flagged, setFlagged] = useState([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [details, setDetails] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const loadFlagged = async () => {
    try { setFlagged(await get('/api/admin/flagged')); } catch (e) { setErr(e.message); }
  };
  useEffect(() => { loadFlagged(); }, []);

  const search = async (e) => {
    e && e.preventDefault();
    setErr(''); setResults(null); setDetails(null);
    if (!q.trim()) return;
    try {
      const r = await get('/api/admin/users/search?email=' + encodeURIComponent(q.trim()));
      setResults(r);
      if (r.length === 1) openDetails(r[0].user_id);
    } catch (e) { setErr(e.message); }
  };

  const openDetails = async (id) => {
    setErr('');
    try { setDetails(await get('/api/admin/users/' + id + '/details')); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { setErr(e.message); }
  };

  const [dialog, setDialog] = useState(null);
  const applyBlock = async (u, blocking, reason) => {
    setBusy(true);
    try {
      await put('/api/admin/users/' + u.user_id + '/block', { blocked: blocking, reason });
      await loadFlagged();
      if (details && details.user.user_id === u.user_id) openDetails(u.user_id);
      if (results) setResults(results.map(r => r.user_id === u.user_id ? { ...r, blocked: blocking ? 1 : 0, blocked_reason: blocking ? reason : null } : r));
    } finally { setBusy(false); }
  };
  const toggleBlock = (u) => {
    const blocking = !u.blocked;
    setDialog(blocking ? {
      title: 'Block ' + u.name + '?', message: 'The user will be logged out immediately and cannot log in, report or claim until unblocked.',
      withInput: true, inputLabel: 'Reason (shown to the user when they try to log in)', defaultValue: 'Repeated false claims', confirmText: 'Block user', danger: true,
      onConfirm: (reason) => applyBlock(u, true, reason)
    } : {
      title: 'Unblock ' + u.name + '?', message: 'The user will be able to log in and use the system again.', confirmText: 'Unblock',
      onConfirm: () => applyBlock(u, false, '')
    });
  };

  const setReportStatus = async (id, status) => {
    try { await put('/api/admin/reports/' + id, { status }); if (details) openDetails(details.user.user_id); loadFlagged(); }
    catch (e) { setErr(e.message); }
  };

  const BlockBtn = ({ u }) => (
    u.role === 'admin' ? null :
    <button className={'btn small ' + (u.blocked ? 'success' : 'danger')} disabled={busy} onClick={() => toggleBlock(u)}>
      {u.blocked ? 'Unblock user' : 'Block user'}
    </button>
  );

  return (
    <div>
      {dialog && <ActionModal {...dialog} onClose={() => setDialog(null)} />}
      <h2>Flagged Users</h2>
      <p className="muted">Users who have been reported by other members. Search any user by email to see all their details and block them from the project.</p>
      {err && <p className="error">{err}</p>}

      <form onSubmit={search} className="row" style={{marginBottom:18}}>
        <input placeholder="Search user by email (e.g. user01@campus.edu)" value={q} onChange={e => setQ(e.target.value)} style={{flex:1,minWidth:260}} />
        <button className="btn" type="submit">Search</button>
        {(results || details) && <button type="button" className="btn outline" onClick={() => { setResults(null); setDetails(null); setQ(''); }}>Clear</button>}
      </form>

      {results && results.length === 0 && <p className="muted">No user found with that email.</p>}
      {results && results.length > 1 && (
        <div style={{marginBottom:18}}>
          <h3>Search results ({results.length})</h3>
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Roll No</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {results.map(u => (
                <tr key={u.user_id}>
                  <td>{u.name}</td><td>{u.email}</td><td>{u.roll_no}</td>
                  <td>{u.blocked ? <span className="badge danger">BLOCKED</span> : <span className="badge status-open">active</span>}</td>
                  <td><button className="btn small" onClick={() => openDetails(u.user_id)}>View details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {details && (
        <div className="card" style={{marginBottom:24}}>
          <div className="cardbody">
            <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
              {details.user.photo_path
                ? <img src={details.user.photo_path} alt="" style={{width:72,height:72,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--fg)'}} />
                : <div style={{width:72,height:72,borderRadius:'50%',background:'var(--card2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--fg)',fontSize:'1.8rem'}}>{(details.user.name||'?')[0].toUpperCase()}</div>}
              <div style={{flex:1}}>
                <h3 style={{margin:'0 0 4px'}}>{details.user.name} {details.user.blocked ? <span className="badge danger">BLOCKED</span> : <span className="badge status-open">active</span>}</h3>
                <div className="muted small">
                  <b>Email:</b> {details.user.email} · <b>Roll No:</b> {details.user.roll_no || '—'} · <b>Contact:</b> {details.user.contact || '—'} · <b>Role:</b> {details.user.role} · <b>Joined:</b> {fmt(details.user.created_at)}
                </div>
                {!!details.user.blocked && <div className="small muted" style={{marginTop:4}}>Blocked reason: {details.user.blocked_reason || '—'}</div>}
              </div>
              <BlockBtn u={details.user} />
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginTop:16}}>
              <div className="stat"><b>{details.reportsAgainst.length}</b><span>Reports against</span></div>
              <div className="stat"><b>{details.claims.length}</b><span>Claims made</span></div>
              <div className="stat"><b>{details.items.length}</b><span>Items reported</span></div>
              <div className="stat"><b>{details.reportsMade.length}</b><span>Reports filed</span></div>
            </div>

            <h4 style={{marginBottom:6}}>Reports against this user ({details.reportsAgainst.length})</h4>
            {details.reportsAgainst.length === 0 ? <p className="muted small">No reports.</p> : (
              <table className="table">
                <thead><tr><th>Date</th><th>Reported by</th><th>Related item</th><th>Description</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {details.reportsAgainst.map(r => (
                    <tr key={r.report_id}>
                      <td className="small">{fmt(r.created_at)}</td>
                      <td className="small">{r.reporter_name}<br/><span className="muted">{r.reporter_email}</span></td>
                      <td className="small">{r.item_name || '—'}</td>
                      <td className="small" style={{maxWidth:360,whiteSpace:'pre-wrap'}}>{r.description}</td>
                      <td><span className={'badge ' + (r.status==='open' ? 'status-pending' : r.status==='reviewed' ? 'status-approved' : 'neutral')}>{r.status}</span></td>
                      <td style={{whiteSpace:'nowrap'}}>
                        {r.status !== 'reviewed' && <button className="btn small success" onClick={() => setReportStatus(r.report_id,'reviewed')}>Reviewed</button>}{' '}
                        {r.status !== 'dismissed' && <button className="btn small outline" onClick={() => setReportStatus(r.report_id,'dismissed')}>Dismiss</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h4 style={{marginBottom:6}}>Claims made ({details.claims.length})</h4>
            {details.claims.length === 0 ? <p className="muted small">No claims.</p> : (
              <table className="table">
                <thead><tr><th>Date</th><th>Item</th><th>Claim description</th><th>Status</th></tr></thead>
                <tbody>{details.claims.map(c => <tr key={c.claim_id}><td className="small">{fmt(c.created_at)}</td><td>{c.item_name}</td><td className="small">{c.claim_description}</td><td><span className={`badge status-${String(c.status).toLowerCase().replace(/\s+/g,'-')}`}>{c.status}</span></td></tr>)}</tbody>
              </table>
            )}

            <h4 style={{marginBottom:6}}>Items reported ({details.items.length})</h4>
            {details.items.length === 0 ? <p className="muted small">No items.</p> : (
              <table className="table">
                <thead><tr><th>Date</th><th>Type</th><th>Item</th><th>Category</th><th>Location</th><th>Status</th></tr></thead>
                <tbody>{details.items.map(i => <tr key={i.item_id}><td className="small">{fmt(i.created_at)}</td><td><span className={`badge ${i.type}`}>{i.type}</span></td><td>{i.name}</td><td>{i.category_name || '—'}</td><td>{i.location}</td><td>{i.status}</td></tr>)}</tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <h3>Reported users ({flagged.length})</h3>
      {flagged.length === 0 && <p className="muted">No users have been reported yet.</p>}
      {flagged.length > 0 && (
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Roll No</th><th>Reports</th><th>Last reported</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {flagged.map(u => (
              <tr key={u.user_id}>
                <td>{u.name}</td><td>{u.email}</td><td>{u.roll_no}</td>
                <td><span className="badge danger">{u.report_count}</span></td>
                <td className="small">{fmt(u.last_reported)}</td>
                <td>{u.blocked ? <span className="badge danger">BLOCKED</span> : <span className="badge status-open">active</span>}</td>
                <td style={{whiteSpace:'nowrap'}}>
                  <button className="btn small" onClick={() => openDetails(u.user_id)}>View details</button>{' '}
                  <BlockBtn u={u} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
