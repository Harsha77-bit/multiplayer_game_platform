import React, { useState, useEffect } from 'react';

function TicTacToeGame({ socket, gameState, playerInfo, onLeaveGame }) {
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (gameState && gameState.currentTurnPlayerId === playerInfo?.id) {
      setIsMyTurn(true);
    } else {
      setIsMyTurn(false);
    }
  }, [gameState, playerInfo]);

  const handleCellClick = (index) => {
    if (isMyTurn && gameState?.isActive && gameState.grid[index] === null) {
      socket.emit('player_move', { cellIndex: index });
    }
  };

  if (!gameState) return <div className="text-white">Loading game...</div>;

  const { grid, players, scores, logs, isActive, winner } = gameState;
  const myPlayer = players[playerInfo?.id];

  const alphaPlayers = Object.values(players || {}).filter(p => p.team === 0);
  const betaPlayers = Object.values(players || {}).filter(p => p.team === 1);

  return (
    <div className="w-full flex flex-col-reverse lg:flex-row gap-6 animate-fade-in">
      
      {/* LEFT COLUMN: Controls & Status */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        
        {/* Score Board */}
        <div className="glass-panel p-4 flex flex-col gap-3">
          <h3 className="font-bold text-gray-400 text-sm tracking-widest uppercase text-center">Scoreboard</h3>
          <div className="flex justify-between items-start">
            <div className="flex flex-col items-center p-2 rounded bg-dark-900 border-l-4 border-neon-blue flex-1 mr-2">
              <span className="text-neon-blue font-bold">ALPHA</span>
              <span className="text-2xl font-mono text-white">{scores[0]}</span>
              <div className="flex flex-col items-center mt-2 w-full border-t border-dark-700 pt-2 gap-1">
                {alphaPlayers.map(p => (
                  <div key={p.id} className="flex flex-col items-center text-xs">
                     <span className="text-lg">{p.avatar}</span>
                     <span className="text-gray-400 truncate max-w-[60px] text-[10px]">{p.username}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xl font-bold text-gray-500 self-center">VS</div>
            <div className="flex flex-col items-center p-2 rounded bg-dark-900 border-r-4 border-neon-pink flex-1 ml-2">
              <span className="text-neon-pink font-bold">BETA</span>
              <span className="text-2xl font-mono text-white">{scores[1]}</span>
              <div className="flex flex-col items-center mt-2 w-full border-t border-dark-700 pt-2 gap-1">
                {betaPlayers.map(p => (
                  <div key={p.id} className="flex flex-col items-center text-xs">
                     <span className="text-lg">{p.avatar}</span>
                     <span className="text-gray-400 truncate max-w-[60px] text-[10px]">{p.username}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {myPlayer && (
            <div className="text-center mt-2 text-gray-300">
              You are playing as: <span className="font-bold text-xl text-white">{myPlayer.symbol}</span>
            </div>
          )}
        </div>

        {/* Turn Status */}
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
          isMyTurn 
            ? 'bg-dark-800 border-neon-green shadow-[0_0_15px_rgba(0,255,0,0.2)]' 
            : 'bg-dark-900 border-dark-700'
        }`}>
          {!isActive ? (
            <>
              <span className="text-xl font-bold text-neon-pink mb-1">GAME OVER</span>
              <span className="text-sm text-gray-300">
                {winner === 'draw' ? 'It\'s a draw!' : winner === playerInfo?.id ? 'You won!' : 'You lost!'}
              </span>
            </>
          ) : isMyTurn ? (
            <>
              <span className="text-neon-green font-bold text-xl mb-1">YOUR TURN</span>
              <span className="text-sm text-gray-300">Make your move!</span>
            </>
          ) : (
            <>
              <span className="text-gray-400 font-bold text-lg mb-1">WAITING...</span>
              <span className="text-sm text-gray-500">Opponent is thinking.</span>
            </>
          )}
        </div>

        <button 
          onClick={() => {
            if(window.confirm('Are you sure you want to surrender and leave the game?')) {
              socket.emit('leave_game');
              if (onLeaveGame) onLeaveGame();
            }
          }}
          className="w-full mt-2 py-2 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded transition uppercase text-sm tracking-wider"
        >
          Surrender / Leave
        </button>

      </div>

      {/* RIGHT COLUMN: Grid & Logs */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4">
        
        {/* Game Grid */}
        <div className="glass-panel p-6 flex justify-center items-center">
          <div className="grid grid-cols-3 gap-2 w-full max-w-[400px] aspect-square bg-dark-700 border-4 border-dark-700 rounded overflow-hidden">
            {grid.map((cell, index) => (
              <div 
                key={index} 
                onClick={() => handleCellClick(index)}
                className={`flex items-center justify-center text-6xl font-bold transition-all bg-dark-900 
                  ${cell === null && isMyTurn && isActive ? 'hover:bg-dark-800 cursor-pointer' : ''}
                  ${cell === 'X' ? 'text-neon-blue' : 'text-neon-pink'}
                `}
              >
                {cell}
              </div>
            ))}
          </div>
        </div>

        {/* Action Log */}
        <div className="glass-panel p-4 h-48 overflow-hidden flex flex-col">
          <h3 className="font-bold text-gray-400 text-sm tracking-widest uppercase mb-2 border-b border-dark-700 pb-2">Action Log</h3>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-2">
            {logs.map((log, idx) => (
              <div key={idx} className={`text-sm py-1 ${idx === 0 ? 'text-white font-semibold' : 'text-gray-500'}`}>
                <span className="text-gray-600 mr-2 text-xs">{(new Date()).toLocaleTimeString()}</span>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default TicTacToeGame;
