import { useState } from 'react';
import { createUser, loginUser } from '../firebase';

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim()) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      setLoading(false);
      return;
    }

    try {
      let userData;
      if (isNewUser) {
        userData = await createUser(name.trim(), pin);
      } else {
        userData = await loginUser(name.trim(), pin);
      }
      onLogin(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <span className="text-6xl">🏏</span>
          <h1 className="text-3xl font-bold mt-4 text-white">IPL 2026</h1>
          <p className="text-gray-400 mt-2">Bracket Prediction Game</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="Enter your name"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">4-Digit PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors text-center text-2xl tracking-[0.5em]"
              placeholder="••••"
              inputMode="numeric"
              maxLength={4}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newUser"
              checked={isNewUser}
              onChange={(e) => setIsNewUser(e.target.checked)}
              className="w-4 h-4 accent-yellow-500"
            />
            <label htmlFor="newUser" className="text-sm text-gray-400">
              I'm a new player (create account)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : isNewUser ? 'Create Account & Join' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Tournament starts March 28, 2026</p>
          <p className="mt-1">Predict all 74 matches to compete!</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
