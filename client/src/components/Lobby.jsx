import React from 'react';
import { Users, LogOut, CheckCircle, Shield } from 'lucide-react';

function Lobby({ socket, lobbyData, playerInfo, onLeave }) {
  const me = lobbyData.players.find(p => p.id === socket.id);
  const teamA = lobbyData.players.filter(p => p.team === 0);
  const teamB = lobbyData.players.filter(p => p.team === 1);
  const unassigned = lobbyData.players.filter(p => p.team === -1);

  const handleJoinTeam = (teamId) => {
    socket.emit('select_team', { team: teamId });
  };

  const handleReady = () => {
    socket.emit('toggle_ready');
  };

  const TeamBox = ({ title, teamId, players, colorClass }) => (
    <div className={`flex-1 glass-panel p-4 border-t-4 ${colorClass}`}>
      <h3 className={`text-xl font-bold mb-4 uppercase tracking-widest flex items-center justify-between`}>
        {title} 
        <span className="text-sm bg-dark-900 px-2 py-1 rounded">{players.length}/2</span>
      </h3>
      <div className="flex flex-col gap-2 min-h-[150px]">
        {players.map(p => (
          <div key={p.id} className="flex items-center justify-between bg-dark-900 p-3 rounded border border-dark-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{p.avatar}</span>
              <span className="font-semibold text-gray-200">{p.username} {p.id === socket.id && '(You)'}</span>
            </div>
            {p.ready ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : (
              <span className="text-xs text-gray-500">Waiting...</span>
            )}
          </div>
        ))}
        {players.length < 2 && (
          <button 
            onClick={() => handleJoinTeam(teamId)}
            className="mt-auto w-full py-2 border border-dashed border-gray-600 text-gray-400 hover:border-white hover:text-white rounded transition"
          >
            + Join {title}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center glass-panel p-4 gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
            <Users className="text-neon-blue" /> MATCH LOBBY
          </h2>
          <p className="text-gray-400 text-sm">Room: <span className="font-mono text-neon-blue uppercase">{playerInfo?.roomId}</span></p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm font-bold uppercase tracking-wider">Game:</label>
            <select 
              value={lobbyData.selectedGame || 'treasure_hunt'}
              onChange={(e) => socket.emit('select_game', { game: e.target.value })}
              className="bg-dark-900 border border-dark-700 text-white p-2 rounded"
            >
              <option value="treasure_hunt">Treasure Hunt (4P)</option>
              <option value="tic_tac_toe">Tic Tac Toe (2P)</option>
            </select>
          </div>
          <button 
            onClick={onLeave}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition"
          >
            <LogOut size={18} /> Leave
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <TeamBox title="Team Alpha" teamId={0} players={teamA} colorClass="border-neon-blue" />
        
        <div className="flex-1 glass-panel p-4 flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-gray-400 uppercase tracking-widest text-center">Unassigned</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {unassigned.map(p => (
              <div key={p.id} className="bg-dark-900 px-3 py-2 rounded-full border border-dark-700 flex items-center gap-2">
                <span>{p.avatar}</span>
                <span className="text-sm">{p.username}</span>
              </div>
            ))}
            {unassigned.length === 0 && <span className="text-gray-600 text-sm italic">None</span>}
          </div>

          <div className="mt-auto flex flex-col items-center gap-4">
            <div className="text-center">
              {me?.team !== -1 ? (
                <button 
                  onClick={handleReady}
                  className={`px-8 py-3 rounded uppercase font-bold tracking-widest transition-all ${
                    me?.ready 
                      ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(0,255,0,0.5)]' 
                      : 'bg-neon-blue text-dark-900 hover:bg-blue-400 shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                  }`}
                >
                  {me?.ready ? 'Ready!' : 'Click to Ready'}
                </button>
              ) : (
                <p className="text-gray-400 text-sm">Select a team to continue.</p>
              )}
            </div>
            <p className="text-xs text-gray-500">Game starts automatically when everyone is ready.</p>
            {lobbyData.selectedGame === 'tic_tac_toe' && (
              <p className="text-xs text-yellow-500 mt-[-10px]">Tic Tac Toe requires exactly 1 player per team.</p>
            )}
          </div>
        </div>

        <TeamBox title="Team Beta" teamId={1} players={teamB} colorClass="border-neon-pink" />
      </div>
    </div>
  );
}

export default Lobby;
