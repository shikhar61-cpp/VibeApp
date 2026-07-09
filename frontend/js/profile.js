// profile.js - Logic for the user profile page
import {
  apiUser, apiUserPosts, apiFollowToggle,
  apiFollowers, apiFollowing, apiUpdateMe,
  apiLogout, getUser, clearToken, clearUser,
} from './api.js';
import { toast, avatarEl, timeAgo, spinner, requireAuth } from './utils.js';

if (!requireAuth()) throw new Error('Not authenticated');

const me = getUser();
const params = new URLSearchParams(window.location.search);
const username = params.get('u') || me?.username;
const isOwnProfile = me?.username === username;

let profileUser = null;

// DOM elements
const profileAvatar    = document.getElementById('profile-avatar');
const profileName      = document.getElementById('profile-name');
const profileHandle    = document.getElementById('profile-handle');
const profileBio       = document.getElementById('profile-bio');
const profileFollowers = document.getElementById('profile-followers');
const profileFollowing = document.getElementById('profile-following');
const profilePosts     = document.getElementById('profile-posts-count');
const followBtn        = document.getElementById('btn-follow');
const editBtn          = document.getElementById('btn-edit-profile');
const postsContainer   = document.getElementById('profile-posts');
const logoutBtn        = document.getElementById('btn-logout');

// Initialization
loadProfile();
setupTabs();
setupLogout();

// Load profile data
async function loadProfile() {
  try {
    profileUser = await apiUser(username);
    renderProfile(profileUser);
    loadUserPosts();
  } catch (err) {
    toast('Failed to load profile', 'error');
  }
}

function renderProfile(user) {
  // Avatar
  if (profileAvatar) {
    profileAvatar.innerHTML = '';
    const av = avatarEl(user, 'avatar-xl profile-avatar-el');
    profileAvatar.appendChild(av);
  }

  if (profileName)      profileName.textContent = (user.first_name && user.last_name)
    ? `${user.first_name} ${user.last_name}` : user.username;
  if (profileHandle)    profileHandle.textContent = '@' + user.username;
  if (profileBio)       profileBio.textContent = user.bio || 'No bio yet.';
  if (profileFollowers) profileFollowers.textContent = user.followers_count;
  if (profileFollowing) profileFollowing.textContent = user.following_count;
  document.title = `@${user.username} – VibeApp`;

  // Follow / Edit button
  if (isOwnProfile) {
    if (editBtn) editBtn.classList.remove('hidden');
    if (followBtn) followBtn.classList.add('hidden');
  } else {
    if (editBtn) editBtn.classList.add('hidden');
    if (followBtn) {
      followBtn.classList.remove('hidden');
      followBtn.textContent = user.is_following ? 'Unfollow' : 'Follow';
      followBtn.className = `btn ${user.is_following ? 'btn-outline' : 'btn-primary'} btn-sm`;
    }
  }
}

// Follow / Unfollow logic
followBtn?.addEventListener('click', async () => {
  followBtn.disabled = true;
  try {
    const res = await apiFollowToggle(username);
    followBtn.textContent = res.following ? 'Unfollow' : 'Follow';
    followBtn.className   = `btn ${res.following ? 'btn-outline' : 'btn-primary'} btn-sm`;
    if (profileFollowers) profileFollowers.textContent = res.followers_count;
    toast(res.following ? `Following @${username} ✨` : `Unfollowed @${username}`, 'success');
  } catch (err) { toast(err.message, 'error'); }
  followBtn.disabled = false;
});

// Load user's posts
async function loadUserPosts() {
  if (!postsContainer) return;
  postsContainer.innerHTML = ''; postsContainer.appendChild(spinner());
  try {
    const posts = await apiUserPosts(username);
    postsContainer.innerHTML = '';
    if (profilePosts) profilePosts.textContent = posts.length;
    if (!posts.length) {
      postsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-title">No posts yet</div><div class="empty-desc">${isOwnProfile ? 'Share your first post!' : `${username} hasn't posted yet.`}</div></div>`;
      return;
    }
    posts.forEach(p => postsContainer.appendChild(buildProfilePost(p)));
  } catch (err) { postsContainer.innerHTML = '<p class="text-muted" style="padding:24px">Failed to load posts.</p>'; }
}

function buildProfilePost(post) {
  const card = document.createElement('div');
  card.className = 'card post-card';
  card.innerHTML = `
    <div class="post-content">${escHtml(post.content)}</div>
    ${post.image ? `<img src="${post.image}" class="post-image" alt="post" loading="lazy">` : ''}
    <div class="post-actions" style="margin-top:12px">
      <span class="post-action-btn ${post.is_liked ? 'liked' : ''}">
        ${post.is_liked ? '❤️' : '🤍'} ${post.likes_count}
      </span>
      <span class="post-action-btn">💬 ${post.comments_count}</span>
      <span class="text-muted text-sm" style="margin-left:auto">${timeAgo(post.created_at)}</span>
    </div>
  `;
  return card;
}

// Switch between Posts, Followers, and Following tabs
function setupTabs() {
  const tabs = document.querySelectorAll('.profile-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      if (target === 'posts') loadUserPosts();
      else if (target === 'followers') loadFollowers();
      else if (target === 'following') loadFollowingList();
    });
  });
}

async function loadFollowers() {
  if (!postsContainer) return;
  postsContainer.innerHTML = ''; postsContainer.appendChild(spinner());
  try {
    const list = await apiFollowers(username);
    postsContainer.innerHTML = '';
    if (!list.length) {
      postsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No followers yet</div></div>`;
      return;
    }
    list.forEach(f => {
      const item = document.createElement('div');
      item.className = 'card suggestion-item';
      item.style.cssText = 'padding:14px 16px;cursor:pointer;';
      item.innerHTML = `
        <div class="avatar avatar-md" style="background:var(--gradient-main);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${(f.follower_username[0]||'?').toUpperCase()}</div>
        <div class="suggestion-info">
          <div class="suggestion-name">${f.follower_username}</div>
          <div class="suggestion-handle">@${f.follower_username}</div>
        </div>
      `;
      item.addEventListener('click', () => window.location.href = `profile.html?u=${f.follower_username}`);
      postsContainer.appendChild(item);
    });
  } catch {}
}

async function loadFollowingList() {
  if (!postsContainer) return;
  postsContainer.innerHTML = ''; postsContainer.appendChild(spinner());
  try {
    const list = await apiFollowing(username);
    postsContainer.innerHTML = '';
    if (!list.length) {
      postsContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-title">Not following anyone</div></div>`;
      return;
    }
    list.forEach(f => {
      const item = document.createElement('div');
      item.className = 'card suggestion-item';
      item.style.cssText = 'padding:14px 16px;cursor:pointer;';
      item.innerHTML = `
        <div class="avatar avatar-md" style="background:var(--gradient-main);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${(f.following_username[0]||'?').toUpperCase()}</div>
        <div class="suggestion-info">
          <div class="suggestion-name">${f.following_username}</div>
          <div class="suggestion-handle">@${f.following_username}</div>
        </div>
      `;
      item.addEventListener('click', () => window.location.href = `profile.html?u=${f.following_username}`);
      postsContainer.appendChild(item);
    });
  } catch {}
}

// Edit profile modal logic
editBtn?.addEventListener('click', () => {
  document.getElementById('edit-modal').classList.add('active');
  document.getElementById('edit-bio').value = profileUser?.bio || '';
  document.getElementById('edit-firstname').value = profileUser?.first_name || '';
  document.getElementById('edit-lastname').value  = profileUser?.last_name  || '';
});
document.getElementById('close-edit-modal')?.addEventListener('click', () => {
  document.getElementById('edit-modal').classList.remove('active');
});
document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const fd = new FormData();
    fd.append('bio',        document.getElementById('edit-bio').value);
    fd.append('first_name', document.getElementById('edit-firstname').value);
    fd.append('last_name',  document.getElementById('edit-lastname').value);
    const avatarFile = document.getElementById('edit-avatar-input').files[0];
    if (avatarFile) fd.append('avatar', avatarFile);
    const updated = await apiUpdateMe(fd);
    // Refresh display
    profileUser = { ...profileUser, ...updated };
    renderProfile(profileUser);
    // Update localStorage
    const stored = getUser();
    localStorage.setItem('vibeapp_user', JSON.stringify({ ...stored, ...updated }));
    document.getElementById('edit-modal').classList.remove('active');
    toast('Profile updated! ✨', 'success');
  } catch (err) { toast(err.message, 'error'); }
  btn.disabled = false; btn.textContent = 'Save Changes';
});

// Handle logout
function setupLogout() {
  logoutBtn?.addEventListener('click', async () => {
    try { await apiLogout(); } catch {}
    clearToken(); clearUser();
    window.location.href = 'index.html';
  });
}

// Utilities
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/\n/g,'<br>');
}
