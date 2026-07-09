// auth.js - Handles login and registration on the index page

import { apiLogin, apiRegister, setToken, setUser, isLoggedIn } from './api.js';
import { toast } from './utils.js';

// If user is already logged in, skip the auth page
if (isLoggedIn()) window.location.href = 'feed.html';

const loginTab  = document.getElementById('tab-login');
const regTab    = document.getElementById('tab-register');
const loginForm = document.getElementById('form-login');
const regForm   = document.getElementById('form-register');
const loginErr  = document.getElementById('login-error');
const regErr    = document.getElementById('register-error');

// Switch between Login and Register tabs
loginTab.addEventListener('click', () => showTab('login'));
regTab.addEventListener('click',   () => showTab('register'));

function showTab(tab) {
  if (tab === 'login') {
    loginTab.classList.add('active');
    regTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
  } else {
    regTab.classList.add('active');
    loginTab.classList.remove('active');
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

// Login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErr.classList.add('hidden');

  const btn = loginForm.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const { token, user } = await apiLogin(
      document.getElementById('login-username').value.trim(),
      document.getElementById('login-password').value
    );
    setToken(token);
    setUser(user);
    window.location.href = 'feed.html';
  } catch (err) {
    loginErr.textContent = err.message;
    loginErr.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

// Register form submission
regForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  regErr.classList.add('hidden');

  const btn = regForm.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const payload = {
      username:   document.getElementById('reg-username').value.trim(),
      email:      document.getElementById('reg-email').value.trim(),
      first_name: document.getElementById('reg-firstname').value.trim(),
      last_name:  document.getElementById('reg-lastname').value.trim(),
      password:   document.getElementById('reg-password').value,
      password2:  document.getElementById('reg-password2').value,
    };
    const { token, user } = await apiRegister(payload);
    setToken(token);
    setUser(user);
    window.location.href = 'feed.html';
  } catch (err) {
    regErr.textContent = err.message;
    regErr.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});
