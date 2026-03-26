import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-indigo-900/50 backdrop-blur-sm sticky top-0 z-50 border-b border-indigo-700/50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <span className="text-xl">🏏</span>
            <span className="font-bold text-lg hidden sm:block">IPL 2026</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/predictions"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/predictions')
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Predict
            </Link>
            <Link
              to="/leaderboard"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/leaderboard')
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Scores
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300 hidden sm:block">{user.name}</span>
            <button
              onClick={onLogout}
              className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
