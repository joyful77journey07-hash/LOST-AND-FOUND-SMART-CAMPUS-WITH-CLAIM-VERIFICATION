import { useEffect, useState } from 'react';
import { get } from '../api';
import ItemCard from '../components/ItemCard';

const EMPTY = { keyword: '', type: '', category: '', location: '', dateFrom: '', dateTo: '' };

export default function Search() {
  const [filters, setFilters] = useState(EMPTY);
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { get('/api/categories').then(setCats).catch(() => {}); }, []);

  const search = async (f = filters) => {
    setLoading(true);
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) q.append(k, v); });
    try { setItems(await get('/api/items?' + q.toString())); } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { search(); }, []);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const reset = () => { setFilters(EMPTY); search(EMPTY); };
  const onKey = (e) => { if (e.key === 'Enter') search(); };

  const typeLabel = filters.type === 'lost' ? 'lost item reports' : filters.type === 'found' ? 'found item reports' : 'lost & found reports';

  return (
    <div>
      <h2>Search &amp; Filter</h2>
      <p className="muted" style={{marginTop:-6}}>Find items that other students have reported. Choose what you're looking for, then narrow down by category, place and date.</p>

      {/* Step 1: what are you looking for */}
      <div className="typetabs">
        <button className={'typetab' + (filters.type === '' ? ' active' : '')} onClick={() => setFilters({ ...filters, type: '' })}>All reports</button>
        <button className={'typetab lost' + (filters.type === 'found' ? ' active' : '')} onClick={() => setFilters({ ...filters, type: 'found' })}>
          I lost something <small>show items others FOUND</small>
        </button>
        <button className={'typetab found' + (filters.type === 'lost' ? ' active' : '')} onClick={() => setFilters({ ...filters, type: 'lost' })}>
          I found something <small>show items others LOST</small>
        </button>
      </div>

      <div className="filters filters-grid" onKeyDown={onKey}>
        <label className="field">
          <span>Keyword</span>
          <input placeholder="e.g. wallet, blue bag, ID card" value={filters.keyword} onChange={set('keyword')} />
        </label>
        <label className="field">
          <span>Report type</span>
          <select value={filters.type} onChange={set('type')}>
            <option value="">All reports (lost + found)</option>
            <option value="found">Found items (someone found it)</option>
            <option value="lost">Lost items (someone lost it)</option>
          </select>
        </label>
        <label className="field">
          <span>Category</span>
          <select value={filters.category} onChange={set('category')}>
            <option value="">All categories</option>
            {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Location</span>
          <input placeholder="e.g. Library, Canteen, Block B" value={filters.location} onChange={set('location')} />
        </label>
        <label className="field">
          <span>From date <em>(on or after)</em></span>
          <input type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={set('dateFrom')} />
        </label>
        <label className="field">
          <span>To date <em>(on or before)</em></span>
          <input type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={set('dateTo')} />
        </label>
        <div className="field actions">
          <span>&nbsp;</span>
          <div style={{display:'flex',gap:8}}>
            <button className="btn" onClick={() => search()}>Search</button>
            <button className="btn outline" onClick={reset}>Reset</button>
          </div>
        </div>
        <p className="muted small" style={{gridColumn:'1 / -1',margin:'2px 0 0'}}>
          Date fields are optional. Leave both empty to see all dates, fill only "from" to see everything since that day, or fill both to pick a range.
        </p>
      </div>

      <p className="muted small" style={{marginBottom:12}}>
        {loading ? 'Searching…' : <>Showing <b>{items.length}</b> {typeLabel}{filters.dateFrom || filters.dateTo ? ` between ${filters.dateFrom || 'any date'} and ${filters.dateTo || 'today'}` : ''}.</>}
      </p>
      <div className="grid">
        {items.map(i => <ItemCard key={i.item_id} item={i} />)}
      </div>
      {!loading && items.length === 0 && (
        <div className="empty">
          <svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="#1e293b"/></svg>
          <p>No items match your filters. Try different criteria or <button className="linkbtn" onClick={reset}>reset the filters</button>.</p>
        </div>
      )}
    </div>
  );
}
