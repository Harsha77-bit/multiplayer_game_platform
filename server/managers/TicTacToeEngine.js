const PlatformState = require('./PlatformState');

class TicTacToeEngine {
  constructor(io, lobbyManager) {
    this.io = io;
    this.lobbyManager = lobbyManager;
    this.games = {}; // roomId -> game state
  }

  startGame(roomId) {
    const roomPlayers = Array.from(this.lobbyManager.rooms[roomId].players).map(id => this.lobbyManager.players[id]).filter(p => p);
    
    // We expect exactly 2 players. One from team 0, one from team 1.
    const playerA = roomPlayers.find(p => p.team === 0);
    const playerB = roomPlayers.find(p => p.team === 1);

    if (!playerA || !playerB) {
        console.error("TicTacToe requires exactly one player in Team Alpha and one in Team Beta.");
        return;
    }

    const gamePlayers = {
        [playerA.id]: { ...playerA, symbol: 'X' },
        [playerB.id]: { ...playerB, symbol: 'O' }
    };

    const turnOrder = [playerA.id, playerB.id];

    this.games[roomId] = {
      grid: Array(9).fill(null), // 3x3 flat array
      players: gamePlayers,
      turnOrder,
      currentTurnIndex: 0,
      scores: { 0: 0, 1: 0 },
      isActive: true,
      winner: null, // null, playerId, or 'draw'
      logs: ['Tic Tac Toe started! X goes first.']
    };

    this.broadcastGameState(roomId);
  }

  broadcastGameState(roomId) {
    const game = this.games[roomId];
    if (game) {
      const currentPlayerId = game.turnOrder[game.currentTurnIndex];
      this.io.to(roomId).emit('game_update', {
        gameType: 'tic_tac_toe',
        grid: game.grid,
        players: game.players,
        turnOrder: game.turnOrder,
        scores: game.scores,
        currentTurnPlayerId: currentPlayerId,
        logs: game.logs,
        isActive: game.isActive,
        winner: game.winner
      });
    }
  }

  handleMove(socket, { cellIndex }) {
    const playerId = this.lobbyManager.socketToPlayer[socket.id];
    const roomId = this.lobbyManager.getPlayerRoom(socket.id);
    const game = this.games[roomId];
    
    if (!game || !game.isActive || !playerId) return;
    
    if (game.turnOrder[game.currentTurnIndex] !== playerId) {
        return; // out of turn
    }

    if (cellIndex < 0 || cellIndex > 8 || game.grid[cellIndex] !== null) {
        return; // invalid move
    }

    const p = game.players[playerId];
    game.grid[cellIndex] = p.symbol;
    game.logs.unshift(`${p.username} placed ${p.symbol}`);

    const winningLines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];

    let won = false;
    for (let line of winningLines) {
        const [a, b, c] = line;
        if (game.grid[a] && game.grid[a] === game.grid[b] && game.grid[a] === game.grid[c]) {
            won = true;
            break;
        }
    }

    if (won) {
        game.isActive = false;
        game.winner = playerId;
        game.scores[p.team] += 100;
        game.logs.unshift(`Game Over! ${p.username} wins!`);
        
        PlatformState.recordGameResult({
            winner: p.team,
            treasuresFound: 0
        });
    } else if (!game.grid.includes(null)) {
        game.isActive = false;
        game.winner = 'draw';
        game.logs.unshift(`Game Over! It's a draw!`);
        
        PlatformState.recordGameResult({
            winner: -1,
            treasuresFound: 0
        });
    } else {
        game.currentTurnIndex = (game.currentTurnIndex + 1) % game.turnOrder.length;
    }

    if (game.logs.length > 5) game.logs.pop();

    this.broadcastGameState(roomId);
  }

  handleDisconnect(socket) {
    // Kept for soft disconnects
  }

  handleLeaveGame(socket) {
    const playerId = this.lobbyManager.socketToPlayer[socket.id];
    const roomId = this.lobbyManager.getPlayerRoom(socket.id);
    const game = this.games[roomId];
    
    if (!game || !game.isActive || !playerId) return;

    const p = game.players[playerId];
    if (!p) return;

    game.logs.unshift(`Player ${p.username} surrendered!`);
    game.isActive = false;
    
    // The other player wins
    const otherPlayerId = game.turnOrder.find(id => id !== playerId);
    if (otherPlayerId) {
       game.winner = otherPlayerId;
       const otherPlayer = game.players[otherPlayerId];
       if (otherPlayer) {
           game.scores[otherPlayer.team] += 100;
           PlatformState.recordGameResult({
               winner: otherPlayer.team,
               treasuresFound: 0
           });
       }
    }
    
    this.broadcastGameState(roomId);
  }
}

module.exports = TicTacToeEngine;
