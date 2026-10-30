/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../shared/types';
import { audioManager } from '../utils/audioManager';

interface GameStore {
  socket: Socket | null;
  gameState: GameState | null;
  playerId: string | null;
  connect: () => void;
  joinGame: (name?: string) => void;
  sendPlayerState: (data: any) => void;
  sendCollectOrb: (orbId: string) => void;
}

export const globalGameState: { current: GameState | null } = { current: null };
let lastUiUpdate = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  playerId: null,
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
      audioManager.setSocket(socket);
    });

    socket.on('init', (id: string) => {
      set({ playerId: id });
    });

    socket.on('state', (state: GameState) => {
      globalGameState.current = state;
      const now = Date.now();
      if (now - lastUiUpdate > 100) { // Throttle React updates to 10Hz
        set({ gameState: state });
        lastUiUpdate = now;
      }
    });

    set({ socket });
  },
  joinGame: (name?: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join', name);
    }
  },
  sendPlayerState: (data) => {
    const { socket } = get();
    if (socket) {
      socket.emit('update_state', data);
    }
  },
  sendCollectOrb: (orbId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('collect_orb', orbId);
    }
  },
}));
