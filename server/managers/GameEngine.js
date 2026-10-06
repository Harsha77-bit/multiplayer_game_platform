const PlatformState = require('./PlatformState');

class GameEngine {
  constructor(io, lobbyManager) {
    this.io = io;
    this.lobbyManager = lobbyManager;
    this.games = {}; // roomId -> game state
  }

  startGame(roomId) {
    const roomPlayers = Array.from(this.lobbyManager.rooms[roomId].players).map(id => this.lobbyManager.players[id]).filter(p => p);
    
    // Fetch config from global platform state
    const { gridSize, maxTreasures, pointsPerTreasure } = PlatformState.globalGameConfig;
    
    // Store points configuration in the game instance
    this.games[roomId] = {
      pointsPerTreasure
    };
    
    // Initialize Grid
    const grid = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill(null).map(() => ({
        treasure: 0,
        treasure_found: 0,
        player_id: null,
        visited: 0
      }))
    );

    // Place Treasures
    let treasuresPlaced = 0;
    while(treasuresPlaced < maxTreasures) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      if (grid[x][y].treasure === 0) {
        grid[x][y].treasure = 1;
        treasuresPlaced++;
      }
    }

    // Place Players
    const gamePlayers = {};
    let turnOrder = [];
    roomPlayers.forEach(p => {
      let placed = false;
      while(!placed) {
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);
        if (grid[x][y].player_id === null && grid[x][y].treasure === 0) {
          grid[x][y].player_id = p.id;
          gamePlayers[p.id] = { ...p, x, y };
          turnOrder.push(p.id);
          placed = true;
        }
      }
    });

    this.games[roomId] = {
      ...this.games[roomId], // keep the pointsPerTreasure
      grid,
      gridSize,
      players: gamePlayers,
      turnOrder,
      currentTurnIndex: 0,
      scores: { 0: 0, 1: 0 }, // Team A: 0, Team B: 0
      treasuresLeft: maxTreasures,
      totalTreasures: maxTreasures,
      isActive: true,
      logs: ['Game started! May the best team win.']
    };

    this.broadcastGameState(roomId);
  }

  broadcastGameState(roomId) {
    const game = this.games[roomId];
    if (game) {
      // Create a masked grid for clients to avoid cheating (hiding undiscovered treasures)
      const clientGrid = game.grid.map(row => 
        row.map(cell => ({
          ...cell,
          treasure: cell.treasure_found ? 1 : 0 // Hide undiscovered
        }))
      );

      const currentPlayerId = game.turnOrder[game.currentTurnIndex];
      this.io.to(roomId).emit('game_update', {
        grid: clientGrid,
        gridSize: game.gridSize,
        players: game.players,
        turnOrder: game.turnOrder,
        scores: game.scores,
        treasuresLeft: game.treasuresLeft,
        currentTurnPlayerId: currentPlayerId,
        logs: game.logs,
        isActive: game.isActive
      });
    }
  }

  handleMove(socket, data) {
    const playerId = this.lobbyManager.socketToPlayer[socket.id];
    const roomId = this.lobbyManager.getPlayerRoom(socket.id);
    const game = this.games[roomId];
    
    if (!game || !game.isActive || !playerId) return;

    if (game.turnOrder[game.currentTurnIndex] !== playerId) {
        return; // ignore out of turn moves
    }

    const { targetX, targetY } = data;
    if (targetX === undefined || targetY === undefined) return;

    const p = game.players[playerId];

    if (targetX < 0 || targetX >= game.gridSize || targetY < 0 || targetY >= game.gridSize) return;
    if (game.grid[targetX][targetY].visited === 1 || game.grid[targetX][targetY].player_id !== null) {
      game.logs.unshift(`Player ${p.username} tried to move to an invalid cell.`);
      this.broadcastGameState(roomId);
      return;
    }

    // Vacate old cell
    game.grid[p.x][p.y].player_id = null;
    if (!game.grid[p.x][p.y].treasure_found && !game.grid[p.x][p.y].treasure) {
        game.grid[p.x][p.y].visited = 1;
    }

    // Move player
    p.x = targetX;
    p.y = targetY;

    // Check for treasure
    if (game.grid[targetX][targetY].treasure === 1 && game.grid[targetX][targetY].treasure_found === 0) {
        game.grid[targetX][targetY].treasure_found = 1;
        game.grid[targetX][targetY].treasure = 0; // consumed
        game.grid[targetX][targetY].visited = 1; // Mark visited so it gets blocked
        game.scores[p.team] += (game.pointsPerTreasure || 50); 
        game.treasuresLeft--;
        game.logs.unshift(`Player ${p.username} found a treasure! (+${game.pointsPerTreasure || 50} points)`);
    } else {
        game.grid[targetX][targetY].visited = 1;
        game.logs.unshift(`Player ${p.username} moved to unvisited cell.`);
    }

    game.grid[targetX][targetY].player_id = playerId;
    
    // Check win condition
    if (game.treasuresLeft <= 0) {
        game.isActive = false;
        const winnerTeamIndex = game.scores[0] > game.scores[1] ? 0 : (game.scores[1] > game.scores[0] ? 1 : -1);
        game.winner = winnerTeamIndex === 0 ? 'Team Alpha' : (winnerTeamIndex === 1 ? 'Team Beta' : 'Draw');
        game.logs.unshift(`Game Over! ${game.winner} wins!`);
        
        PlatformState.recordGameResult({
            winner: winnerTeamIndex,
            treasuresFound: game.totalTreasures
        });
    } else {
        game.currentTurnIndex = (game.currentTurnIndex + 1) % game.turnOrder.length;
    }

    // Keep logs small
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

    // Remove player from board
    game.grid[p.x][p.y].player_id = null;
    game.logs.unshift(`Player ${p.username} abandoned the mission.`);

    // Remove from turn order
    game.turnOrder = game.turnOrder.filter(id => id !== playerId);
    
    // Check if team is empty
    let team0Count = 0;
    let team1Count = 0;
    game.turnOrder.forEach(id => {
       if (game.players[id].team === 0) team0Count++;
       if (game.players[id].team === 1) team1Count++;
    });

    if (team0Count === 0 || team1Count === 0) {
       game.isActive = false;
       const winnerTeamIndex = team0Count === 0 ? 1 : 0;
       const winner = winnerTeamIndex === 1 ? 'Team Beta' : 'Team Alpha';
       game.winner = winner;
       game.logs.unshift(`Game Over! ${team0Count === 0 ? 'Team Alpha' : 'Team Beta'} surrendered.`);
       
       PlatformState.recordGameResult({
            winner: winnerTeamIndex,
            treasuresFound: game.totalTreasures - game.treasuresLeft
       });
    } else {
       // Adjust turn index
       if (game.turnOrder.length > 0) {
         game.currentTurnIndex = game.currentTurnIndex % game.turnOrder.length;
       }
    }

    this.broadcastGameState(roomId);
  }
}

module.exports = GameEngine;
