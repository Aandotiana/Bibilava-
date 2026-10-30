/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Copy,
  Check,
  Crown,
  Play,
  Sliders,
  LogOut,
  UserX,
  Volume2,
  VolumeX,
  Radio,
  Share2,
  CheckCircle,
  Clock,
  Sparkles,
  Zap,
  Info,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { AVATAR_OPTIONS } from './AvatarSelector';
import { audioManager } from '../../utils/audioManager';
import { motion, AnimatePresence } from 'framer-motion';

export function RoomLobbyView({
  onOpenSettings,
  onOpenVoice,
}: {
  onOpenSettings: () => void;
  onOpenVoice: () => void;
}) {
  const {
    room,
    playerId,
    toggleReady,
    startGame,
    kickPlayer,
    leaveRoom,
    blockedPlayerIds,
    toggleBlockPlayer,
    mutedVoicePlayerIds,
    toggleMuteVoicePlayer,
  } = useGameStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [kickConfirmId, setKickConfirmId] = useState<string | null>(null);

  if (!room) return null;

  const players = Object.values(room.players);
  const isHost = room.hostId === playerId;
  const myPlayer = playerId ? room.players[playerId] : null;
  const isReady = myPlayer?.isReady ?? false;

  const nonHostPlayers = players.filter((p) => !p.isHost);
  const unreadyCount = nonHostPlayers.filter((p) => !p.isReady).length;
  const canStartMatch = isHost && (players.length === 1 || unreadyCount === 0);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      audioManager.playTap();
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      audioManager.playTap();
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleStartGame = () => {
    if (!canStartMatch) return;
    audioManager.playTap();
    startGame();
  };

  const handleToggleReady = () => {
    audioManager.playTap();
    toggleReady(!isReady);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 p-3 sm:p-5 pb-24 select-none">
      {/* Top Bar / Room Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-zinc-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            <h1 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase truncate max-w-[220px] sm:max-w-md">
              {room.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-medium">Room Code:</span>
            <button
              onClick={handleCopyCode}
              title="Click to copy code"
              className="flex items-center gap-1 font-mono font-black text-cyan-300 bg-cyan-950/70 border border-cyan-800/80 px-2.5 py-0.5 rounded-lg active:scale-95 transition-all text-sm tracking-widest hover:border-cyan-400"
            >
              <span>{room.code}</span>
              {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400 font-mono">
              {players.length} / {room.settings.maxPlayers} Players
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Share Invitation Link */}
          <button
            onClick={handleCopyLink}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold active:scale-95 transition-all border border-white/15"
          >
            {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>

          {/* Voice Chat Foundation info button */}
          <button
            onClick={onOpenVoice}
            title="Voice Communication & Mic Settings"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900 active:scale-95 transition-all"
          >
            <Radio size={16} />
          </button>

          {/* Host Settings */}
          <button
            onClick={onOpenSettings}
            title="Arena Settings"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-500/50 hover:bg-purple-900 active:scale-95 transition-all"
          >
            <Sliders size={16} />
          </button>

          {/* Leave Room */}
          <button
            onClick={leaveRoom}
            title="Leave Lobby"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-950/80 text-red-300 border border-red-500/50 hover:bg-red-900 active:scale-95 transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Match Configuration Banner */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mode</span>
          <span className="font-bold text-cyan-300 capitalize mt-0.5">
            {room.settings.gameMode.replace('_', ' ')}
          </span>
        </div>
        <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duration</span>
          <span className="font-bold text-purple-300 font-mono mt-0.5">
            {room.settings.durationMinutes === 0 ? 'Unlimited' : `${room.settings.durationMinutes}m Match`}
          </span>
        </div>
        <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Speed / Orbs</span>
          <span className="font-bold text-yellow-300 mt-0.5 capitalize">
            {room.settings.speed} / {room.settings.orbDensity}
          </span>
        </div>
      </div>

      {/* Players List Grid */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>Arena Players ({players.length}/{room.settings.maxPlayers})</span>
          </h2>
          {isHost && unreadyCount > 0 && players.length > 1 && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 animate-pulse">
              Waiting for {unreadyCount} player(s) to ready up
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {players.map((player) => {
            const isMe = player.id === playerId;
            const avatarConfig = AVATAR_OPTIONS.find((a) => a.id === player.avatar) || AVATAR_OPTIONS[0];
            const Icon = avatarConfig.icon;
            const isBlocked = blockedPlayerIds.includes(player.id);
            const isVoiceMuted = mutedVoicePlayerIds.includes(player.id);

            return (
              <div
                key={player.id}
                className={`relative p-3.5 rounded-3xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                  isMe
                    ? 'bg-gradient-to-r from-zinc-900 to-zinc-800 border-cyan-400/50 shadow-[0_0_15px_rgba(0,245,255,0.2)]'
                    : 'bg-zinc-900/70 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left: Avatar & Speaking Ring */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
                        player.isSpeaking ? 'ring-2 ring-emerald-400 scale-105 animate-pulse' : ''
                      }`}
                      style={{
                        backgroundColor: `${player.color}25`,
                        borderColor: player.color,
                        borderWidth: '1.5px',
                      }}
                    >
                      <Icon size={24} style={{ color: player.color }} />
                    </div>

                    {/* Speaking Sound Waves */}
                    {player.isSpeaking && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                      </span>
                    )}

                    {/* Host Crown Icon */}
                    {player.isHost && (
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-md">
                        <Crown size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Player Name & Badges */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        style={{ color: player.color }}
                        className="font-bold text-sm truncate max-w-[120px]"
                      >
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950 px-1.5 py-0.2 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {player.isHost ? '👑 Room Host' : 'Player'}
                    </span>
                  </div>
                </div>

                {/* Right: Ready Status & Actions */}
                <div className="flex items-center gap-2">
                  {/* Ready / Waiting Badge */}
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wider ${
                      player.isReady
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {player.isReady ? (
                      <>
                        <CheckCircle size={12} className="text-emerald-400" />
                        <span>READY</span>
                      </>
                    ) : (
                      <>
                        <Clock size={12} className="text-amber-400 animate-spin" />
                        <span>WAIT</span>
                      </>
                    )}
                  </div>

                  {/* Host Kick Option */}
                  {isHost && !player.isHost && (
                    <div className="relative">
                      {kickConfirmId === player.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              kickPlayer(player.id);
                              setKickConfirmId(null);
                            }}
                            className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg active:scale-95"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setKickConfirmId(null)}
                            className="text-zinc-400 hover:text-white text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setKickConfirmId(player.id)}
                          title="Remove player from lobby"
                          className="w-7 h-7 rounded-xl bg-white/5 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 flex items-center justify-center active:scale-90 transition-colors"
                        >
                          <UserX size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Mute Peer Button */}
                  {!isMe && (
                    <button
                      onClick={() => toggleBlockPlayer(player.id)}
                      title={isBlocked ? 'Unmute chat' : 'Mute chat messages'}
                      className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90"
                    >
                      {isBlocked ? <VolumeX size={13} className="text-red-400" /> : <Volume2 size={13} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty Slots Indicator */}
      {players.length < room.settings.maxPlayers && (
        <div className="p-3 rounded-2xl border border-dashed border-white/15 bg-white/5 text-center flex items-center justify-center gap-2 text-xs text-zinc-400">
          <Sparkles size={14} className="text-cyan-400" />
          <span>
            {room.settings.maxPlayers - players.length} slot(s) open. Share room code{' '}
            <strong className="text-cyan-300 font-mono">{room.code}</strong> with your friends!
          </span>
        </div>
      )}

      {/* Bottom Main Action Bar (Touch-friendly & Fixed) */}
      <div className="fixed bottom-0 inset-x-0 p-3 sm:p-4 bg-zinc-950/90 border-t border-white/15 backdrop-blur-xl z-30 flex items-center justify-center">
        <div className="w-full max-w-md flex items-center gap-3">
          {/* Non-host: Ready / Not Ready Toggle */}
          {!isHost ? (
            <button
              onClick={handleToggleReady}
              className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all ${
                isReady
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/30'
              }`}
            >
              {isReady ? (
                <>
                  <CheckCircle size={18} />
                  <span>YOU ARE READY</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>SET READY TO PLAY</span>
                </>
              )}
            </button>
          ) : (
            /* Host: START MATCH Button */
            <button
              onClick={handleStartGame}
              disabled={!canStartMatch}
              className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-all ${
                canStartMatch
                  ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white shadow-cyan-500/40 active:scale-95 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed opacity-60'
              }`}
            >
              <Play size={18} fill="currentColor" />
              <span>
                {players.length === 1
                  ? 'START SOLO PRACTICE'
                  : canStartMatch
                  ? 'START ARENA MATCH'
                  : `WAITING FOR PLAYERS (${unreadyCount} UNREADY)`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Countdown Starting Overlay */}
      <AnimatePresence>
        {room.status === 'starting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center select-none"
          >
            <motion.div
              key={room.countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-4"
            >
              <span className="text-xl font-mono uppercase text-cyan-400 tracking-widest">
                Arena Match Launching
              </span>
              <span
                className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-white to-pink-500 drop-shadow-[0_0_40px_rgba(0,245,255,0.8)]"
              >
                {room.countdown > 0 ? room.countdown : 'GO!'}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                Get your thumbs on the joystick!
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
