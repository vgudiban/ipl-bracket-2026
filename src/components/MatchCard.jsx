const teamColors = {
  CSK: { bg: 'bg-yellow-500', text: 'text-black', border: 'border-yellow-400' },
  MI: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-400' },
  RCB: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-400' },
  KKR: { bg: 'bg-purple-700', text: 'text-yellow-400', border: 'border-purple-400' },
  DC: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-300' },
  RR: { bg: 'bg-pink-600', text: 'text-white', border: 'border-pink-400' },
  SRH: { bg: 'bg-orange-500', text: 'text-black', border: 'border-orange-400' },
  PBKS: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-300' },
  GT: { bg: 'bg-cyan-700', text: 'text-white', border: 'border-cyan-400' },
  LSG: { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-400' },
  TBD: { bg: 'bg-gray-600', text: 'text-gray-300', border: 'border-gray-500' },
};

const teamNames = {
  CSK: 'Chennai Super Kings',
  MI: 'Mumbai Indians',
  RCB: 'Royal Challengers',
  KKR: 'Kolkata Knight Riders',
  DC: 'Delhi Capitals',
  RR: 'Rajasthan Royals',
  SRH: 'Sunrisers Hyderabad',
  PBKS: 'Punjab Kings',
  GT: 'Gujarat Titans',
  LSG: 'Lucknow Super Giants',
  TBD: 'To Be Decided',
};

const MatchCard = ({ match, matchId, prediction, onPredict, locked, showResult }) => {
  const { team1, team2, date, time, stage, result, venue, matchType } = match;
  const matchDate = new Date(date + 'T' + time);
  const isPast = new Date() > matchDate;
  const isLocked = locked || isPast || result;

  const formatDate = (d) => {
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getPointValue = () => {
    if (stage === 'final') return 3;
    if (stage === 'playoff') return 2;
    return 1;
  };

  const isCorrect = result && prediction === result;
  const isWrong = result && prediction && prediction !== result;

  return (
    <div className={`bg-slate-800/50 rounded-xl p-4 border ${
      isCorrect ? 'border-green-500' : isWrong ? 'border-red-500' : 'border-slate-700'
    }`}>
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs text-gray-400">
          {matchType || `Match ${matchId.replace('match_', '#')}`}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-400">+{getPointValue()} pts</span>
          {stage !== 'league' && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded">
              {stage}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <TeamButton
          team={team1}
          selected={prediction === team1}
          isWinner={result === team1}
          isLoser={result && result !== team1}
          disabled={isLocked || team1 === 'TBD'}
          onClick={() => !isLocked && team1 !== 'TBD' && onPredict(matchId, team1)}
        />
        <div className="text-gray-500 font-bold text-sm">VS</div>
        <TeamButton
          team={team2}
          selected={prediction === team2}
          isWinner={result === team2}
          isLoser={result && result !== team2}
          disabled={isLocked || team2 === 'TBD'}
          onClick={() => !isLocked && team2 !== 'TBD' && onPredict(matchId, team2)}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{formatDate(matchDate)}, {time}</span>
        <span>{venue}</span>
      </div>

      {result && (
        <div className={`mt-2 text-center text-sm font-medium ${
          isCorrect ? 'text-green-400' : isWrong ? 'text-red-400' : 'text-gray-400'
        }`}>
          {isCorrect ? '✓ Correct!' : isWrong ? '✗ Wrong' : `Winner: ${result}`}
        </div>
      )}

      {isLocked && !result && (
        <div className="mt-2 text-center text-xs text-orange-400">
          🔒 Locked
        </div>
      )}
    </div>
  );
};

const TeamButton = ({ team, selected, isWinner, isLoser, disabled, onClick }) => {
  const colors = teamColors[team] || teamColors.TBD;

  let className = `flex-1 py-3 px-2 rounded-lg font-bold text-center transition-all ${colors.bg} ${colors.text}`;

  if (selected && !isWinner && !isLoser) {
    className += ' ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-800';
  }
  if (isWinner) {
    className += ' ring-2 ring-green-400 ring-offset-2 ring-offset-slate-800';
  }
  if (isLoser) {
    className += ' opacity-40';
  }
  if (disabled) {
    className += ' cursor-not-allowed';
  } else {
    className += ' cursor-pointer hover:scale-105';
  }

  return (
    <button onClick={onClick} disabled={disabled} className={className}>
      <div className="text-lg">{team}</div>
      <div className="text-xs opacity-75 truncate hidden sm:block">
        {teamNames[team]?.split(' ')[0]}
      </div>
    </button>
  );
};

export default MatchCard;
