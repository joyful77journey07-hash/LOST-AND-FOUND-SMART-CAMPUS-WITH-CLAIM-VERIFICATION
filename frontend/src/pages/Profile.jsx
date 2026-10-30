import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, put } from '../api';
import { getToken, setSession, clearSession } from '../session';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', roll_no: '', contact: '', password: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    get('/api/auth/me').then(u => {
      if (!u || !u.user_id) throw new Error('Session expired. Please login again.');
      setUser(u);
      setForm({ name: u.name || '', roll_no: u.roll_no || '', contact: u.contact || '', password: '' });
      setPreview(u.photo_path || null);
      setLoading(false);
    }).catch(e => {
      setErr(e.message);
      setLoading(false);
      clearSession();
      setTimeout(() => navigate('/login'), 1500);
    });
  }, []);

  const onFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('roll_no', form.roll_no);
    fd.append('contact', form.contact);
    if (form.password) fd.append('password', form.password);
    if (file) fd.append('photo', file);
    try {
      const data = await put('/api/auth/profile', fd);
      setSession(data.token, data.user);
      setMsg('Profile updated successfully!');
      setUser(data.user);
    } catch (e) { setErr(e.message); }
  };

  if (loading) return <div className="spinner"></div>;
  if (!user) return <div className="formbox" style={{maxWidth:560}}><h2>My Profile</h2><p className="error">{err || 'Could not load profile.'}</p><p className="muted small">Redirecting to login...</p></div>;

  return (
    <div className="formbox" style={{maxWidth:560}}>
      <h2>My Profile</h2>
      {msg && <p className="muted">{msg}</p>}
      {err && <p className="error">{err}</p>}
      <div style={{textAlign:'center',marginBottom:16}}>
        {preview
          ? <img src={preview.startsWith('blob:') ? preview : preview} alt="profile" style={{width:110,height:110,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--fg)'}} />
          : <div style={{width:110,height:110,borderRadius:'50%',background:'var(--card2)',border:'1px solid var(--border)',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--fg)',fontSize:'2.5rem'}}>{(user.name||'?')[0].toUpperCase()}</div>
        }
      </div>
      <form onSubmit={submit}>
        <input placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input placeholder="University Roll No." value={form.roll_no} onChange={e=>setForm({...form,roll_no:e.target.value})} />
        <input placeholder="Contact Number" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} />
        <input placeholder="New Password (leave blank to keep)" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <label className="muted small">Change profile photo (optional)</label>
        <input type="file" accept="image/*" onChange={onFile} />
        <button className="btn" type="submit">Save Changes</button>
      </form>
    </div>
  );
}
