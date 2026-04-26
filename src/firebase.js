import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8PetzlhLkb7exO_io1t5z52WSlVEIfhQ",
  authDomain: "ipl-bracket.firebaseapp.com",
  databaseURL: "https://ipl-bracket-default-rtdb.firebaseio.com",
  projectId: "ipl-bracket",
  storageBucket: "ipl-bracket.firebasestorage.app",
  messagingSenderId: "761543128271",
  appId: "1:761543128271:web:e1d488856220cc60ef33ba"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// User functions
export const createUser = async (name, pin) => {
  const userRef = ref(db, `users/${name}`);
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    throw new Error('User already exists');
  }
  await set(userRef, { pin, points: 0, createdAt: Date.now() });
  return { name, points: 0 };
};

export const loginUser = async (name, pin) => {
  const userRef = ref(db, `users/${name}`);
  let snapshot = await get(userRef);

  // Fallback: accounts created before lowercase normalization may be stored under a different case
  if (!snapshot.exists()) {
    const allSnap = await get(ref(db, 'users'));
    if (allSnap.exists()) {
      const all = allSnap.val();
      const matchedKey = Object.keys(all).find(k => k.toLowerCase() === name);
      if (matchedKey) {
        snapshot = { exists: () => true, val: () => all[matchedKey] };
      }
    }
  }

  if (!snapshot.exists()) {
    throw new Error('User not found');
  }
  const userData = snapshot.val();
  if (userData.pin !== pin) {
    throw new Error('Invalid PIN');
  }
  return { name, points: userData.points || 0 };
};

// Prediction functions
export const savePrediction = async (userName, matchId, winner) => {
  const predRef = ref(db, `predictions/${userName}/${matchId}`);
  await set(predRef, { winner, timestamp: Date.now() });
};

export const getUserPredictions = async (userName) => {
  const predRef = ref(db, `predictions/${userName}`);
  const snapshot = await get(predRef);
  return snapshot.exists() ? snapshot.val() : {};
};

export const getAllPredictions = async () => {
  const predRef = ref(db, 'predictions');
  const snapshot = await get(predRef);
  return snapshot.exists() ? snapshot.val() : {};
};

// Match functions
export const getMatches = async () => {
  const matchRef = ref(db, 'matches');
  const snapshot = await get(matchRef);
  return snapshot.exists() ? snapshot.val() : {};
};

export const seedMatches = async (matches) => {
  const matchRef = ref(db, 'matches');
  await set(matchRef, matches);
};

export const setMatchResult = async (matchId, winner) => {
  const matchRef = ref(db, `matches/${matchId}`);
  await update(matchRef, { result: winner });
};

// Settings functions
export const getSettings = async () => {
  const settingsRef = ref(db, 'settings');
  const snapshot = await get(settingsRef);
  return snapshot.exists() ? snapshot.val() : { leagueLocked: false };
};

export const updateSettings = async (settings) => {
  const settingsRef = ref(db, 'settings');
  await update(settingsRef, settings);
};

// Leaderboard
export const getLeaderboard = async () => {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  if (!snapshot.exists()) return [];

  const users = snapshot.val();
  return Object.entries(users)
    .map(([name, data]) => ({ name, points: data.points || 0 }))
    .sort((a, b) => b.points - a.points);
};

export const updateUserPoints = async (userName, points) => {
  const userRef = ref(db, `users/${userName}/points`);
  await set(userRef, points);
};

// One-time migration: move mixed-case user/prediction keys to lowercase
export const migrateToLowercase = async () => {
  const [usersSnap, predsSnap] = await Promise.all([
    get(ref(db, 'users')),
    get(ref(db, 'predictions')),
  ]);

  const migrated = [];

  if (usersSnap.exists()) {
    const users = usersSnap.val();
    for (const [key, data] of Object.entries(users)) {
      if (key !== key.toLowerCase()) {
        const lcKey = key.toLowerCase();
        if (!users[lcKey]) {
          await set(ref(db, `users/${lcKey}`), data);
        }
        await set(ref(db, `users/${key}`), null);
        migrated.push(`users/${key} → ${lcKey}`);
      }
    }
  }

  if (predsSnap.exists()) {
    const preds = predsSnap.val();
    for (const [key, userPreds] of Object.entries(preds)) {
      if (key !== key.toLowerCase()) {
        const lcKey = key.toLowerCase();
        for (const [matchId, pred] of Object.entries(userPreds || {})) {
          const existingSnap = await get(ref(db, `predictions/${lcKey}/${matchId}`));
          if (!existingSnap.exists()) {
            await set(ref(db, `predictions/${lcKey}/${matchId}`), pred);
          }
        }
        await set(ref(db, `predictions/${key}`), null);
        migrated.push(`predictions/${key} → ${lcKey}`);
      }
    }
  }

  return migrated;
};

// Real-time listeners
export const subscribeToMatches = (callback) => {
  const matchRef = ref(db, 'matches');
  return onValue(matchRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
};

export const subscribeToLeaderboard = (callback) => {
  const usersRef = ref(db, 'users');
  return onValue(usersRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const users = snapshot.val();
    const leaderboard = Object.entries(users)
      .map(([name, data]) => ({ name, points: data.points || 0 }))
      .sort((a, b) => b.points - a.points);
    callback(leaderboard);
  });
};

export { db, ref, get, set, update, onValue };
