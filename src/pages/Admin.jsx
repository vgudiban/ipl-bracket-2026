import { useState, useEffect } from 'react';
import {
  getMatches,
  seedMatches,
  setMatchResult,
  getAllPredictions,
  updateUserPoints,
  getSettings,
  updateSettings,
  getLeaderboard,
  migrateToLowercase,
} from '../firebase';
import matchData from '../data/matches.json';

const ADMIN_PIN = '1234'; // Change this to your preferred admin PIN

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [matches, setMatches] = useState({});
  const [predictions, setPredictions] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [settings, setSettings] = useState({ leagueLocked: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('results');
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      let matchesData = await getMatches();
      if (!matchesData || Object.keys(matchesData).length === 0) {
        await seedMatches(matchData);
        matchesData = matchData;
      }
      const [predictionsData, settingsData, leaderboardData] = await Promise.all([
        getAllPredictions(),
        getSettings(),
        getLeaderboard(),
      ]);
      setMatches(matchesData);
      setPredictions(predictionsData || {});
      setSettings(settingsData || { leagueLocked: false });
      setLeaderboard(leaderboardData || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setMessage('Error loading data: ' + err.message);
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
          if (match.stage === 'final') points += 6;
          else if (match.stage === 'playoff') points += 4;
          else points += 2;
        }
      }

      userPoints[userName] = points;
    }

    // Update points in database
    for (const [userName, points] of Object.entries(userPoints)) {
      await updateUserPoints(userName, points);
    }

    // Refresh leaderboard
    const newLeaderboard = await getLeaderboard();
    setLeaderboard(newLeaderboard);

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

  const getMatchPredictions = (matchId) => {
    const matchPreds = [];
    for (const [userName, userPreds] of Object.entries(predictions)) {
      if (userPreds[matchId]) {
        matchPreds.push({
          user: userName,
          pick: userPreds[matchId].winner
        });
      }
    }
    return matchPreds;
  };

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
        <h1 className="text-2xl font-bold">Admin Panel <span className="text-xs text-yellow-400">v2</span></h1>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="text-sm px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
          >
            Refresh
          </button>
          <button
            onClick={() => setAuthenticated(false)}
            className="text-sm px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
          >
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'results', label: 'Match Results' },
          { key: 'leaderboard', label: 'Leaderboard' },
          { key: 'predictions', label: 'All Predictions' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); if (key === 'predictions') loadData(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === key
                ? 'bg-yellow-500 text-black'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lock Settings */}
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

      {/* Results Tab */}
      {activeTab === 'results' && (
        <>
          <div className="mb-4 flex gap-2 flex-wrap">
            <button
              onClick={recalculatePoints}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              Recalculate All Points
            </button>
            <button
              onClick={async () => {
                const result = await migrateToLowercase();
                await loadData();
                setMessage(result.length
                  ? `Migrated: ${result.join(', ')}`
                  : 'Nothing to migrate — all keys already lowercase');
              }}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg font-medium transition-colors"
            >
              Fix Duplicate Users
            </button>
            <button
              onClick={async () => {
                const raw = await getAllPredictions();
                setMessage('RAW: ' + JSON.stringify(raw, null, 2));
              }}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              Debug Predictions
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
        </>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <>
          <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No users yet</div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((player, index) => (
                <div
                  key={player.name}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    index === 0
                      ? 'bg-yellow-500/20 border-yellow-500/50'
                      : index === 1
                      ? 'bg-gray-400/10 border-gray-400/30'
                      : index === 2
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold w-8">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </span>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-400">{player.points} pts</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <h3 className="font-semibold mb-2">Scoring</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• League match: <span className="text-yellow-400">+2 points</span></li>
              <li>• Playoff match: <span className="text-yellow-400">+4 points</span></li>
              <li>• Final: <span className="text-yellow-400">+6 points</span></li>
            </ul>
          </div>
        </>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <>
          <h2 className="text-xl font-semibold mb-4">All Predictions by Match</h2>

          <div className="space-y-3">
            {sortedMatches.map(([matchId, match]) => {
              const matchPreds = getMatchPredictions(matchId);
              const isExpanded = selectedMatch === matchId;

              return (
                <div
                  key={matchId}
                  className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
                >
                  <button
                    onClick={() => setSelectedMatch(isExpanded ? null : matchId)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div>
                      <span className="text-sm text-gray-400">{match.matchType || matchId}</span>
                      <div className="font-medium">{match.team1} vs {match.team2}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">{matchPreds.length} predictions</span>
                      <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-700 p-4">
                      {match.result && (
                        <div className="mb-3 text-sm">
                          Winner: <span className="text-green-400 font-bold">{match.result}</span>
                        </div>
                      )}
                      {matchPreds.length === 0 ? (
                        <div className="text-gray-400 text-sm">No predictions yet</div>
                      ) : (
                        <div className="space-y-2">
                          {matchPreds.map(({ user, pick }) => (
                            <div
                              key={user}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                match.result
                                  ? pick === match.result
                                    ? 'bg-green-500/20'
                                    : 'bg-red-500/20'
                                  : 'bg-slate-700/50'
                              }`}
                            >
                              <span>{user}</span>
                              <span className={`font-bold ${
                                match.result
                                  ? pick === match.result
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                  : 'text-yellow-400'
                              }`}>
                                {pick}
                                {match.result && (pick === match.result ? ' ✓' : ' ✗')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Admin;
