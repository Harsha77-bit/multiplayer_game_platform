import React, { useState, useEffect } from 'react';
import { Settings, BarChart2, Save } from 'lucide-react';

function CreatorStudio() {
  const [config, setConfig] = useState({
    gridSize: 10,
    maxTreasures: 10,
    pointsPerTreasure: 50,
    winCondition: 'all_treasures'
  });
  
  const [analytics, setAnalytics] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/api/games/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error(err));

    fetch('http://localhost:8080/api/analytics')
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(err => console.error(err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const res = await fetch('http://localhost:8080/api/games/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setStatus('Saved successfully!');
        setTimeout(() => setStatus(''), 2000);
      }
    } catch (err) {
      setStatus('Error saving.');
    }
  };

  return (
    <div className="w-full flex gap-6 animate-fade-in">
      {/* Configuration Form */}
      <div className="flex-1 glass-panel p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-dark-700 pb-4">
          <Settings className="text-neon-pink" /> GAME CONFIGURATION
        </h2>
        
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Grid Size (N x N)</label>
            <input 
              type="number" 
              min="5" max="20"
              value={config.gridSize}
              onChange={e => setConfig({...config, gridSize: parseInt(e.target.value)})}
              className="bg-dark-900 border border-dark-700 rounded p-2 text-white focus:border-neon-pink outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Max Treasures</label>
            <input 
              type="number" 
              min="1" max="50"
              value={config.maxTreasures}
              onChange={e => setConfig({...config, maxTreasures: parseInt(e.target.value)})}
              className="bg-dark-900 border border-dark-700 rounded p-2 text-white focus:border-neon-pink outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Points Per Treasure</label>
            <input 
              type="number" 
              value={config.pointsPerTreasure}
              onChange={e => setConfig({...config, pointsPerTreasure: parseInt(e.target.value)})}
              className="bg-dark-900 border border-dark-700 rounded p-2 text-white focus:border-neon-pink outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Win Condition</label>
            <select 
              value={config.winCondition}
              onChange={e => setConfig({...config, winCondition: e.target.value})}
              className="bg-dark-900 border border-dark-700 rounded p-2 text-white focus:border-neon-pink outline-none"
            >
              <option value="all_treasures">Find All Treasures</option>
              <option value="max_score">Max Score (Time Limit)</option>
            </select>
          </div>
          
          <button type="submit" className="mt-4 flex items-center justify-center gap-2 bg-dark-700 hover:bg-dark-600 border border-neon-pink text-white py-2 rounded transition">
            <Save size={18} /> Apply Configuration
          </button>
          {status && <p className="text-neon-pink text-sm text-center">{status}</p>}
        </form>
      </div>

      {/* Analytics Dashboard */}
      <div className="flex-1 glass-panel p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-dark-700 pb-4">
          <BarChart2 className="text-neon-green" /> GLOBAL ANALYTICS
        </h2>
        
        {analytics ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-900 border border-dark-700 p-4 rounded flex flex-col items-center justify-center">
              <span className="text-gray-400 text-sm">Total Matches</span>
              <span className="text-4xl font-bold text-white mt-2">{analytics.totalGamesPlayed}</span>
            </div>
            <div className="bg-dark-900 border border-dark-700 p-4 rounded flex flex-col items-center justify-center">
              <span className="text-gray-400 text-sm">Treasures Found</span>
              <span className="text-4xl font-bold text-neon-green mt-2">{analytics.treasuresFound}</span>
            </div>
            <div className="bg-dark-900 border-l-4 border-neon-blue p-4 rounded flex flex-col items-center justify-center">
              <span className="text-gray-400 text-sm">Team Alpha Wins</span>
              <span className="text-3xl font-bold text-neon-blue mt-2">{analytics.teamAWins}</span>
            </div>
            <div className="bg-dark-900 border-l-4 border-neon-pink p-4 rounded flex flex-col items-center justify-center">
              <span className="text-gray-400 text-sm">Team Beta Wins</span>
              <span className="text-3xl font-bold text-neon-pink mt-2">{analytics.teamBWins}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Loading analytics...</p>
        )}
      </div>
    </div>
  );
}

export default CreatorStudio;
