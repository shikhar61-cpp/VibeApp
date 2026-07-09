// api.js - Handles all API calls to the VibeApp backend
// Token is stored in localStorage to persist sessions across page refreshes

const BASE_URL = 'http://127.0.0.1:8000/api';

// Token helpers
export function getToken() { return localStorage.getItem('vibeapp_token'); }
export function setToken(t) { localStorage.setItem('vibeapp_token', t); }
export function clearToken() { localStorage.removeItem('vibeapp_token'); }

export function getUser() {
  try { return JSON.parse(localStorage.getItem('vibeapp_user')); }
  catch { return null; }
}
export function setUser(u) { localStorage.setItem('vibeapp_user', JSON.stringify(u)); }
export function clearUser() { localStorage.removeItem('vibeapp_user'); }

export function isLoggedIn() { return !!getToken(); }

// Core fetch wrapper - handles auth headers and error parsing
async function request(path, { method = 'GET', body, isFormData = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Token ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const msg =
      data?.detail ||
      data?.non_field_errors?.[0] ||
      Object.values(data).flat()[0] ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// Auth
export async function apiRegister(payload) {
  return request('/auth/register/', { method: 'POST', body: payload });
}
export async function apiLogin(username, password) {
  return request('/auth/login/', { method: 'POST', body: { username, password } });
}
export async function apiLogout() {
  return request('/auth/logout/', { method: 'POST' });
}

// Users
export async function apiMe() { return request('/users/me/'); }
export async function apiUpdateMe(formData) {
  return request('/users/me/', { method: 'PATCH', body: formData, isFormData: true });
}
export async function apiUser(username) { return request(`/users/${username}/`); }
export async function apiFollowToggle(username) {
  return request(`/users/${username}/follow/`, { method: 'POST' });
}
export async function apiFollowers(username) { return request(`/users/${username}/followers/`); }
export async function apiFollowing(username) { return request(`/users/${username}/following/`); }
export async function apiSearchUsers(q) {
  return request(`/users/search/?q=${encodeURIComponent(q)}`);
}

// Posts
export async function apiFeed() { return request('/posts/'); }
export async function apiExplore() { return request('/posts/explore/'); }
export async function apiUserPosts(username) { return request(`/users/${username}/posts/`); }
export async function apiCreatePost(formData) {
  return request('/posts/', { method: 'POST', body: formData, isFormData: true });
}
export async function apiDeletePost(id) {
  return request(`/posts/${id}/`, { method: 'DELETE' });
}
export async function apiLikeToggle(id) {
  return request(`/posts/${id}/like/`, { method: 'POST' });
}

// Comments
export async function apiGetComments(postId) { return request(`/posts/${postId}/comments/`); }
export async function apiAddComment(postId, content) {
  return request(`/posts/${postId}/comments/`, { method: 'POST', body: { content } });
}
export async function apiDeleteComment(commentId) {
  return request(`/comments/${commentId}/`, { method: 'DELETE' });
}
