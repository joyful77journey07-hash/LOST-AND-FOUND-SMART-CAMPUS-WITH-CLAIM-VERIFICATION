import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../api';
import { setSession } from '../session';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await post('/api/auth/login', form);
      setSession(data.token, data.user);
      navigate('/');
    } catch (e) { setErr(e.message); }
  };
  return (
    <div className="authbox">
      <h2>Login</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={submit}>
        <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
        <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
        <button className="btn" type="submit">Login</button>
      </form>
      <p className="muted">No account? <Link to="/register">Register</Link></p>
    </div>
  );
}
