import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Predictions from './pages/Predictions';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import './index.css';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ipl_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('ipl_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ipl_user');
  };

  return (
    <HashRouter>
      <div className="min-h-screen text-white">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/predictions" /> : <Login onLogin={handleLogin} />}
          />
          <Route
            path="/predictions"
            element={user ? <Predictions user={user} /> : <Navigate to="/" />}
          />
          <Route
            path="/leaderboard"
            element={user ? <Leaderboard /> : <Navigate to="/" />}
          />
          <Route
            path="/admin"
            element={<Admin />}
          />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
