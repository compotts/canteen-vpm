import { API_BASE, AUTH_TOKEN_STORAGE_KEY } from '../constants.js';

export function getAccessToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}
export function setAccessToken(token) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}
export function clearAccessToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

async function request(path, options = {}) {
  const { json, ...init } = options;
  const headers = { ...(init.headers || {}) };
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  const token = getAccessToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, {
    ...init,
    headers,
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });

  if (res.status === 401 || res.status === 403) {
    clearAccessToken();
    window.dispatchEvent(new Event('auth:logout'));
    const err = new Error(res.status === 401 ? 'Неверный логин или пароль' : 'Доступ запрещён');
    err.status = res.status;
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text);
      if (j.message) msg = j.message;
    } catch (_) {}
    const err = new Error(msg || 'Ошибка ' + res.status);
    err.status = res.status;
    throw err;
  }
  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }
  return undefined;
}

export const api = {
  login(login, password) {
    return request('/api/auth/login', { method: 'POST', json: { login, password } });
  },
  getMenuToday() {
    return request('/api/menu/today');
  },
  submitOrder(date, items) {
    return request('/api/order', { method: 'POST', json: { date, items } });
  },
};
