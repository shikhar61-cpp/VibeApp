# ⚡ VibeApp — Mini Social Media Platform

A full-stack social media web application built with **Django REST Framework** backend and a premium **HTML/CSS/JavaScript** frontend.

## ✨ Features

- **User Authentication** — Register, Login, Logout with token-based auth
- **User Profiles** — Avatar, bio, first/last name, edit profile
- **Posts** — Create posts (with optional images), delete your own posts
- **Comments** — Add and view comments on any post
- **Likes** — Like/unlike posts with animated heart button
- **Follow System** — Follow/unfollow users, view followers & following lists
- **Home Feed** — Curated feed of posts from followed users + own posts
- **Explore** — Browse all posts from the platform
- **Search** — Live search for users by username
- **"Who to Follow"** — Suggestions sidebar on the feed page

## 🏗️ Project Structure

```
VibeApp/
├── backend/                   ← Django REST API
│   ├── config/                ← Django settings & URLs
│   ├── users/                 ← User profiles & follow system
│   │   ├── models.py          ← Profile, Follow models
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── posts/                 ← Posts, comments, likes
│   │   ├── models.py          ← Post, Comment, Like models
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/                  ← Static SPA (HTML/CSS/JS)
    ├── index.html             ← Login / Register page
    ├── feed.html              ← Home feed
    ├── profile.html           ← User profile
    ├── css/
    │   └── style.css          ← Full design system
    └── js/
        ├── api.js             ← API fetch wrapper
        ├── utils.js           ← Toast, avatar, time helpers
        ├── auth.js            ← Auth page logic
        ├── feed.js            ← Feed page logic
        └── profile.js         ← Profile page logic
```

## 🚀 Setup & Run

### Prerequisites
- **Python 3.10+** — Download from https://www.python.org/downloads/
  - ⚠️ During install, check **"Add Python to PATH"**
- A modern web browser (Chrome, Firefox, Edge)

### Step 1 — Install Backend Dependencies

Open a terminal in the `VibeApp/` folder:

```bash
cd backend
py -m pip install -r requirements.txt
```

### Step 2 — Run Database Migrations

```bash
py manage.py makemigrations users
py manage.py makemigrations posts
py manage.py migrate
```

### Step 3 — (Optional) Create Admin User

```bash
py manage.py createsuperuser
```

### Step 4 — Start the Django Server

```bash
py manage.py runserver
```

The backend API will be available at: **http://127.0.0.1:8000**

### Step 5 — Open the Frontend

Open a new terminal and run:
```bash
npx serve C:\Users\shikh\OneDrive\Documents\Desktop\Project\VibeApp\frontend
```

Then open: **http://localhost:3000**

### One-Click Start (Windows)

Double-click `start.bat` in the `VibeApp/` folder.

### Running via VS Code (Recommended)

1. Open the project folder in VS Code (`code .` in terminal)
2. Open the built-in terminal (`Ctrl` + `` ` ``)
3. **Terminal 1 (Backend):**
   ```bash
   cd backend
   py manage.py runserver
   ```
4. **Terminal 2 (Frontend):**
   Click the **`+`** icon or **Split Terminal** icon to open a second terminal.
   ```bash
   npx serve frontend
   ```
5. Open your browser to **http://localhost:3000**

## 🎨 Design

- **Dark theme** with deep navy background (`#070810`)
- **Indigo** primary accent (`#4f46e5`)
- **Cyan/Teal** secondary accent (`#06b6d4`)
- **Amber** subtle glow (`#f59e0b`)
- **Glassmorphism** cards with backdrop blur
- **Grid background** pattern
- **Google Fonts** – Inter
- **Smooth animations** — like heart bounce, hover glow, fade-ins
- **Responsive** – mobile-friendly layout

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login → token |
| POST | `/api/auth/logout/` | Logout |
| GET | `/api/users/me/` | Get current user |
| PATCH | `/api/users/me/` | Update profile |
| GET | `/api/users/<username>/` | User profile |
| POST | `/api/users/<username>/follow/` | Follow/unfollow toggle |
| GET | `/api/users/<username>/followers/` | Followers list |
| GET | `/api/users/<username>/following/` | Following list |
| GET | `/api/users/search/?q=<q>` | Search users |
| GET | `/api/posts/` | Home feed |
| POST | `/api/posts/` | Create post |
| GET | `/api/posts/explore/` | All posts (explore) |
| DELETE | `/api/posts/<id>/` | Delete post |
| POST | `/api/posts/<id>/like/` | Like/unlike toggle |
| GET | `/api/posts/<id>/comments/` | Get comments |
| POST | `/api/posts/<id>/comments/` | Add comment |
| DELETE | `/api/comments/<id>/` | Delete comment |
| GET | `/api/users/<username>/posts/` | User's posts |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (Vanilla), JavaScript (ES6 Modules) |
| Backend | Django 4.2, Django REST Framework |
| Auth | DRF Token Authentication |
| Database | SQLite (dev) |
| CORS | django-cors-headers |
| Images | Pillow |

## 📝 Quick Demo

1. Register **User A** at `http://localhost:3000`
2. Create some posts
3. Register **User B** (open in incognito)
4. Follow User A — see their posts in feed
5. Like a post — watch the heart animate
6. Add a comment
7. Visit profile page — see follower counts update live

## 📁 Project Location

```
C:\Users\shikh\OneDrive\Documents\Desktop\Project\VibeApp\
```
