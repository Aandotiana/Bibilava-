/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = {
  players: Record<string, Player>;
  orbs: Record<string, Orb>;
  leaderboard: LeaderboardEntry[];
};

export type PlayerState = 'alive' | 'dead' | 'spectating';

export type Player = {
  id: string;
  name: string;
  color: string;
  segments: { x: number; y: number }[];
  score: number;
  isBoosting: boolean;
  state: PlayerState;
  currentAngle: number;
  inputs: { left: boolean; right: boolean; boost: boolean };
  isSpeaking?: boolean;
  isVoiceMuted?: boolean;
};

export type Orb = {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  color: string;
};

// --- LOBBY AND PRIVATE ROOM TYPES ---
export type GameMode = 'classic' | 'speed_rush' | 'survival';
export type RoomStatus = 'lobby' | 'starting' | 'in_game' | 'game_over';

export interface RoomSettings {
  maxPlayers: number;
  gameMode: GameMode;
  durationMinutes: number; // 0 for unlimited, 2, 3, 5
  orbDensity: 'normal' | 'high';
  speed: 'normal' | 'fast';
}

export interface RoomPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isSpeaking: boolean;
  isMicMuted: boolean;
  connected: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RoomData {
  code: string;
  name: string;
  hostId: string;
  players: Record<string, RoomPlayer>;
  settings: RoomSettings;
  chat: ChatMessage[];
  status: RoomStatus;
  countdown: number;
  playAgainVotes: string[];
  createdAt: number;
  matchEndsAt?: number;
}

export const WORLD_SIZE = 150;
export const BASE_SPEED = 15;
export const BOOST_SPEED = 30;
export const TICK_RATE = 60; // 60 updates per second
export const ORB_SPAWN_RATE = 0.1; // Orbs per tick
export const MAX_ORBS = 300;
export const INITIAL_LENGTH = 10;
export const SEGMENT_SPACING = 0.5;
export const TURN_SPEED = Math.PI * 3; // Radians per second
