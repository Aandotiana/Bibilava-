/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GameState,
  Player,
  Orb,
  WORLD_SIZE,
  BASE_SPEED,
  BOOST_SPEED,
  TICK_RATE,
  MAX_ORBS,
  INITIAL_LENGTH,
  SEGMENT_SPACING,
  TURN_SPEED,
  RoomData,
  RoomPlayer,
  RoomSettings,
  ChatMessage,
} from './src/shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Allow configurable CORS origins for deployment (defaults to '*' for open access)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// Render dynamically assigns process.env.PORT (e.g. 10000)
const PORT = parseInt(process.env.PORT || '3000', 10);

const COLORS = [
  '#00f5ff', // Neon Cyan
  '#ff007f', // Neon Pink
  '#ffe600', // Neon Yellow
  '#00ff66', // Neon Green
  '#b026ff', // Neon Purple
  '#ff6600', // Neon Orange
  '#ffffff', // Neon Ghost White
  '#ff3333', // Neon Red
];

// Room-based state architecture
interface InternalRoom extends RoomData {
  gameState: GameState;
  countdownTimer?: NodeJS.Timeout;
  emptyTimeout?: NodeJS.Timeout;
}

const rooms: Record<string, InternalRoom> = {};
const socketRoomMap: Record<string, string> = {}; // socket.id -> roomCode

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

function createRoomOrbs(count = 120, density: 'normal' | 'high' = 'normal'): Record<string, Orb> {
  const finalCount = density === 'high' ? Math.floor(count * 1.5) : count;
  const orbs: Record<string, Orb> = {};
  for (let i = 0; i < finalCount; i++) {
    const id = uuidv4();
    orbs[id] = {
      id,
      x: (Math.random() - 0.5) * (WORLD_SIZE - 20),
      y: (Math.random() - 0.5) * (WORLD_SIZE - 20),
      value: Math.random() < 0.2 ? 3 : 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }
  return orbs;
}

function spawnOrbInRoom(room: InternalRoom, x?: number, y?: number, value = 1, color?: string, force = false) {
  const maxAllowed = room.settings.orbDensity === 'high' ? MAX_ORBS * 1.3 : MAX_ORBS;
  if (!force && Object.keys(room.gameState.orbs).length >= maxAllowed) return;
  const id = uuidv4();
  room.gameState.orbs[id] = {
    id,
    x: x ?? (Math.random() - 0.5) * WORLD_SIZE,
    y: y ?? (Math.random() - 0.5) * WORLD_SIZE,
    value,
    color: color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

function broadcastRoomUpdate(roomCode: string) {
  const room = rooms[roomCode];
  if (!room) return;
  const publicData: RoomData = {
    code: room.code,
    name: room.name,
    hostId: room.hostId,
    players: room.players,
    settings: room.settings,
    chat: room.chat,
    status: room.status,
    countdown: room.countdown,
    playAgainVotes: room.playAgainVotes,
    createdAt: room.createdAt,
    matchEndsAt: room.matchEndsAt,
  };
  io.to(`room_${roomCode}`).emit('room_updated', publicData);
}

function sendSystemChatMessage(roomCode: string, text: string) {
  const room = rooms[roomCode];
  if (!room) return;
  const msg: ChatMessage = {
    id: uuidv4(),
    senderId: 'system',
    senderName: 'SYSTEM',
    senderColor: '#00f5ff',
    text,
    timestamp: Date.now(),
    isSystem: true,
  };
  room.chat.push(msg);
  if (room.chat.length > 60) room.chat.shift();
  io.to(`room_${roomCode}`).emit('chat_message', msg);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // 1. CREATE PRIVATE ROOM
  socket.on('create_room', (data: { roomName?: string; playerName: string; avatar?: string; settings?: Partial<RoomSettings> }) => {
    // Leave previous room if any
    const prevRoom = socketRoomMap[socket.id];
    if (prevRoom) handleLeaveRoom(socket, prevRoom);

    const roomCode = generateRoomCode();
    const cleanPlayerName = (data?.playerName?.trim() || 'NeonHost').slice(0, 15);
    const roomName = (data?.roomName?.trim() || `${cleanPlayerName}'s Arena`).slice(0, 24);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const avatar = data?.avatar || 'viper';

    const defaultSettings: RoomSettings = {
      maxPlayers: Math.min(10, Math.max(2, data?.settings?.maxPlayers || 6)),
      gameMode: data?.settings?.gameMode || 'classic',
      durationMinutes: data?.settings?.durationMinutes ?? 3,
      orbDensity: data?.settings?.orbDensity || 'normal',
      speed: data?.settings?.speed || 'normal',
    };

    const hostPlayer: RoomPlayer = {
      id: socket.id,
      name: cleanPlayerName,
      color,
      avatar,
      isHost: true,
      isReady: true, // Host is always ready
      isSpeaking: false,
      isMicMuted: false,
      connected: true,
    };

    const newRoom: InternalRoom = {
      code: roomCode,
      name: roomName,
      hostId: socket.id,
      players: { [socket.id]: hostPlayer },
      settings: defaultSettings,
      chat: [],
      status: 'lobby',
      countdown: 0,
      playAgainVotes: [],
      createdAt: Date.now(),
      gameState: {
        players: {},
        orbs: createRoomOrbs(120, defaultSettings.orbDensity),
        leaderboard: [],
      },
    };

    rooms[roomCode] = newRoom;
    socketRoomMap[socket.id] = roomCode;
    socket.join(`room_${roomCode}`);

    sendSystemChatMessage(roomCode, `Welcome to ${roomName}! Room Code: ${roomCode}`);

    socket.emit('room_joined', {
      room: {
        code: newRoom.code,
        name: newRoom.name,
        hostId: newRoom.hostId,
        players: newRoom.players,
        settings: newRoom.settings,
        chat: newRoom.chat,
        status: newRoom.status,
        countdown: newRoom.countdown,
        playAgainVotes: newRoom.playAgainVotes,
        createdAt: newRoom.createdAt,
      },
      playerId: socket.id,
    });

    console.log(`Room created: ${roomCode} by ${cleanPlayerName}`);
  });

  // 2. JOIN PRIVATE ROOM
  socket.on('join_room', (data: { roomCode: string; playerName: string; avatar?: string }) => {
    const rawCode = data?.roomCode?.trim().toUpperCase() || '';
    const room = rooms[rawCode];

    if (!room) {
      socket.emit('error_room', { message: `Room "${rawCode}" does not exist. Check code or create a new room.` });
      return;
    }

    // Cancel empty timeout if room is being rejoined
    if (room.emptyTimeout) {
      clearTimeout(room.emptyTimeout);
      room.emptyTimeout = undefined;
    }

    const currentCount = Object.keys(room.players).length;
    if (currentCount >= room.settings.maxPlayers && !room.players[socket.id]) {
      socket.emit('error_room', { message: `Room "${rawCode}" is full (${room.settings.maxPlayers}/${room.settings.maxPlayers} players).` });
      return;
    }

    if (room.status === 'in_game' && !room.players[socket.id]) {
      socket.emit('error_room', { message: `Match is currently in progress in room "${rawCode}". Please wait for next round.` });
      return;
    }

    // Leave any previous room
    const prevRoom = socketRoomMap[socket.id];
    if (prevRoom && prevRoom !== rawCode) {
      handleLeaveRoom(socket, prevRoom);
    }

    const cleanPlayerName = (data?.playerName?.trim() || `Player-${Math.floor(Math.random() * 900 + 100)}`).slice(0, 15);
    const usedColors = new Set(Object.values(room.players).map((p) => p.color));
    const availableColor = COLORS.find((c) => !usedColors.has(c)) || COLORS[Math.floor(Math.random() * COLORS.length)];
    const avatar = data?.avatar || 'volt';

    // If room had become empty, re-joining player becomes host
    const isFirstPlayer = Object.keys(room.players).length === 0;
    if (isFirstPlayer) {
      room.hostId = socket.id;
    }

    const isHostPlayer = room.hostId === socket.id;

    const player: RoomPlayer = {
      id: socket.id,
      name: cleanPlayerName,
      color: availableColor,
      avatar,
      isHost: isHostPlayer,
      isReady: isHostPlayer,
      isSpeaking: false,
      isMicMuted: false,
      connected: true,
    };

    room.players[socket.id] = player;
    socketRoomMap[socket.id] = rawCode;
    socket.join(`room_${rawCode}`);

    sendSystemChatMessage(rawCode, `${cleanPlayerName} joined the lobby.`);

    socket.emit('room_joined', {
      room: {
        code: room.code,
        name: room.name,
        hostId: room.hostId,
        players: room.players,
        settings: room.settings,
        chat: room.chat,
        status: room.status,
        countdown: room.countdown,
        playAgainVotes: room.playAgainVotes,
        createdAt: room.createdAt,
        matchEndsAt: room.matchEndsAt,
      },
      playerId: socket.id,
    });

    broadcastRoomUpdate(rawCode);
    console.log(`Player ${cleanPlayerName} joined room ${rawCode}`);
  });

  // 3. TOGGLE READY STATUS
  socket.on('toggle_ready', (data: { roomCode?: string; isReady: boolean }) => {
    const roomCode = socketRoomMap[socket.id];
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room || !room.players[socket.id]) return;

    // Host is always ready
    if (socket.id === room.hostId) {
      room.players[socket.id].isReady = true;
    } else {
      room.players[socket.id].isReady = !!data.isReady;
    }

    broadcastRoomUpdate(roomCode);
  });

  // 4. UPDATE SETTINGS (Host only - strictly validated on backend)
  socket.on('update_settings', (data: { roomCode?: string; settings: Partial<RoomSettings> }) => {
    const roomCode = socketRoomMap[socket.id];
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room) return;

    if (socket.id !== room.hostId) {
      socket.emit('error_room', { message: 'Security check: Only the room host can modify game settings.' });
      return;
    }

    if (data.settings) {
      if (typeof data.settings.maxPlayers === 'number') {
        room.settings.maxPlayers = Math.min(10, Math.max(2, data.settings.maxPlayers));
      }
      if (data.settings.gameMode) {
        room.settings.gameMode = data.settings.gameMode;
      }
      if (typeof data.settings.durationMinutes === 'number') {
        room.settings.durationMinutes = data.settings.durationMinutes;
      }
      if (data.settings.orbDensity) {
        room.settings.orbDensity = data.settings.orbDensity;
        room.gameState.orbs = createRoomOrbs(120, room.settings.orbDensity);
      }
      if (data.settings.speed) {
        room.settings.speed = data.settings.speed;
      }
    }

    sendSystemChatMessage(roomCode, 'Host updated game settings.');
    broadcastRoomUpdate(roomCode);
  });

  // 5. KICK PLAYER (Host only - strictly validated on backend)
  socket.on('kick_player', (data: { roomCode?: string; targetId: string }) => {
    const roomCode = socketRoomMap[socket.id];
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room) return;

    if (socket.id !== room.hostId) {
      socket.emit('error_room', { message: 'Security check: Only the room host can remove players.' });
      return;
    }

    const targetId = data.targetId;
    if (!targetId || targetId === room.hostId || !room.players[targetId]) return;

    const kickedName = room.players[targetId].name;
    delete room.players[targetId];

    const targetSocket = io.sockets.sockets.get(targetId);
    if (targetSocket) {
      targetSocket.leave(`room_${roomCode}`);
      delete socketRoomMap[targetId];
      targetSocket.emit('kicked_from_room', { message: 'You have been removed from the lobby by the host.' });
    }

    sendSystemChatMessage(roomCode, `${kickedName} was removed from the lobby.`);
    broadcastRoomUpdate(roomCode);
  });

  // 6. START GAME (Host only - strictly validated on backend)
  socket.on('start_game', (data?: { roomCode?: string }) => {
    const roomCode = socketRoomMap[socket.id];
    if (!roomCode) return;
    const room = rooms[roomCode];
    if (!room) return;

    if (socket.id !== room.hostId) {
      socket.emit('error_room', { message: 'Security check: Only the room host can start the match.' });
      return;
    }

    if (room.status === 'in_game' || room.status === 'starting') return;

    // Check player ready status
    const allPlayers = Object.values(room.players);
    const nonHostPlayers = allPlayers.filter((p) => !p.isHost);
    const unreadyCount = nonHostPlayers.filter((p) => !p.isReady).length;

    if (unreadyCount > 0 && allPlayers.length > 1) {
      socket.emit('error_room', { message: `Cannot start yet: ${unreadyCount} player(s) not ready!` });
      return;
    }

    // Start 3-second synchronized countdown
    room.status = 'starting';
    room.countdown = 3;
    room.playAgainVotes = [];
    broadcastRoomUpdate(roomCode);
    sendSystemChatMessage(roomCode, 'Match starting in 3 seconds! Prepare your snakes...');

    if (room.countdownTimer) clearInterval(room.countdownTimer);

    room.countdownTimer = setInterval(() => {
      room.countdown -= 1;
      if (room.countdown <= 0) {
        if (room.countdownTimer) clearInterval(room.countdownTimer);
        room.status = 'in_game';
        room.countdown = 0;

        // Set match timer if configured
        if (room.settings.durationMinutes > 0) {
          room.matchEndsAt = Date.now() + room.settings.durationMinutes * 60 * 1000;
        } else {
          room.matchEndsAt = undefined;
        }

        // Spawn snakes for all room players in room's gameState
        const playerKeys = Object.keys(room.players);
        room.gameState.players = {};
        playerKeys.forEach((pid, index) => {
          const rp = room.players[pid];
          const angle = (index / Math.max(1, playerKeys.length)) * Math.PI * 2;
          const radius = 25;
          const startX = Math.cos(angle) * radius;
          const startY = Math.sin(angle) * radius;

          const segments = [];
          for (let i = 0; i < INITIAL_LENGTH; i++) {
            segments.push({
              x: startX - Math.cos(angle) * i * SEGMENT_SPACING,
              y: startY - Math.sin(angle) * i * SEGMENT_SPACING,
            });
          }

          room.gameState.players[pid] = {
            id: pid,
            name: rp.name,
            color: rp.color,
            segments,
            score: INITIAL_LENGTH,
            isBoosting: false,
            state: 'alive',
            currentAngle: angle,
            inputs: { left: false, right: false, boost: false },
          };
        });

        // Fresh orbs
        room.gameState.orbs = createRoomOrbs(120, room.settings.orbDensity);

        broadcastRoomUpdate(roomCode);
        io.to(`room_${roomCode}`).emit('game_started', {
          matchEndsAt: room.matchEndsAt,
        });
      } else {
        broadcastRoomUpdate(roomCode);
      }
    }, 1000);
  });

  // 7. RETURN TO LOBBY / PLAY AGAIN
  socket.on('vote_play_again', (data: { roomCode: string }) => {
    const roomCode = data?.roomCode || socketRoomMap[socket.id];
    const room = rooms[roomCode];
    if (!room) return;

    if (!room.playAgainVotes.includes(socket.id)) {
      room.playAgainVotes.push(socket.id);
    }

    const totalPlayers = Object.keys(room.players).length;
    // If majority or host votes, reset to lobby
    if (socket.id === room.hostId || room.playAgainVotes.length >= Math.ceil(totalPlayers / 2)) {
      room.status = 'lobby';
      room.matchEndsAt = undefined;
      room.playAgainVotes = [];
      // Reset ready status for non-host
      Object.values(room.players).forEach((p) => {
        p.isReady = p.isHost;
      });
      room.gameState.players = {};
      sendSystemChatMessage(roomCode, 'Returned to Lobby. Set ready to play another match!');
    }

    broadcastRoomUpdate(roomCode);
  });

  socket.on('return_to_lobby', (data: { roomCode: string }) => {
    const roomCode = data?.roomCode || socketRoomMap[socket.id];
    const room = rooms[roomCode];
    if (!room) return;

    if (socket.id === room.hostId) {
      room.status = 'lobby';
      room.matchEndsAt = undefined;
      room.playAgainVotes = [];
      Object.values(room.players).forEach((p) => {
        p.isReady = p.isHost;
      });
      sendSystemChatMessage(roomCode, 'Host returned the room to the Lobby.');
      broadcastRoomUpdate(roomCode);
    }
  });

  // 8. REAL-TIME CHAT
  socket.on('send_chat', (data: { roomCode: string; text: string }) => {
    const roomCode = data?.roomCode || socketRoomMap[socket.id];
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players[socket.id];
    const rawText = data?.text?.trim() || '';
    if (!rawText || !player) return;

    const cleanText = rawText.slice(0, 180);
    const msg: ChatMessage = {
      id: uuidv4(),
      senderId: socket.id,
      senderName: player.name,
      senderColor: player.color,
      text: cleanText,
      timestamp: Date.now(),
      isSystem: false,
    };

    room.chat.push(msg);
    if (room.chat.length > 80) room.chat.shift();
    io.to(`room_${roomCode}`).emit('chat_message', msg);
  });

  // 9. VOICE CHAT SIGNALING & STATUS
  socket.on('voice_signal', (data: { roomCode?: string; targetId: string; signal: any }) => {
    if (data?.targetId && data?.signal) {
      io.to(data.targetId).emit('voice_signal', {
        senderId: socket.id,
        signal: data.signal,
      });
    }
  });

  socket.on('voice_status', (data: { roomCode?: string; isSpeaking: boolean; isMicMuted: boolean }) => {
    const roomCode = data?.roomCode || socketRoomMap[socket.id];
    const room = rooms[roomCode];
    if (room && room.players[socket.id]) {
      room.players[socket.id].isSpeaking = !!data.isSpeaking;
      room.players[socket.id].isMicMuted = !!data.isMicMuted;
      socket.to(`room_${roomCode}`).emit('voice_status_update', {
        playerId: socket.id,
        isSpeaking: !!data.isSpeaking,
        isMicMuted: !!data.isMicMuted,
      });
    }
  });

  // 10. GAMEPLAY UPDATES (Per room)
  socket.on('update_state', (data: { roomCode?: string; segments: any[]; score: number; currentAngle: number; isBoosting: boolean; state: string }) => {
    const roomCode = data?.roomCode || socketRoomMap[socket.id];
    const room = rooms[roomCode];
    if (!room || room.status !== 'in_game') return;

    const player = room.gameState.players[socket.id];
    if (player && player.state === 'alive' && Array.isArray(data?.segments) && data.segments.length > 0) {
      player.segments = data.segments;
      player.score = data.score;
      player.currentAngle = data.currentAngle;
      player.isBoosting = data.isBoosting;

      if (data.state === 'dead') {
        player.state = 'dead';
        sendSystemChatMessage(roomCode, `💀 ${player.name} crashed! Length: ${Math.floor(player.score)}`);
        // Drop orbs on death
        player.segments.forEach((seg, i) => {
          if (i % 2 === 0) spawnOrbInRoom(room, seg.x, seg.y, 1, player.color, true);
        });

        // Check if all players dead -> end match
        const aliveCount = Object.values(room.gameState.players).filter((p) => p.state === 'alive').length;
        if (aliveCount <= 1 && Object.keys(room.gameState.players).length > 1) {
          const winner = Object.values(room.gameState.players).find((p) => p.state === 'alive');
          if (winner) {
            sendSystemChatMessage(roomCode, `🏆 Victory! ${winner.name} is the last snake standing!`);
          }
          room.status = 'game_over';
          broadcastRoomUpdate(roomCode);
        }
      }
    }
  });

  socket.on('collect_orb', (data: { roomCode?: string; orbId: string } | string) => {
    const orbId = typeof data === 'string' ? data : data?.orbId;
    const roomCode = (typeof data !== 'string' && data?.roomCode) ? data.roomCode : socketRoomMap[socket.id];
    const room = rooms[roomCode];
    if (room && room.gameState.orbs[orbId]) {
      delete room.gameState.orbs[orbId];
    }
  });

  // 11. LEAVE & DISCONNECT
  socket.on('leave_room', () => {
    const roomCode = socketRoomMap[socket.id];
    if (roomCode) {
      handleLeaveRoom(socket, roomCode);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const roomCode = socketRoomMap[socket.id];
    if (roomCode) {
      handleLeaveRoom(socket, roomCode);
    }
  });
});

function handleLeaveRoom(socket: any, roomCode: string) {
  const room = rooms[roomCode];
  if (!room) return;

  const leavingPlayer = room.players[socket.id];
  const playerName = leavingPlayer?.name || 'A player';

  delete room.players[socket.id];
  delete socketRoomMap[socket.id];
  socket.leave(`room_${roomCode}`);

  socket.to(`room_${roomCode}`).emit('voice_player_disconnected', { playerId: socket.id });

  // Drop orbs in game if leaving alive
  const gsPlayer = room.gameState.players[socket.id];
  if (gsPlayer && gsPlayer.state === 'alive') {
    gsPlayer.segments.forEach((seg, i) => {
      if (i % 2 === 0) spawnOrbInRoom(room, seg.x, seg.y, 1, gsPlayer.color, true);
    });
    delete room.gameState.players[socket.id];
  }

  const remainingPlayers = Object.keys(room.players);

  if (remainingPlayers.length === 0) {
    // 30-second grace period before deleting empty room to survive refreshes and reconnects
    if (room.countdownTimer) clearInterval(room.countdownTimer);
    if (room.emptyTimeout) clearTimeout(room.emptyTimeout);
    room.emptyTimeout = setTimeout(() => {
      if (rooms[roomCode] && Object.keys(rooms[roomCode].players).length === 0) {
        delete rooms[roomCode];
        console.log(`Room ${roomCode} deleted after 30s empty grace period`);
      }
    }, 30000);
  } else {
    // Transfer host if host left
    if (room.hostId === socket.id) {
      const newHostId = remainingPlayers[0];
      room.hostId = newHostId;
      room.players[newHostId].isHost = true;
      room.players[newHostId].isReady = true;
      sendSystemChatMessage(roomCode, `${playerName} left. ${room.players[newHostId].name} is now the HOST!`);
    } else {
      sendSystemChatMessage(roomCode, `${playerName} left the room.`);
    }
    broadcastRoomUpdate(roomCode);
  }
}

// Room-based game loop
const gameLoopInterval = setInterval(() => {
  for (const code in rooms) {
    const room = rooms[code];
    if (room.status !== 'in_game') continue;

    // Check match time limit
    if (room.matchEndsAt && Date.now() >= room.matchEndsAt) {
      room.status = 'game_over';
      room.matchEndsAt = undefined;
      sendSystemChatMessage(code, '⏰ Time is up! Match ended.');
      broadcastRoomUpdate(code);
      continue;
    }

    // Boost orb drop and movement effects
    for (const id in room.gameState.players) {
      const player = room.gameState.players[id];
      if (player.state === 'alive' && player.isBoosting) {
        if (Math.random() < 0.1 && player.segments.length > 0) {
          const tail = player.segments[player.segments.length - 1];
          spawnOrbInRoom(room, tail.x, tail.y, 1, player.color, true);
        }
      }
    }

    // Spawn random orbs
    const spawnChance = room.settings.orbDensity === 'high' ? 0.35 : 0.2;
    if (Math.random() < spawnChance) {
      spawnOrbInRoom(room);
    }

    // Update room leaderboard
    room.gameState.leaderboard = Object.values(room.gameState.players)
      .filter((p) => p.state === 'alive')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((p) => ({ id: p.id, name: p.name, score: Math.floor(p.score), color: p.color }));

    // Broadcast room game state
    io.to(`room_${code}`).emit('state', room.gameState);
  }
}, 1000 / TICK_RATE);

async function startServer() {
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'bibilava-neon-snake',
      activeRooms: Object.keys(rooms).length,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: Date.now(),
      env: process.env.NODE_ENV || 'development',
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    // Serve static frontend assets built by vite build
    app.use(express.static(distPath));

    // Single Page Application (SPA) wildcard fallback:
    // Any route not caught by static assets serves index.html (e.g. /?room=CODE)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} on http://0.0.0.0:${PORT}`);
  });

  // Graceful termination handling for container platforms (Render, Cloud Run, Docker)
  const handleShutdown = (signal: string) => {
    console.log(`\n${signal} received. Initiating graceful shutdown...`);
    clearInterval(gameLoopInterval);

    // Clear active room timers
    for (const code in rooms) {
      const room = rooms[code];
      if (room.countdownTimer) clearInterval(room.countdownTimer);
      if (room.emptyTimeout) clearTimeout(room.emptyTimeout);
    }

    server.close(() => {
      console.log('HTTP and WebSocket server closed successfully.');
      process.exit(0);
    });

    // Force shutdown if connections do not close within 5s
    setTimeout(() => {
      console.error('Graceful shutdown timeout exceeded, forcing exit.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer();
