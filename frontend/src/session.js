// Session store that works even when the browser blocks localStorage
// (e.g. when the app is embedded in a preview iframe). Falls back to
// sessionStorage, then to in-memory storage. Emits 'authchange' so React
// components re-render without a full page reload.
import { useEffect, useState } from 'react';

const memory = {};
function pickStorage() {
  for (const s of [() => window.localStorage, () => window.sessionStorage]) {
    try { const st = s(); st.setItem('__t', '1'); st.removeItem('__t'); return st; } catch (_) {}
  }
  return { getItem: k => (k in memory ? memory[k] : null), setItem: (k, v) => { memory[k] = String(v); }, removeItem: k => { delete memory[k]; } };
}
const store = pickStorage();


export function getToken() { return store.getItem('token'); }
export function getUser() { try { return JSON.parse(store.getItem('user') || 'null'); } catch { return null; } }
export function setSession(token, user) {
  store.setItem('token', token); store.setItem('user', JSON.stringify(user));
  memory.token = token; memory.user = JSON.stringify(user);
  window.dispatchEvent(new Event('authchange'));
}
export function clearSession() {
  store.removeItem('token'); store.removeItem('user');
  delete memory.token; delete memory.user;
  window.dispatchEvent(new Event('authchange'));
}
export function useAuth() {
  const [user, setUser] = useState(getUser());
  useEffect(() => {
    const h = () => setUser(getUser());
    window.addEventListener('authchange', h);
    return () => window.removeEventListener('authchange', h);
  }, []);
  return user;
}
