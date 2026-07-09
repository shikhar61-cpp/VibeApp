// feed.js - Core logic for the home feed page
import {
  apiFeed, apiExplore, apiCreatePost, apiLikeToggle,
  apiGetComments, apiAddComment, apiDeletePost,
  apiFollowToggle, apiSearchUsers, apiLogout,
  getUser, clearToken, clearUser,
} from './api.js';
import { toast, avatarEl, timeAgo, spinner, requireAuth } from './utils.js';

if (!requireAuth()) throw new Error('Not authenticated');

const me = getUser();
let currentTab = 'feed';
let posts = [];

// DOM elements
const feedEl       = document.getElementById('feed-posts');
const tabFeed      = document.getElementById('tab-feed');
const tabExplore   = document.getElementById('tab-explore');
const postContent  = document.getElementById('post-content');
const postForm     = document.getElementById('create-post-form');
const postImageIn  = document.getElementById('post-image-input');
const imagePreview = document.getElementById('image-preview');
const searchInput  = document.getElementById('search-input');
const searchDrop   = document.getElementById('search-dropdown');
const logoutBtn    = document.getElementById('btn-logout');
const navProfile   = document.getElementById('nav-profile');
const sidebarUser  = document.getElementById('sidebar-user');

// Initialization
initSidebar();
loadFeed();
loadSuggestions();

// Set up the sidebar user info
function initSidebar() {
  if (!sidebarUser || !me) return;
  const av = avatarEl(me, 'avatar-sm');
  sidebarUser.querySelector('.avatar-slot').replaceWith(av);
  sidebarUser.querySelector('.sidebar-user-name').textContent =
    me.first_name ? `${me.first_name} ${me.last_name}`.trim() : me.username;
  sidebarUser.querySelector('.sidebar-user-handle').textContent = '@' + me.username;
}

// Handle tab switching between For You and Explore
tabFeed.addEventListener('click', () => {
  currentTab = 'feed';
  tabFeed.classList.add('active'); tabExplore.classList.remove('active');
  loadFeed();
});
tabExplore.addEventListener('click', () => {
  currentTab = 'explore';
  tabExplore.classList.add('active'); tabFeed.classList.remove('active');
  loadExplore();
});

// Fetch and display posts
async function loadFeed() {
  feedEl.innerHTML = ''; feedEl.appendChild(spinner());
  try {
    posts = await apiFeed();
    renderPosts(posts);
  } catch (e) { feedEl.innerHTML = emptyState('📭', 'Your feed is empty', 'Follow people to see their posts here.'); }
}

async function loadExplore() {
  feedEl.innerHTML = ''; feedEl.appendChild(spinner());
  try {
    posts = await apiExplore();
    renderPosts(posts);
  } catch (e) { feedEl.innerHTML = emptyState('🔍', 'Nothing here yet', 'Be the first to post!'); }
}

function renderPosts(list) {
  feedEl.innerHTML = '';
  if (!list.length) {
    feedEl.innerHTML = emptyState('📭', 'No posts yet', 'Create the first post!');
    return;
  }
  list.forEach(p => feedEl.appendChild(buildPostCard(p)));
}

// Build a post card element
function buildPostCard(post) {
  const card = document.createElement('div');
  card.className = 'card post-card';
  card.dataset.id = post.id;

  const isOwn = me && post.author.username === me.username;
  const avatar = avatarEl(post.author, 'avatar-md');
  avatar.style.cursor = 'pointer';
  avatar.onclick = () => window.location.href = `profile.html?u=${post.author.username}`;

  card.innerHTML = `
    <div class="post-header">
      <div class="avatar-slot-ph"></div>
      <div class="post-author-info">
        <div class="post-author-name" data-username="${post.author.username}">${post.author.first_name || post.author.username}</div>
        <div class="post-author-handle text-muted text-sm">@${post.author.username} · <span class="post-time">${timeAgo(post.created_at)}</span></div>
      </div>
      ${isOwn ? `<button class="btn btn-sm btn-danger post-delete-btn" data-id="${post.id}">🗑</button>` : ''}
    </div>
    <div class="post-content">${escHtml(post.content)}</div>
    ${post.image ? `<img src="${post.image}" class="post-image" alt="post image" loading="lazy">` : ''}
    <div class="post-actions">
      <button class="post-action-btn like-btn ${post.is_liked ? 'liked' : ''}" data-id="${post.id}">
        <span class="heart-icon">${post.is_liked ? '❤️' : '🤍'}</span>
        <span class="like-count">${post.likes_count}</span>
      </button>
      <button class="post-action-btn comment-toggle-btn" data-id="${post.id}">
        💬 <span>${post.comments_count}</span>
      </button>
    </div>
    <div class="comments-section hidden" id="comments-${post.id}">
      <div class="comments-list"></div>
      <div class="comment-input-row mt-8">
        <textarea class="input-field comment-input" placeholder="Write a comment…" rows="1"></textarea>
        <button class="btn btn-primary btn-sm comment-submit-btn" data-id="${post.id}">Send</button>
      </div>
    </div>
  `;

  // Replace avatar placeholder
  card.querySelector('.avatar-slot-ph').replaceWith(avatar);

  // Author name click → profile
  card.querySelector('.post-author-name').addEventListener('click', () => {
    window.location.href = `profile.html?u=${post.author.username}`;
  });

  // Like
  card.querySelector('.like-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const res = await apiLikeToggle(post.id);
      btn.classList.toggle('liked', res.liked);
      btn.querySelector('.heart-icon').textContent = res.liked ? '❤️' : '🤍';
      btn.querySelector('.like-count').textContent = res.likes_count;
      if (res.liked) btn.classList.add('liked');
    } catch (err) { toast(err.message, 'error'); }
    btn.disabled = false;
  });

  // Toggle comments
  card.querySelector('.comment-toggle-btn').addEventListener('click', () => toggleComments(post.id, card));

  // Delete
  if (isOwn) {
    card.querySelector('.post-delete-btn').addEventListener('click', async () => {
      if (!confirm('Delete this post?')) return;
      try {
        await apiDeletePost(post.id);
        card.remove();
        toast('Post deleted', 'success');
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  // Comment submit
  card.querySelector('.comment-submit-btn').addEventListener('click', () => submitComment(post.id, card));
  card.querySelector('.comment-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(post.id, card); }
  });

  return card;
}

// Comments handling
async function toggleComments(postId, card) {
  const section = card.querySelector(`#comments-${postId}`);
  const isHidden = section.classList.contains('hidden');

  if (isHidden) {
    section.classList.remove('hidden');
    await loadComments(postId, card);
  } else {
    section.classList.add('hidden');
  }
}

async function loadComments(postId, card) {
  const list = card.querySelector('.comments-list');
  list.innerHTML = '<div class="loader-wrap" style="padding:16px"><div class="spinner"></div></div>';
  try {
    const comments = await apiGetComments(postId);
    list.innerHTML = '';
    if (!comments.length) {
      list.innerHTML = '<p class="text-muted text-sm" style="padding:8px 0">No comments yet. Be the first!</p>';
      return;
    }
    comments.forEach(c => list.appendChild(buildComment(c)));
  } catch (err) { list.innerHTML = '<p class="text-muted text-sm">Failed to load comments.</p>'; }
}

function buildComment(c) {
  const el = document.createElement('div');
  el.className = 'comment-item';
  const av = avatarEl(c.author, 'avatar-sm');
  el.appendChild(av);
  const body = document.createElement('div');
  body.className = 'comment-body';
  body.innerHTML = `
    <div class="comment-author">${escHtml(c.author.first_name || c.author.username)}</div>
    <div class="comment-text">${escHtml(c.content)}</div>
    <div class="comment-time">${timeAgo(c.created_at)}</div>
  `;
  el.appendChild(body);
  return el;
}

async function submitComment(postId, card) {
  const input = card.querySelector('.comment-input');
  const content = input.value.trim();
  if (!content) return;
  const btn = card.querySelector('.comment-submit-btn');
  btn.disabled = true;
  try {
    const comment = await apiAddComment(postId, content);
    input.value = '';
    const list = card.querySelector('.comments-list');
    if (list.querySelector('.text-muted')) list.innerHTML = '';
    list.appendChild(buildComment(comment));
    // Update count
    const countEl = card.querySelector('.comment-toggle-btn span');
    if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;
  } catch (err) { toast(err.message, 'error'); }
  btn.disabled = false;
}

// Post creation logic
postContent.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 200) + 'px';
});

document.getElementById('pick-image-btn')?.addEventListener('click', () => postImageIn.click());
postImageIn?.addEventListener('change', () => {
  const file = postImageIn.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  imagePreview.innerHTML = `<img src="${url}" style="max-height:200px;border-radius:var(--radius-md);margin-top:8px" alt="preview">
    <button id="remove-img" style="margin-top:4px" class="btn btn-sm btn-danger">Remove</button>`;
  document.getElementById('remove-img')?.addEventListener('click', () => {
    postImageIn.value = ''; imagePreview.innerHTML = '';
  });
});

postForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = postContent.value.trim();
  if (!content) return;
  const btn = postForm.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Posting…';

  try {
    const fd = new FormData();
    fd.append('content', content);
    if (postImageIn.files[0]) fd.append('image', postImageIn.files[0]);
    const post = await apiCreatePost(fd);
    postContent.value = ''; postContent.style.height = '';
    postImageIn.value = ''; imagePreview.innerHTML = '';
    // Prepend to feed
    const card = buildPostCard(post);
    feedEl.prepend(card);
    toast('Post created! ✨', 'success');
  } catch (err) { toast(err.message, 'error'); }
  btn.disabled = false; btn.textContent = 'Post';
});

// Load who to follow suggestions
async function loadSuggestions() {
  const container = document.getElementById('suggestions-list');
  if (!container) return;
  try {
    // Show explore posts authors as suggestions (simple approach)
    const allPosts = await apiExplore();
    const seen = new Set([me?.username]);
    const suggestions = [];
    for (const p of allPosts) {
      if (!seen.has(p.author.username)) {
        seen.add(p.author.username);
        suggestions.push(p.author);
      }
      if (suggestions.length >= 5) break;
    }
    container.innerHTML = '';
    if (!suggestions.length) { container.innerHTML = '<p class="text-muted text-sm">No suggestions yet.</p>'; return; }
    suggestions.forEach(user => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      const av = avatarEl(user, 'avatar-sm');
      item.appendChild(av);
      item.innerHTML += `
        <div class="suggestion-info">
          <div class="suggestion-name">${user.first_name || user.username}</div>
          <div class="suggestion-handle">@${user.username}</div>
        </div>
        <button class="btn btn-outline btn-sm follow-suggest-btn" data-username="${user.username}">Follow</button>
      `;
      item.querySelector('.follow-suggest-btn').addEventListener('click', async (e) => {
        const btn2 = e.currentTarget;
        btn2.disabled = true;
        try {
          const res = await apiFollowToggle(user.username);
          btn2.textContent = res.following ? 'Unfollow' : 'Follow';
          toast(res.following ? `Following @${user.username}` : `Unfollowed @${user.username}`, 'success');
        } catch (err) { toast(err.message, 'error'); }
        btn2.disabled = false;
      });
      container.appendChild(item);
    });
  } catch {}
}

// User search logic with debouncing
let searchTimer;
searchInput?.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (!q) { searchDrop.classList.remove('open'); return; }
  searchTimer = setTimeout(async () => {
    try {
      const users = await apiSearchUsers(q);
      searchDrop.innerHTML = '';
      if (!users.length) {
        searchDrop.innerHTML = '<div class="search-result-item text-muted text-sm">No users found</div>';
      } else {
        users.forEach(u => {
          const item = document.createElement('div');
          item.className = 'search-result-item';
          const av = avatarEl(u, 'avatar-sm');
          item.appendChild(av);
          item.innerHTML += `<div><div class="font-600 text-sm">${u.first_name || u.username}</div><div class="text-muted text-xs">@${u.username}</div></div>`;
          item.addEventListener('click', () => {
            window.location.href = `profile.html?u=${u.username}`;
          });
          searchDrop.appendChild(item);
        });
      }
      searchDrop.classList.add('open');
    } catch {}
  }, 350);
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.navbar-search')) searchDrop.classList.remove('open');
});

// Handle logout
logoutBtn?.addEventListener('click', async () => {
  try { await apiLogout(); } catch {}
  clearToken(); clearUser();
  window.location.href = 'index.html';
});

// Navigate to profile
navProfile?.addEventListener('click', () => {
  if (me) window.location.href = `profile.html?u=${me.username}`;
});

// Utilities
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/\n/g,'<br>');
}

function emptyState(icon, title, desc) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-desc">${desc}</div></div>`;
}
