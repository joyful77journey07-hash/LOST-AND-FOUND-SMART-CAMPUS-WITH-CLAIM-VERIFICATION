import { setSession } from '../session';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', roll_no: '', password: '', contact: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const onFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };
  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    if (file) fd.append('photo', file);
    try {
      const data = await post('/api/auth/register', fd);
      setSession(data.token, data.user);
      navigate('/');
    } catch (e) { setErr(e.message); }
  };
  return (
    <div className="authbox">
      <h2>Register</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={submit}>
        <input placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
        <input placeholder="University Roll No." value={form.roll_no} onChange={e=>setForm({...form,roll_no:e.target.value})} />
        <input placeholder="Contact Number" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} />
        <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
        <label className="muted small">Profile photo (optional)</label>
        <input type="file" accept="image/*" onChange={onFile} />
        {preview && <img src={preview} alt="preview" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',margin:'8px auto',display:'block'}} />}
        <button className="btn" type="submit">Register</button>
      </form>
      <p className="muted">Have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
