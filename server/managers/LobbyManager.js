class LobbyManager {
  constructor(io) {
    this.io = io;
    this.players = {}; // playerId -> { id: playerId, socketId, username, avatar, roomId, team: -1, ready: false }
    this.socketToPlayer = {}; // socket.id -> playerId
    this.rooms = {}; // roomId -> { players: Set(playerId), gameStarted: false }
  }

  handleJoin(socket, { id: playerId, username, avatar, roomId }) {
    if (!roomId) roomId = 'default_lobby';
    
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = { players: new Set(), gameStarted: false, selectedGame: 'treasure_hunt' };
    }

    this.socketToPlayer[socket.id] = playerId;

    if (this.players[playerId]) {
      // Reconnecting
      this.players[playerId].socketId = socket.id;
      this.players[playerId].username = username;
      this.players[playerId].avatar = avatar;
      this.players[playerId].roomId = roomId;
    } else {
      // New player
      this.players[playerId] = {
        id: playerId,
        socketId: socket.id,
        username,
        avatar,
        roomId,
        team: -1,
        ready: false
      };
    }

    this.rooms[roomId].players.add(playerId);
    socket.join(roomId);

    this.broadcastLobbyState(roomId);
  }

  handleLeave(socket) {
    const playerId = this.socketToPlayer[socket.id];
    if (playerId) {
      const roomId = this.players[playerId]?.roomId;
      if (roomId && this.rooms[roomId]) {
        this.rooms[roomId].players.delete(playerId);
        this.broadcastLobbyState(roomId);
      }
      delete this.players[playerId];
      delete this.socketToPlayer[socket.id];
      socket.leave(roomId);
    }
  }

  handleDisconnect(socket) {
    const playerId = this.socketToPlayer[socket.id];
    if (playerId) {
      if (this.players[playerId]) {
        this.players[playerId].socketId = null;
      }
      delete this.socketToPlayer[socket.id];
      // Keep player in the room/game state to allow refresh reconnects
    }
  }

  handleTeamSelection(socket, { team }) {
    const playerId = this.socketToPlayer[socket.id];
    const player = this.players[playerId];
    if (player) {
      player.team = team;
      this.broadcastLobbyState(player.roomId);
    }
  }

  handleReady(socket) {
    const playerId = this.socketToPlayer[socket.id];
    const player = this.players[playerId];
    if (player) {
      player.ready = !player.ready;
      this.broadcastLobbyState(player.roomId);
    }
  }

  handleGameSelection(socket, { game }) {
    const playerId = this.socketToPlayer[socket.id];
    const player = this.players[playerId];
    if (player && this.rooms[player.roomId]) {
      this.rooms[player.roomId].selectedGame = game;
      this.broadcastLobbyState(player.roomId);
    }
  }

  broadcastLobbyState(roomId) {
    const room = this.rooms[roomId];
    if (room) {
      const roomPlayers = Array.from(room.players).map(id => this.players[id]).filter(p => p);
      this.io.to(roomId).emit('lobby_update', { 
        players: roomPlayers,
        selectedGame: room.selectedGame
      });
    }
  }

  getPlayerRoom(socketId) {
    const playerId = this.socketToPlayer[socketId];
    return this.players[playerId]?.roomId;
  }

  isRoomReady(roomId) {
    const room = this.rooms[roomId];
    if (!room || room.players.size === 0) return false;
    
    let teamACount = 0;
    let teamBCount = 0;

    for (let playerId of room.players) {
      const p = this.players[playerId];
      if (!p || !p.ready) return false;
      if (p.team === 0) teamACount++;
      if (p.team === 1) teamBCount++;
    }

    if (room.selectedGame === 'tic_tac_toe') {
        if (teamACount !== 1 || teamBCount !== 1) return false;
    } else {
        // Treasure hunt strictly requires 2 players per team (4 players total)
        if (teamACount !== 2 || teamBCount !== 2) return false;
    }

    return true;
  }
}

module.exports = LobbyManager;
