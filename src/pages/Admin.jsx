import { useState, useEffect } from 'react';
import {
  getMatches,
  setMatchResult,
  getAllPredictions,
  updateUserPoints,
  getSettings,
  updateSettings,
  getLeaderboard
} from '../firebase';

const ADMIN_PIN = '1234'; // Change this to your preferred admin PIN

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [matches, setMatches] = useState({});
  const [predictions, setPredictions] = useState({});
  const [settings, setSettings] = useState({ leagueLocked: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matchesData, predictionsData, settingsData] = await Promise.all([
        getMatches(),
        getAllPredictions(),
        getSettings(),
      ]);
      setMatches(matchesData || {});
      setPredictions(predictionsData || {});
      setSettings(settingsData || { leagueLocked: false });
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
    } else {
      setMessage('Invalid PIN');
    }
  };

  const handleSetResult = async (matchId, winner) => {
    try {
      await setMatchResult(matchId, winner);
      setMatches((prev) => ({
        ...prev,
        [matchId]: { ...prev[matchId], result: winner },
      }));
      setMessage(`Set ${matchId} winner: ${winner}`);

      // Recalculate points
      await recalculatePoints();
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  const recalculatePoints = async () => {
    const updatedMatches = await getMatches();
    const allPredictions = await getAllPredictions();

    const userPoints = {};

    // Calculate points for each user
    for (const [userName, userPreds] of Object.entries(allPredictions)) {
      let points = 0;

      for (const [matchId, pred] of Object.entries(userPreds)) {
        const match = updatedMatches[matchId];
        if (match?.result && pred?.winner === match.result) {
          if (match.stage === 'final') points += 3;
          else if (match.stage === 'playoff') points += 2;
          else points += 1;
        }
      }

      userPoints[userName] = points;
    }

    // Update points in database
    for (const [userName, points] of Object.entries(userPoints)) {
      await updateUserPoints(userName, points);
    }

    setMessage('Points recalculated successfully!');
  };

  const handleToggleLock = async () => {
    const newValue = !settings.leagueLocked;
    await updateSettings({ leagueLocked: newValue });
    setSettings((prev) => ({ ...prev, leagueLocked: newValue }));
    setMessage(`League predictions ${newValue ? 'locked' : 'unlocked'}`);
  };

  const sortedMatches = Object.entries(matches).sort(([, a], [, b]) => {
    const dateA = new Date(a.date + 'T' + a.time);
    const dateB = new Date(b.date + 'T' + b.time);
    return dateA - dateB;
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 w-full max-w-sm border border-slate-700">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Access</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 text-center text-2xl tracking-[0.5em] mb-4"
              placeholder="••••"
              inputMode="numeric"
            />
            {message && (
              <div className="text-red-400 text-sm text-center mb-4">{message}</div>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-400">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button
          onClick={() => setAuthenticated(false)}
          className="text-sm px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
        >
          Logout
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg text-sm">
          {message}
        </div>
      )}

      <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">League Predictions Lock</h3>
            <p className="text-sm text-gray-400">
              {settings.leagueLocked
                ? 'League predictions are locked'
                : 'League predictions are open'}
            </p>
          </div>
          <button
            onClick={handleToggleLock}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              settings.leagueLocked
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'bg-green-500 hover:bg-green-400 text-black'
            }`}
          >
            {settings.leagueLocked ? 'Unlock' : 'Lock'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={recalculatePoints}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-medium transition-colors"
        >
          Recalculate All Points
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Set Match Results</h2>

      <div className="space-y-3">
        {sortedMatches.map(([matchId, match]) => (
          <div
            key={matchId}
            className="p-4 bg-slate-800/50 rounded-xl border border-slate-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                {match.matchType || matchId} - {match.date}
              </span>
              {match.result && (
                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                  Result: {match.result}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetResult(matchId, match.team1)}
                disabled={match.team1 === 'TBD'}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors ${
                  match.result === match.team1
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {match.team1}
              </button>
              <span className="text-gray-500">vs</span>
              <button
                onClick={() => handleSetResult(matchId, match.team2)}
                disabled={match.team2 === 'TBD'}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors ${
                  match.result === match.team2
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {match.team2}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
