import { getToken } from '../session';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, put, del, post } from '../api';
import ActionModal from '../components/ActionModal';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [users, setUsers] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [err, setErr] = useState('');
  const load = async () => {
    setErr('');
    const [st, cl, it, ca, us] = await Promise.allSettled([
      get('/api/admin/stats'), get('/api/claims'), get('/api/items'), get('/api/categories'), get('/api/admin/users')
    ]);
    if (st.status === 'fulfilled') setStats(st.value);
    if (cl.status === 'fulfilled') setClaims(cl.value || []);
    if (it.status === 'fulfilled') setItems(it.value || []);
    if (ca.status === 'fulfilled') setCats(ca.value || []);
    if (us.status === 'fulfilled') setUsers(us.value || []);
    const failed = [st, cl, it, ca, us].filter(r => r.status === 'rejected');
    if (failed.length) setErr('Could not load some data: ' + failed.map(f => f.reason.message).join('; '));
  };
  useEffect(() => { load(); }, []);
  const [dialog, setDialog] = useState(null);
  const VERB = { 'Under Review': 'Mark Under Review', Approved: 'Approve', Rejected: 'Reject' };
  const review = (c, status) => setDialog({
    title: (status === 'Under Review' ? 'Mark this claim as Under Review?' : VERB[status] + ' this claim?'),
    message: `Claim by ${c.claimant_name || 'the claimant'} on "${c.item_name}". ` + (status === 'Approved' ? 'Approving marks the item as claimed.' : status === 'Rejected' ? 'The item is reopened if no other claims are pending.' : 'Marks the claim as being checked.'),
    withInput: true, inputLabel: 'Remarks (optional)', placeholder: 'e.g. Details matched the hidden mark / Answers did not match',
    confirmText: VERB[status], danger: status === 'Rejected',
    onConfirm: async (remarks) => { await put('/api/claims/' + c.claim_id + '/review', { status, remarks }); await load(); }
  });
  const resolve = (c) => setDialog({
    title: 'Mark as returned?',
    message: `Confirm that "${c.item_name}" has been handed over to ${c.claimant_name || 'the claimant'}. The claim becomes Resolved and the item Returned.`,
    confirmText: 'Yes, returned',
    onConfirm: async () => { await put('/api/claims/' + c.claim_id + '/resolve', {}); await load(); }
  });
  const removeItem = (i) => setDialog({
    title: 'Delete item?', message: `"${i.name}" and all its claims will be permanently deleted.`, confirmText: 'Delete', danger: true,
    onConfirm: async () => { await del('/api/items/' + i.item_id); await load(); }
  });
  const addCat = async () => {
    if (!newCat) return;
    await post_cat(newCat); setNewCat(''); load();
  };
  // helper
  const post_cat = async (name) => { try { await post('/api/categories', { category_name: name }); } catch (e) { setErr(e.message); } };
  const removeCat = (c) => setDialog({
    title: 'Delete category?', message: `"${c.category_name}" will be removed. Items in it become Uncategorized.`, confirmText: 'Delete', danger: true,
    onConfirm: async () => { await del('/api/categories/' + c.category_id); await load(); }
  });
  const toggleBlock = (u) => {
    const blocking = !u.blocked;
    setDialog(blocking ? {
      title: 'Block ' + u.name + '?', message: 'The user will be logged out immediately and cannot log in, report or claim until unblocked.',
      withInput: true, inputLabel: 'Reason (shown to the user)', defaultValue: 'Repeated false claims', confirmText: 'Block user', danger: true,
      onConfirm: async (reason) => { await put('/api/admin/users/' + u.user_id + '/block', { blocked: true, reason }); await load(); }
    } : {
      title: 'Unblock ' + u.name + '?', message: 'The user will be able to log in and use the system again.', confirmText: 'Unblock',
      onConfirm: async () => { await put('/api/admin/users/' + u.user_id + '/block', { blocked: false, reason: '' }); await load(); }
    });
  };
  const removeUser = (u) => setDialog({
    title: 'Delete user?', message: `${u.name} (${u.email}) and all their items, claims and reports will be permanently deleted.`, confirmText: 'Delete user', danger: true,
    onConfirm: async () => { await del('/api/admin/users/' + u.user_id); await load(); }
  });

  return (
    <div>
      {dialog && <ActionModal {...dialog} onClose={() => setDialog(null)} />}
      <h2>Admin Dashboard</h2>
      {err && <p className="error">{err}</p>}
      {stats && (
        <div className="stats">
          <div className="stat"><b>{stats.users}</b><span>Users</span></div>
          <div className="stat"><b>{stats.items}</b><span>Items</span></div>
          <div className="stat"><b>{stats.lost}</b><span>Lost</span></div>
          <div className="stat"><b>{stats.found}</b><span>Found</span></div>
          <div className="stat"><b>{stats.claims}</b><span>Claims</span></div>
          <div className="stat"><b>{stats.pending}</b><span>Pending</span></div>
          <div className="stat"><b>{stats.returned}</b><span>Returned</span></div>
          <Link to="/admin/flagged" className="stat"><b>{stats.flagged}</b><span>Flagged users</span></Link>
          <div className="stat"><b>{stats.blocked}</b><span>Blocked</span></div>
        </div>
      )}

      <h3>Claims ({claims.length})</h3>
      {claims.length === 0 && <p className="muted">No claims submitted yet.</p>}
      <table className="table">
        <thead><tr><th>Item</th><th>Claimant</th><th>Status</th><th>Hidden details</th><th>Claimant answers</th><th>Actions</th></tr></thead>
        <tbody>
          {claims.map(c => (
            <tr key={c.claim_id}>
              <td>{c.item_name}</td>
              <td>{c.claimant_name}</td>
              <td><span className={`badge status-${String(c.status).toLowerCase().replace(/\s+/g,'-')}`}>{c.status}</span></td>
              <td className="small">{c.hidden_verification}</td>
              <td className="small">
                <b>Where lost:</b> {c.lost_location}<br/>
                <b>When:</b> {c.approx_datetime}<br/>
                <b>Desc:</b> {c.claim_description}<br/>
                <b>Unique:</b> {c.unique_features}<br/>
                <b>Extra:</b> {c.extra_info}
              </td>
              <td>
                <button className="btn small" onClick={() => review(c, 'Under Review')}>Review</button>
                <button className="btn small success" onClick={() => review(c, 'Approved')}>Approve</button>
                <button className="btn small danger" onClick={() => review(c, 'Rejected')}>Reject</button>
                {c.status === 'Approved' && <button className="btn small" onClick={() => resolve(c)}>Resolve/Return</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Categories</h3>
      <div className="row">
        <input placeholder="New category" value={newCat} onChange={e=>setNewCat(e.target.value)} />
        <button className="btn small" onClick={addCat}>Add</button>
      </div>
      <ul>
        {cats.map(c => <li key={c.category_id}>{c.category_name} <button className="linkbtn danger" onClick={()=>removeCat(c)}>delete</button></li>)}
      </ul>

      <h3>Items ({items.length})</h3>
      <table className="table">
        <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i.item_id}>
              <td>{i.name}</td><td>{i.type}</td><td>{i.status}</td>
              <td><button className="btn small danger" onClick={()=>removeItem(i)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Users ({users.length})</h3>
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.user_id}>
              <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td>
              <td>{u.blocked ? <span className="badge danger" title={u.blocked_reason||''}>BLOCKED</span> : <span className="badge status-open">active</span>}</td>
              <td style={{whiteSpace:'nowrap'}}>
                {u.role !== 'admin' && <button className={'btn small ' + (u.blocked ? 'success' : '')} onClick={()=>toggleBlock(u)}>{u.blocked ? 'Unblock' : 'Block'}</button>}{' '}
                {u.role !== 'admin' && <button className="btn small danger" onClick={()=>removeUser(u)}>Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
