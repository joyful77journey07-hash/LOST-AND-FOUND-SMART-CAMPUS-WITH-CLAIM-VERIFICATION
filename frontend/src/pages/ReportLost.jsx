import { getToken } from '../session';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../api';

export default function ReportLost() {
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ type: 'lost', name: '', category_id: '', description: '', location: '', item_date: '', contact_info: '' });
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  useEffect(() => { get('/api/categories').then(setCats); }, []);
  const submit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { setErr('You are not logged in. Please login first.'); navigate('/login'); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    if (file) fd.append('image', file);
    try {
      const data = await post('/api/items', fd);
      navigate('/items/' + data.item_id);
    } catch (e) { setErr(e.message); }
  };
  return (
    <div className="formbox">
      <h2>Report Lost Item</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={submit}>
        <input placeholder="Item name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}>
          <option value="">Category</option>
          {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
        </select>
        <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <input placeholder="Location where lost" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
        <input type="date" value={form.item_date} onChange={e=>setForm({...form,item_date:e.target.value})} />
        <input placeholder="Contact info" value={form.contact_info} onChange={e=>setForm({...form,contact_info:e.target.value})} />
        <label className="muted small">Photo (optional)</label>
        <input type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])} />
        <button className="btn" type="submit">Submit</button>
      </form>
    </div>
  );
}
