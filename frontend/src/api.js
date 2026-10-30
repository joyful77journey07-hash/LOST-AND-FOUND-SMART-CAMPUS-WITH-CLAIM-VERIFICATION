const BASE = '';
import { getToken, clearSession } from './session';
export { getToken };
export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) { headers['Authorization'] = 'Bearer ' + token; headers['X-Auth-Token'] = token; }
  if (!(options.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  const res = await fetch(BASE + path, { ...options, headers });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (res.status === 401 && token) {
    clearSession();
    if (!location.pathname.startsWith('/login')) { alert('Your session has expired. Please login again.'); window.history.pushState({}, '', '/login'); window.dispatchEvent(new PopStateEvent('popstate')); }
  }
  if (res.status === 403 && data && typeof data.error === 'string' && data.error.startsWith('BLOCKED') && token) {
    clearSession();
    alert(data.error.replace('BLOCKED: ', ''));
    window.history.pushState({}, '', '/login'); window.dispatchEvent(new PopStateEvent('popstate'));
  }
  if (!res.ok) throw new Error((data && String(data.error).replace('BLOCKED: ', '')) || res.statusText);
  return data;
}
export const get = (p) => api(p);
export const post = (p, b) => api(p, { method: 'POST', body: b instanceof FormData ? b : JSON.stringify(b) });
export const put = (p, b) => {
  if (b instanceof FormData) {
    const headers = { 'Authorization': 'Bearer ' + getToken(), 'X-Auth-Token': getToken() };
    return fetch(BASE + p, { method: 'PUT', headers, body: b }).then(async r => {
      const t = await r.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch { d = t; }
      if (!r.ok) throw new Error((d && d.error) || r.statusText);
      return d;
    });
  }
  return api(p, { method: 'PUT', body: JSON.stringify(b) });
};
export const del = (p) => api(p, { method: 'DELETE' });
