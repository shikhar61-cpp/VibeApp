// utils.js - Shared helpers used across all pages

// Show a toast notification at the top-right corner
export function toast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// Build an avatar element from a user object
export function avatarEl(user, size = '') {
  const div = document.createElement('div');
  div.className = `avatar ${size}`.trim();
  if (user?.avatar) {
    const img = document.createElement('img');
    img.src = user.avatar;
    img.alt = user.username;
    div.appendChild(img);
  } else {
    div.textContent = (user?.username?.[0] || '?').toUpperCase();
  }
  return div;
}

// Convert an ISO date string to a human-readable "time ago" format
export function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Create a loading spinner element
export function spinner() {
  const wrap = document.createElement('div');
  wrap.className = 'loader-wrap';
  const s = document.createElement('div');
  s.className = 'spinner';
  wrap.appendChild(s);
  return wrap;
}

// Redirect to login page if user is not authenticated
export function requireAuth() {
  if (!localStorage.getItem('vibeapp_token')) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}
