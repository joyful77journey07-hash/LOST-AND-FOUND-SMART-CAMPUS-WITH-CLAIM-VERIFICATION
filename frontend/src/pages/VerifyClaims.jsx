import { useAuth } from '../session';
import { useEffect, useState } from 'react';
import { get, put } from '../api';
import ReportUserModal from '../components/ReportUserModal';
import ActionModal from '../components/ActionModal';

export default function VerifyClaims() {
  const [claims, setClaims] = useState([]);
  const user = useAuth();
  const [reportTarget, setReportTarget] = useState(null);

  const load = async () => {
    const c = await get('/api/claims');
    setClaims(c.filter(x => x.item_reporter === user.user_id));
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

  return (
    <div>
      {dialog && <ActionModal {...dialog} onClose={() => setDialog(null)} />}
      <h2>Verify Claims</h2>
      <p className="muted">Claims made on items you found. Compare the hidden details with the claimant's answers.</p>
      {claims.length === 0 && <p className="muted">No claims to verify yet.</p>}
      {claims.map(c => (
        <div className="card" key={c.claim_id} style={{marginBottom:14}}>
          <div className="cardbody">
            <h3>{c.item_name}</h3>
            <p className="muted">Claimant: {c.claimant_name} ({c.claimant_email}) · Status: <span className={`badge status-${String(c.status).toLowerCase().replace(/\s+/g,'-')}`}>{c.status}</span></p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:10}}>
              <div className="hiddenbox" style={{margin:0,padding:10}}>
                <b className="hiddenbox-title">Hidden verification (yours)</b>
                <p style={{margin:4,fontSize:'.9rem'}}>{c.hidden_verification || '—'}</p>
              </div>
              <div className="answerbox">
                <b className="answerbox-title">Claimant's answers</b>
                <p style={{margin:4,fontSize:'.9rem'}}><b>Where lost:</b> {c.lost_location}</p>
                <p style={{margin:4,fontSize:'.9rem'}}><b>When:</b> {c.approx_datetime}</p>
                <p style={{margin:4,fontSize:'.9rem'}}><b>Description:</b> {c.claim_description}</p>
                <p style={{margin:4,fontSize:'.9rem'}}><b>Unique features:</b> {c.unique_features}</p>
                <p style={{margin:4,fontSize:'.9rem'}}><b>Extra info:</b> {c.extra_info}</p>
              </div>
            </div>
            <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}>
              <button className="btn small" onClick={() => review(c, 'Under Review')}>Mark Under Review</button>
              <button className="btn small success" onClick={() => review(c, 'Approved')}>Approve</button>
              <button className="btn small danger" onClick={() => review(c, 'Rejected')}>Reject</button>
              {c.status === 'Approved' && <button className="btn small" onClick={() => resolve(c)}>Resolve / Return</button>}
              <button className="btn small outline" style={{marginLeft:'auto'}} title="Report this claimant to the admin" onClick={() => setReportTarget({ user: { user_id: c.claimant_id, name: c.claimant_name, email: c.claimant_email }, claimId: c.claim_id, itemId: c.item_id })}>Report claimant</button>
            </div>
            {c.remarks && <p className="muted small" style={{marginTop:6}}>Remarks: {c.remarks}</p>}
          </div>
        </div>
      ))}
      {reportTarget && <ReportUserModal target={reportTarget.user} claimId={reportTarget.claimId} itemId={reportTarget.itemId} onClose={() => setReportTarget(null)} />}
    </div>
  );
}
