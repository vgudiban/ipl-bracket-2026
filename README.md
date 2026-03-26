# IPL 2026 Bracket Prediction Game

A mobile-friendly bracket prediction game for IPL 2026. Users predict match winners and earn points for correct predictions.

## Features

- User registration with simple name + 4-digit PIN
- Predict winners for all 74 matches (70 league + 4 playoffs)
- Real-time leaderboard
- Admin panel to enter match results
- Hybrid locking (league predictions lock before tournament, playoffs can be predicted as teams qualify)
- Mobile-friendly responsive design

## Scoring

- League match: **1 point**
- Playoff match: **2 points**
- Final: **3 points**

## Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (name it whatever you like)
3. Go to **Build > Realtime Database**
4. Click **Create Database**
5. Choose a location and start in **test mode** (for development)
6. Go to **Project Settings** (gear icon) > **General**
7. Scroll down and click **Add app** > Web app
8. Register your app and copy the config values

### 2. Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase config values in `.env`:
   ```
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

### 3. Set Firebase Database Rules

In Firebase Console, go to **Realtime Database > Rules** and set:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> Note: For production, you should set more restrictive rules.

### 4. Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/ipl-bracket-2026/

### 5. Deploy to GitHub Pages

1. Create a GitHub repository named `ipl-bracket-2026`

2. Update `package.json` - replace `YOUR_GITHUB_USERNAME` with your actual username:
   ```json
   "homepage": "https://YOUR_GITHUB_USERNAME.github.io/ipl-bracket-2026"
   ```

3. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/ipl-bracket-2026.git
   git push -u origin main
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. In GitHub repo settings, go to **Pages** and ensure it's set to deploy from `gh-pages` branch

Your app will be live at `https://YOUR_USERNAME.github.io/ipl-bracket-2026/`

## Admin Access

Access the admin panel at `/admin`. Default PIN is `1234` (change this in `src/pages/Admin.jsx`).

Admin can:
- Lock/unlock league predictions
- Enter match results
- Recalculate all user points

## Project Structure

```
src/
├── App.jsx              # Main app with routing
├── firebase.js          # Firebase configuration & functions
├── index.css            # Tailwind CSS styles
├── main.jsx             # Entry point
├── components/
│   ├── MatchCard.jsx    # Match card component
│   └── Navbar.jsx       # Navigation bar
├── pages/
│   ├── Login.jsx        # User login/registration
│   ├── Predictions.jsx  # Make predictions
│   ├── Leaderboard.jsx  # View standings
│   └── Admin.jsx        # Admin panel
└── data/
    └── matches.json     # IPL 2026 schedule
```

## Customization

- **Admin PIN**: Change `ADMIN_PIN` in `src/pages/Admin.jsx`
- **Team Colors**: Edit `teamColors` in `src/components/MatchCard.jsx`
- **Match Schedule**: Update `src/data/matches.json` with official schedule
- **Scoring**: Modify point values in `src/pages/Admin.jsx` (recalculatePoints function)
