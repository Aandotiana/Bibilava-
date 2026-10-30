/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GameState, RoomData, RoomSettings, ChatMessage } from '../shared/types';
import { audioManager } from '../utils/audioManager';

interface GameStore {
  socket: Socket | null;
  gameState: GameState | null;
  playerId: string | null;
  room: RoomData | null;
  roomError: string | null;
  blockedPlayerIds: string[];
  mutedVoicePlayerIds: string[];

  // Actions
  connect: () => void;
  createRoom: (roomName: string, playerName: string, avatar: string, settings?: Partial<RoomSettings>) => void;
  joinRoom: (roomCode: string, playerName: string, avatar: string) => void;
  leaveRoom: () => void;
  toggleReady: (isReady: boolean) => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;
  kickPlayer: (targetId: string) => void;
  startGame: () => void;
  sendChatMessage: (text: string) => void;
  votePlayAgain: () => void;
  returnToLobby: () => void;
  clearRoomError: () => void;
  toggleBlockPlayer: (playerId: string) => void;
  toggleMuteVoicePlayer: (playerId: string) => void;

  // Gameplay actions
  sendPlayerState: (data: any) => void;
  sendCollectOrb: (orbId: string) => void;
}

export const globalGameState: { current: GameState | null } = { current: null };
let lastUiUpdate = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  playerId: null,
  room: null,
  roomError: null,
  blockedPlayerIds: [],
  mutedVoicePlayerIds: [],

  connect: () => {
    if (get().socket) return;

    const socket = io({
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnectionAttempts: 10,
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err.message);
    });

    socket.on('connect', () => {
      console.log('Connected to server with id:', socket.id);
      set({ playerId: socket.id });
      audioManager.setSocket(socket);
    });

    // Room events
    socket.on('room_joined', ({ room, playerId }: { room: RoomData; playerId: string }) => {
      set({ room, playerId, roomError: null });
      // Sync URL parameter if in browser
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('room', room.code);
        window.history.replaceState({}, '', url.toString());
      }
    });

    socket.on('room_updated', (room: RoomData) => {
      set({ room });
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      set((state) => {
        if (!state.room) return state;
        const exists = state.room.chat.some((m) => m.id === msg.id);
        if (exists) return state;
        return {
          room: {
            ...state.room,
            chat: [...state.room.chat, msg].slice(-80),
          },
        };
      });
      // Play subtle chat blip if not from self
      if (msg.senderId !== get().playerId && !msg.isSystem) {
        audioManager.playTap();
      }
    });

    socket.on('error_room', ({ message }: { message: string }) => {
      set({ roomError: message });
    });

    socket.on('kicked_from_room', ({ message }: { message: string }) => {
      set({ room: null, gameState: null, roomError: message });
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url.toString());
      }
    });

    socket.on('game_started', () => {
      audioManager.triggerHaptic('boost');
    });

    socket.on('voice_status_update', ({ playerId, isSpeaking, isMuted }: { playerId: string; isSpeaking: boolean; isMuted: boolean }) => {
      set((state) => {
        if (!state.room || !state.room.players[playerId]) return state;
        return {
          room: {
            ...state.room,
            players: {
              ...state.room.players,
              [playerId]: {
                ...state.room.players[playerId],
                isSpeaking,
                isMicMuted: isMuted,
              },
            },
          },
        };
      });
    });

    // Game state updates
    socket.on('state', (state: GameState) => {
      globalGameState.current = state;
      const now = Date.now();
      if (now - lastUiUpdate > 90) { // Throttle React updates to ~11Hz
        set({ gameState: state });
        lastUiUpdate = now;
      }
    });

    set({ socket });
  },

  createRoom: (roomName, playerName, avatar, settings) => {
    const { socket, connect } = get();
    if (!socket) {
      connect();
    }
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.emit('create_room', {
        roomName,
        playerName,
        avatar,
        settings,
      });
    }
  },

  joinRoom: (roomCode, playerName, avatar) => {
    const { socket, connect } = get();
    if (!socket) {
      connect();
    }
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.emit('join_room', {
        roomCode,
        playerName,
        avatar,
      });
    }
  },

  leaveRoom: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave_room');
    }
    set({ room: null, gameState: null, roomError: null });
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
  },

  toggleReady: (isReady) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('toggle_ready', { roomCode: room.code, isReady });
    }
  },

  updateSettings: (settings) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('update_settings', { roomCode: room.code, settings });
    }
  },

  kickPlayer: (targetId) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('kick_player', { roomCode: room.code, targetId });
    }
  },

  startGame: () => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('start_game', { roomCode: room.code });
    }
  },

  sendChatMessage: (text) => {
    const { socket, room } = get();
    if (socket && room && text.trim()) {
      socket.emit('send_chat', { roomCode: room.code, text });
    }
  },

  votePlayAgain: () => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('vote_play_again', { roomCode: room.code });
    }
  },

  returnToLobby: () => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('return_to_lobby', { roomCode: room.code });
    }
  },

  clearRoomError: () => set({ roomError: null }),

  toggleBlockPlayer: (targetId) => {
    set((state) => {
      const exists = state.blockedPlayerIds.includes(targetId);
      return {
        blockedPlayerIds: exists
          ? state.blockedPlayerIds.filter((id) => id !== targetId)
          : [...state.blockedPlayerIds, targetId],
      };
    });
  },

  toggleMuteVoicePlayer: (targetId) => {
    set((state) => {
      const exists = state.mutedVoicePlayerIds.includes(targetId);
      return {
        mutedVoicePlayerIds: exists
          ? state.mutedVoicePlayerIds.filter((id) => id !== targetId)
          : [...state.mutedVoicePlayerIds, targetId],
      };
    });
  },

  sendPlayerState: (data) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('update_state', { ...data, roomCode: room.code });
    }
  },

  sendCollectOrb: (orbId) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('collect_orb', { orbId, roomCode: room.code });
    }
  },
}));
