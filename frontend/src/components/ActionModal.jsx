import { useState } from 'react';

/**
 * In-app replacement for window.prompt / window.confirm.
 * props: title, message, withInput, inputLabel, placeholder, defaultValue,
 *        confirmText, danger, onConfirm(value), onClose
 */
export default function ActionModal({ title, message, withInput, inputLabel, placeholder, defaultValue = '', confirmText = 'Confirm', danger, onConfirm, onClose }) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await onConfirm(value); onClose(); }
    catch (ex) { setErr(ex.message || 'Something went wrong'); }
    setBusy(false);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 style={{marginTop:0}}>{title}</h3>
        {message && <p className="muted">{message}</p>}
        {err && <p className="error">{err}</p>}
        <form onSubmit={submit}>
          {withInput && (
            <label className="field" style={{display:'block'}}>
              {inputLabel && <span className="muted small" style={{display:'block',marginBottom:4}}>{inputLabel}</span>}
              <textarea rows={3} placeholder={placeholder} value={value} onChange={e => setValue(e.target.value)} autoFocus />
            </label>
          )}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
            <button type="button" className="btn small outline" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className={'btn small ' + (danger ? 'danger' : 'success')} disabled={busy}>{busy ? 'Please wait…' : confirmText}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
