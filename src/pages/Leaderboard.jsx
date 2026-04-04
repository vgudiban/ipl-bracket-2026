import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToLeaderboard } from '../firebase';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      setLeaderboard(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-400">Loading leaderboard...</div>
      </div>
    );
  }

  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getRowStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/50';
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/30';
    if (rank === 3) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-slate-800/50 border-slate-700';
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <Link
          to="/"
          className="text-sm px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-medium rounded-lg transition-colors"
        >
          Join Game
        </Link>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No players yet. Be the first to join!
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((player, index) => {
            // Calculate rank with ties - players with same points get same rank
            let rank = 1;
            for (let i = 0; i < index; i++) {
              if (leaderboard[i].points > player.points) {
                rank = i + 2;
              }
            }
            return (
              <div
                key={player.name}
                className={`flex items-center gap-4 p-4 rounded-xl border ${getRowStyle(rank)}`}
              >
                <div className="w-10 h-10 flex items-center justify-center text-xl font-bold">
                  {getMedal(rank)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{player.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">{player.points}</div>
                  <div className="text-xs text-gray-400">points</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h3 className="font-semibold mb-2">How Points Work</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Correctly predict a league match: <span className="text-yellow-400">+2</span></li>
          <li>• Correctly predict a playoff match: <span className="text-yellow-400">+4</span></li>
          <li>• Correctly predict the final: <span className="text-yellow-400">+6</span></li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          Points are updated when match results are entered by the admin.
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
