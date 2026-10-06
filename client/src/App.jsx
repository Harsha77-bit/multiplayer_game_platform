import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Lobby from './components/Lobby';
import CreatorStudio from './components/CreatorStudio';
import TreasureHuntGame from './components/TreasureHuntGame';
import TicTacToeGame from './components/TicTacToeGame';

const BACKEND_URL = `http://${window.location.hostname}:8080`;
const socket = io(BACKEND_URL);

function App() {
  const [view, setView] = useState('login'); // login, lobby, studio, game
  const [playerInfo, setPlayerInfo] = useState(null);
  const [lobbyData, setLobbyData] = useState({ players: [] });
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const savedPlayer = localStorage.getItem('nexus_player');
    if (savedPlayer) {
      const info = JSON.parse(savedPlayer);
      setPlayerInfo(info);
      setView('lobby');
      socket.emit('join_lobby', info);
    }
  }, []);

  useEffect(() => {
    socket.on('lobby_update', (data) => {
      setLobbyData(data);
    });

    socket.on('game_update', (data) => {
      setGameState(data);
      if (data.isActive !== undefined && !data.isActive && view !== 'game') {
          // If a game ends, might want to show results, but for now we'll just switch to game view if we're not there
          setView('game');
      }
    });

    return () => {
      socket.off('lobby_update');
      socket.off('game_update');
    };
  }, [view]);

  // When game starts, switch to game view
  useEffect(() => {
      if (gameState && gameState.isActive && view !== 'game') {
          // Only switch if this player is still in the game
          const isPlayerInGame = gameState.turnOrder?.includes(playerInfo?.id);
          if (isPlayerInGame) {
              setView('game');
          }
      }
  }, [gameState, view, playerInfo]);

  const handleLogin = (info) => {
    const id = info.id || `user_${Math.random().toString(36).substr(2, 9)}`;
    const fullInfo = { ...info, id };
    localStorage.setItem('nexus_player', JSON.stringify(fullInfo));
    setPlayerInfo(fullInfo);
    setView('lobby');
    socket.emit('join_lobby', fullInfo);
  };

  const handleLeaveLobby = () => {
      socket.emit('leave_lobby');
      localStorage.removeItem('nexus_player');
      setPlayerInfo(null);
      setView('login');
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
      <header className="absolute top-0 w-full p-4 flex justify-between items-center border-b border-dark-700 bg-dark-900/50 backdrop-blur-md z-10">
        <h1 className="text-2xl font-bold tracking-wider text-white flex items-center gap-2">
           <span className="text-neon-blue">NEXUS</span> HUB
        </h1>
        {playerInfo && (
          <div className="flex gap-4">
            <button 
              onClick={() => setView('studio')}
              className="text-sm px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded border border-dark-700 transition"
            >
              Creator Studio
            </button>
            <button 
              onClick={() => {
                  setView('lobby');
                  if(!lobbyData.players.find(p => p.id === playerInfo.id)) {
                      socket.emit('join_lobby', playerInfo);
                  }
              }}
              className="text-sm px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded border border-dark-700 transition"
            >
              Lobby
            </button>
            <div className="flex items-center gap-2 bg-dark-800 px-3 py-1 rounded border border-dark-700">
              <span className="text-xl">{playerInfo.avatar}</span>
              <span className="font-semibold text-neon-blue">{playerInfo.username}</span>
            </div>
          </div>
        )}
      </header>

      <main className="w-full max-w-6xl mt-20 flex-1 flex flex-col items-center justify-center relative">
        {view === 'login' && <Login onLogin={handleLogin} />}
        {view === 'lobby' && <Lobby socket={socket} lobbyData={lobbyData} playerInfo={playerInfo} onLeave={handleLeaveLobby} />}
        {view === 'studio' && <CreatorStudio />}
        {view === 'game' && (!gameState?.gameType || gameState.gameType === 'treasure_hunt') && <TreasureHuntGame socket={socket} gameState={gameState} playerInfo={playerInfo} onLeaveGame={() => setView('lobby')} />}
        {view === 'game' && gameState?.gameType === 'tic_tac_toe' && <TicTacToeGame socket={socket} gameState={gameState} playerInfo={playerInfo} onLeaveGame={() => setView('lobby')} />}
      </main>
    </div>
  );
}

export default App;
