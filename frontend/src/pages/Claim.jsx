import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get, post } from '../api';

export default function Claim() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [form, setForm] = useState({ lost_location: '', approx_datetime: '', claim_description: '', unique_features: '', extra_info: '' });
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  useEffect(() => { get('/api/items/' + id).then(setItem); }, [id]);
  const submit = async (e) => {
    e.preventDefault();
    try {
      await post('/api/claims', { item_id: Number(id), ...form });
      navigate('/my');
    } catch (e) { setErr(e.message); }
  };
  return (
    <div className="formbox">
      <h2>Claim Item: {item?.name}</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={submit}>
        <input placeholder="Where did you lose it?" value={form.lost_location} onChange={e=>setForm({...form,lost_location:e.target.value})} required />
        <input placeholder="Approx date & time" value={form.approx_datetime} onChange={e=>setForm({...form,approx_datetime:e.target.value})} />
        <textarea placeholder="Description as you remember" value={form.claim_description} onChange={e=>setForm({...form,claim_description:e.target.value})} required />
        <textarea placeholder="Unique identifying features" value={form.unique_features} onChange={e=>setForm({...form,unique_features:e.target.value})} />
        <textarea placeholder="Additional ownership info" value={form.extra_info} onChange={e=>setForm({...form,extra_info:e.target.value})} />
        <button className="btn" type="submit">Submit Claim</button>
      </form>
    </div>
  );
}
