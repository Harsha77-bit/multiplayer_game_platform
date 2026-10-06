import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Shield, Trophy } from 'lucide-react';

function TreasureHuntGame({ socket, gameState, playerInfo, onLeaveGame }) {
  const [steps, setSteps] = useState(1);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (gameState && gameState.currentTurnPlayerId === playerInfo?.id) {
      setIsMyTurn(true);
    } else {
      setIsMyTurn(false);
    }
  }, [gameState, playerInfo]);

  const handleCellClick = (rIndex, cIndex) => {
    if (isMyTurn && gameState?.isActive && !gameState.grid[rIndex][cIndex].visited && !gameState.grid[rIndex][cIndex].player_id) {
      socket.emit('player_move', { targetX: rIndex, targetY: cIndex });
    }
  };

  if (!gameState) {
    return <div className="text-white">Loading game...</div>;
  }

  const { grid, players, scores, logs, isActive } = gameState;
  const myPlayer = players[playerInfo?.id];
  
  const alphaPlayers = Object.values(players || {}).filter(p => p.team === 0);
  const betaPlayers = Object.values(players || {}).filter(p => p.team === 1);

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gameState.gridSize}, 1fr)`,
    gridTemplateRows: `repeat(${gameState.gridSize}, 1fr)`,
    gap: '2px',
    backgroundColor: '#1e1e2d',
    border: '4px solid #14141f',
    borderRadius: '0.5rem',
    overflow: 'hidden'
  };

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
          <div className="text-center text-sm text-gray-400 mt-2">
            Treasures Remaining: <span className="text-yellow-400 font-bold">{gameState.treasuresLeft}</span>
          </div>
        </div>

        {/* Turn Status */}
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
          isMyTurn 
            ? 'bg-dark-800 border-neon-green shadow-[0_0_15px_rgba(0,255,0,0.2)]' 
            : 'bg-dark-900 border-dark-700'
        }`}>
          {!isActive ? (
            <span className="text-xl font-bold text-red-500">GAME OVER</span>
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

        {/* Controls */}
        <div className="glass-panel p-4 flex flex-col items-center gap-2 relative">
           <h3 className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-2">How to Play</h3>
           <p className="text-gray-300 text-sm text-center">Tap or click on any unvisited dark square on the board to teleport your avatar there and uncover what lies beneath!</p>
           <p className="text-neon-pink text-sm text-center mt-2 font-semibold mb-4">Coordinate your team, block your opponents, and collect 5 treasures to win.</p>
           
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
      </div>

      {/* RIGHT COLUMN: Grid & Logs */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4">
        
        {/* Game Grid */}
        <div className="glass-panel p-6 flex justify-center items-center">
          <div style={gridStyle} className="w-full max-w-[500px] aspect-square">
            {grid.map((row, rIndex) => (
              row.map((cell, cIndex) => {
                let cellContent = null;
                let bgClass = "bg-dark-900"; // default unexplored

                if (cell.visited) bgClass = "bg-dark-700"; // explored track

                if (cell.treasure) {
                  cellContent = <Trophy className="text-yellow-400 animate-bounce" size={20} />;
                  bgClass = "bg-dark-800 shadow-[inset_0_0_10px_rgba(255,215,0,0.3)]";
                }

                if (cell.player_id) {
                  const p = players[cell.player_id];
                  cellContent = <span className="text-sm sm:text-xl leading-none z-10">{p?.avatar}</span>;
                  // highlight cell based on team
                  bgClass = p?.team === 0 ? 'bg-blue-900/50' : 'bg-pink-900/50';
                }

                return (
                  <div 
                    key={`${rIndex}-${cIndex}`} 
                    onClick={() => handleCellClick(rIndex, cIndex)}
                    className={`${bgClass} flex items-center justify-center transition-colors relative aspect-square overflow-hidden
                    ${!cell.visited && !cell.player_id && isMyTurn && isActive ? 'cursor-pointer hover:ring-2 hover:ring-neon-green hover:z-20' : ''}`}
                  >
                    {/* Fog of war effect for unvisited empty spaces could be added here */}
                    {cellContent}
                  </div>
                );
              })
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

export default TreasureHuntGame;
