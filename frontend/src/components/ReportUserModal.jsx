import { useState } from 'react';
import { post } from '../api';

/** Small modal to report a user (e.g. a suspicious claimant) with a description. */
export default function ReportUserModal({ target, claimId, itemId, onClose, onDone }) {
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!target) return null;
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (desc.trim().length < 10) { setErr('Please describe the problem in at least 10 characters.'); return; }
    setBusy(true);
    try {
      await post('/api/reports', { reported_user_id: target.user_id, claim_id: claimId || null, item_id: itemId || null, description: desc.trim() });
      onDone && onDone();
      setDone(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {done ? (
          <>
            <h3 style={{marginTop:0}}>Report submitted</h3>
            <p className="muted">Thank you. The admin will review your report about <b>{target.name}</b> on the Flagged Users page.</p>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}><button className="btn small" onClick={onClose}>Close</button></div>
          </>
        ) : (<>
        <h3 style={{marginTop:0}}>Report user</h3>
        <p className="muted small">You are reporting <b>{target.name}</b> ({target.email}). Explain why you think this person is making a false or suspicious claim. The admin will see your description.</p>
        {err && <p className="error">{err}</p>}
        <form onSubmit={submit}>
          <textarea rows={5} placeholder="Describe what happened (e.g. answers do not match the hidden details, claimed multiple unrelated items, abusive messages...)" value={desc} onChange={e => setDesc(e.target.value)} required style={{width:'100%'}} />
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:10}}>
            <button type="button" className="btn small outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn small danger" disabled={busy}>{busy ? 'Submitting…' : 'Submit report'}</button>
          </div>
        </form>
        </>)}
      </div>
    </div>
  );
}
