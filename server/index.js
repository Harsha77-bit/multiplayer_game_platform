const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const LobbyManager = require('./managers/LobbyManager');
const GameEngine = require('./managers/GameEngine');
const TicTacToeEngine = require('./managers/TicTacToeEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

const lobbyManager = new LobbyManager(io);
const gameEngine = new GameEngine(io, lobbyManager);
const ticTacToeEngine = new TicTacToeEngine(io, lobbyManager);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_lobby', (data) => {
    lobbyManager.handleJoin(socket, data);
    const roomId = lobbyManager.getPlayerRoom(socket.id);
    const room = lobbyManager.rooms[roomId];
    if (room && room.selectedGame === 'tic_tac_toe') {
      if (ticTacToeEngine.games[roomId] && ticTacToeEngine.games[roomId].isActive) {
        ticTacToeEngine.broadcastGameState(roomId);
      }
    } else {
      if (gameEngine.games[roomId] && gameEngine.games[roomId].isActive) {
        gameEngine.broadcastGameState(roomId);
      }
    }
  });

  socket.on('leave_lobby', () => {
    lobbyManager.handleLeave(socket);
  });

  socket.on('select_team', (data) => {
    lobbyManager.handleTeamSelection(socket, data);
  });

  socket.on('select_game', (data) => {
    lobbyManager.handleGameSelection(socket, data);
  });

  socket.on('toggle_ready', () => {
    lobbyManager.handleReady(socket);
    
    const roomId = lobbyManager.getPlayerRoom(socket.id);
    if (lobbyManager.isRoomReady(roomId)) {
      const room = lobbyManager.rooms[roomId];
      if (room.selectedGame === 'tic_tac_toe') {
        ticTacToeEngine.startGame(roomId);
      } else {
        gameEngine.startGame(roomId);
      }
    }
  });

  socket.on('player_move', (data) => {
    const roomId = lobbyManager.getPlayerRoom(socket.id);
    const room = lobbyManager.rooms[roomId];
    if (room && room.selectedGame === 'tic_tac_toe') {
      ticTacToeEngine.handleMove(socket, data);
    } else {
      gameEngine.handleMove(socket, data);
    }
  });

  socket.on('leave_game', () => {
    const roomId = lobbyManager.getPlayerRoom(socket.id);
    const room = lobbyManager.rooms[roomId];
    if (room && room.selectedGame === 'tic_tac_toe') {
      ticTacToeEngine.handleLeaveGame(socket);
    } else {
      gameEngine.handleLeaveGame(socket);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    lobbyManager.handleDisconnect(socket);
    gameEngine.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Nexus Game Platform server running on port ${PORT}`);
});
