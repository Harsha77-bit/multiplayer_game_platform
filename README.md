# Nexus Hub: Multi-Player Game Platform

Nexus Hub is a real-time, event-driven multiplayer gaming platform built for seamless cross-device play. It enables multi-user team formation, dynamic game configuration via APIs, global analytics, and synchronized gameplay across different physical machines. 

The platform currently hosts two primary games: **Treasure Hunt** and **Tic-Tac-Toe**.

---

## 🚀 Features

- **Cross-Device Persistence:** Log in from your PC, seamlessly reconnect from your mobile phone, and maintain your state and active game connection using persistent client-side IDs.
- **Team-Based Matchmaking:** Form multi-user teams (Team Alpha vs Team Beta) in isolated game rooms.
- **Event-Driven Architecture:** Near-instantaneous game state synchronization using WebSockets.
- **Creator Studio (Dynamic Configuration):** A REST API-backed dashboard allowing creators to upload and modify game rules dynamically (e.g., changing grid sizes, point values, or max treasures).
- **Global Analytics Dashboard:** Persistent tracking of total matches played, team win rates, and global objectives achieved.
- **Premium UI/UX:** A highly responsive, glassmorphism-inspired dark-mode aesthetic built with Tailwind CSS, optimized for both desktop and mobile screens.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** React.js powered by Vite for lightning-fast HMR and optimized builds.
- **Styling:** Tailwind CSS for utility-first styling and custom CSS grid layouts.
- **Icons:** Lucide-React.
- **Real-Time Communication:** `socket.io-client`.

### Backend (Server)
- **Runtime:** Node.js.
- **API Routing:** Express.js for REST endpoints (Creator Studio & Analytics).
- **Real-Time Communication:** `socket.io` for event-driven WebSocket connections.
- **Architecture:** Monolithic service with distinct, stateful managers (`GameEngine`, `TicTacToeEngine`, `LobbyManager`, `PlatformState`).

---

## 🏗️ Architecture & Workflow

The platform operates on a hybrid architecture, combining **RESTful APIs** for configuration and analytics with a heavily **Event-Driven WebSocket** system for live gameplay.

1. **PlatformState Singleton:** Acts as the central memory store for the server. It handles REST API payloads from the Creator Studio and serves them to Game Engines to dynamically construct game worlds.
2. **LobbyManager:** Manages socket connections, user profiles, team assignments (Alpha/Beta), and room isolation. Ensures players joining mid-game or refreshing their browser are instantly synced back into their active room.
3. **GameEngines (TicTacToe & TreasureHunt):** 
   - Receives player inputs (e.g., `player_move`).
   - Validates the move against the server-side authoritative grid.
   - Updates scores and checks win conditions.
   - Broadcasts masked game states to clients to prevent network snooping (e.g., hiding undiscovered treasures).
   - Upon game completion or team surrender, pushes results to the `PlatformState` for global analytics.

---

## 🎮 Gameplay Mechanics

### 1. Treasure Hunt
- **Objective:** Find the hidden treasures on a dynamically sized N x N grid before the opposing team.
- **Mechanics:** 
  - Turn-based movement. Players can click on any valid, unvisited cell on the grid.
  - If a treasure is found, the player's team is awarded points (dynamically configured via Creator Studio) and the cell is permanently marked with a trophy.
  - The game ends when all treasures are found or one team surrenders.

### 2. Tic-Tac-Toe
- **Objective:** Get three of your team's symbols in a row (horizontally, vertically, or diagonally).
- **Mechanics:** 
  - A classic 1v1 battle where one player from Team Alpha faces one player from Team Beta.
  - Standard 3x3 grid, turn-based.
  - The winning team is awarded a flat 100 points, boosting their global team win rate on the Analytics dashboard.

---

## ⚙️ How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- NPM or Yarn

### 1. Start the Backend Server
```bash
cd server
npm install
node index.js
```
The server will start on `http://localhost:8080`.

### 2. Start the Frontend Client
```bash
cd client
npm install
npm run dev -- --host
```
The client will start on `http://localhost:5173`. 
*(Note: The `--host` flag exposes the Vite server to your local network, allowing you to connect from your mobile phone using your computer's local IP address).*

---

## 📜 API Endpoints

- `GET /api/games/config`: Fetches the current global ruleset for games.
- `POST /api/games/config`: Uploads a new ruleset (Grid Size, Max Treasures, Win Conditions).
- `GET /api/analytics`: Fetches global server statistics.

---
*Built as a comprehensive Multi-Player Game Platform fulfilling requirements for Micro-service/Event-Driven architecture and Software Interface Design.*
