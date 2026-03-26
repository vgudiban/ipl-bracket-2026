import { useState, useEffect } from 'react';
import { getMatches, getUserPredictions, savePrediction, seedMatches, getSettings } from '../firebase';
import MatchCard from '../components/MatchCard';
import matchData from '../data/matches.json';

const Predictions = ({ user }) => {
  const [matches, setMatches] = useState({});
  const [predictions, setPredictions] = useState({});
  const [settings, setSettings] = useState({ leagueLocked: false });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    loadData();
  }, [user.name]);

  const loadData = async () => {
    try {
      let matchesData = await getMatches();

      // Seed matches if empty
      if (!matchesData || Object.keys(matchesData).length === 0) {
        await seedMatches(matchData);
        matchesData = matchData;
      }

      const userPredictions = await getUserPredictions(user.name);
      const settingsData = await getSettings();

      setMatches(matchesData);
      setPredictions(userPredictions);
      setSettings(settingsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (matchId, winner) => {
    setSaving(matchId);
    try {
      await savePrediction(user.name, matchId, winner);
      setPredictions((prev) => ({
        ...prev,
        [matchId]: { winner },
      }));
    } catch (err) {
      console.error('Error saving prediction:', err);
    } finally {
      setSaving(null);
    }
  };

  const sortedMatches = Object.entries(matches).sort(([, a], [, b]) => {
    const dateA = new Date(a.date + 'T' + a.time);
    const dateB = new Date(b.date + 'T' + b.time);
    return dateA - dateB;
  });

  const filteredMatches = sortedMatches.filter(([, match]) => {
    if (filter === 'all') return true;
    if (filter === 'league') return match.stage === 'league';
    if (filter === 'playoffs') return match.stage === 'playoff' || match.stage === 'final';
    if (filter === 'unpredicted') {
      const pred = predictions[Object.keys(matches).find((k) => matches[k] === match)];
      return !pred?.winner;
    }
    return true;
  });

  const predictedCount = Object.keys(predictions).filter((k) => predictions[k]?.winner).length;
  const totalMatches = Object.keys(matches).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-400">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Make Your Predictions</h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            {predictedCount} / {totalMatches} matches predicted
          </p>
          <div className="h-2 w-32 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all"
              style={{ width: `${(predictedCount / totalMatches) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Matches' },
          { key: 'league', label: 'League' },
          { key: 'playoffs', label: 'Playoffs' },
          { key: 'unpredicted', label: 'Unpredicted' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-yellow-500 text-black'
                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredMatches.map(([matchId, match]) => (
          <MatchCard
            key={matchId}
            matchId={matchId}
            match={match}
            prediction={predictions[matchId]?.winner}
            onPredict={handlePredict}
            locked={match.stage === 'league' && settings.leagueLocked}
            showResult={!!match.result}
          />
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No matches found for this filter.
        </div>
      )}

      <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h3 className="font-semibold mb-2">Scoring Rules</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• League match: <span className="text-yellow-400">+1 point</span></li>
          <li>• Playoff match: <span className="text-yellow-400">+2 points</span></li>
          <li>• Final: <span className="text-yellow-400">+3 points</span></li>
        </ul>
      </div>
    </div>
  );
};

export default Predictions;
