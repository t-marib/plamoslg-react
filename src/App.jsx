// src/App.jsx

import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GmIndexPage from './pages/GmIndexPage';
import PlayerPage from './pages/PlayerPage';
import GmPage from './pages/GmPage';

function App() {
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen p-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-cyan-400">Plamo SLG Digital Assistant (React)</h1>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gm" element={<GmIndexPage />} />
        <Route path="/player/:gameId" element={<PlayerPage />} />
        <Route path="/gm/:gameId" element={<GmPage />} />
      </Routes>
    </div>
  );
}

export default App;