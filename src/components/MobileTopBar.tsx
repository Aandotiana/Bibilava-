/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Headphones,
  Maximize,
  Minimize,
  Settings as SettingsIcon,
  Trophy,
  Compass,
} from 'lucide-react';
import { useMobileControls } from '../store/mobileControlsStore';
import { useGameStore } from '../store/gameStore';
import { audioManager } from '../utils/audioManager';

export function MobileTopBar() {
  const {
    micEnabled,
    voiceChatMuted,
    masterMuted,
    toggleMic,
    toggleVoiceChatMute,
    toggleMasterMute,
    isFullscreen,
    toggleFullscreen,
    lockLandscape,
    setSettingsOpen,
    leaderboardOpen,
    setLeaderboardOpen,
  } = useMobileControls();

  const { gameState, playerId, room } = useGameStore();
  const player = playerId && gameState ? gameState.players[playerId] : null;

  // Real-time mic volume level for visual speaking animation
  const [micLevel, setMicLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    let animId: number;
    const checkAudio = () => {
      if (micEnabled) {
        const level = audioManager.getMicLevel();
        setMicLevel(level);
      } else {
        setMicLevel(0);
      }
      animId = requestAnimationFrame(checkAudio);
    };
    animId = requestAnimationFrame(checkAudio);
    return () => cancelAnimationFrame(animId);
  }, [micEnabled]);

  // Match timer countdown
  useEffect(() => {
    if (!room?.matchEndsAt) {
      setTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((room.matchEndsAt! - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.matchEndsAt]);

  return (
    <header className="w-full flex items-center justify-between gap-2 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-1 pointer-events-auto z-40">
      {/* Left: Branding, Room Code & Player Length */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider leading-none select-none text-neon-cyan">
              BIBILAVA
            </h1>
            {room && (
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                {room.code}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {player && player.state === 'alive' && (
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-mono text-zinc-400 uppercase">Length</span>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                  {Math.floor(player.score)}
                </span>
              </div>
            )}
            {timeLeft && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-purple-300 font-bold bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-800/60">
                <span>⏱️ {timeLeft}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: Mobile Voice & Audio Action Cluster */}
      <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-lg">
        {/* 1. Microphone Button */}
        <button
          onClick={() => toggleMic()}
          aria-label={micEnabled ? 'Disable Microphone' : 'Enable Microphone'}
          title={micEnabled ? 'Mic: ON (Tap to mute)' : 'Mic: OFF (Tap to enable)'}
          className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-150 active:scale-90 ${
            micEnabled
              ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.8)]'
              : 'bg-white/5 text-zinc-400 hover:text-white'
          }`}
        >
          {micEnabled ? <Mic size={17} /> : <MicOff size={17} />}
          {/* Dynamic speech ripple indicator */}
          {micEnabled && micLevel > 0.08 && (
            <span
              className="absolute inset-0 rounded-full border-2 border-emerald-300 animate-ping pointer-events-none"
              style={{ opacity: Math.min(1, micLevel * 2) }}
            />
          )}
          {/* Status Dot */}
          <span
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
              micEnabled ? 'bg-emerald-400' : 'bg-zinc-600'
            }`}
          />
        </button>

        {/* 2. Incoming Voice Chat Speaker Mute */}
        <button
          onClick={() => toggleVoiceChatMute()}
          aria-label={voiceChatMuted ? 'Unmute Voice Chat' : 'Mute Voice Chat'}
          title={voiceChatMuted ? 'Voice Chat: Muted' : 'Voice Chat: Active'}
          className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-150 active:scale-90 ${
            !voiceChatMuted
              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.7)]'
              : 'bg-red-950/60 text-red-400 border border-red-800/40'
          }`}
        >
          <Headphones size={17} />
          {voiceChatMuted && (
            <span className="absolute w-5 h-0.5 bg-red-400 rotate-45 pointer-events-none rounded" />
          )}
          <span
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
              !voiceChatMuted ? 'bg-blue-400' : 'bg-red-500'
            }`}
          />
        </button>

        {/* 3. Master Game Audio Mute */}
        <button
          onClick={() => toggleMasterMute()}
          aria-label={masterMuted ? 'Unmute Master Audio' : 'Mute Master Audio'}
          title={masterMuted ? 'Master Audio: Muted' : 'Master Audio: Active'}
          className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-150 active:scale-90 ${
            !masterMuted
              ? 'bg-purple-600/90 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)]'
              : 'bg-red-950/60 text-red-400 border border-red-800/40'
          }`}
        >
          {masterMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          <span
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
              !masterMuted ? 'bg-purple-400' : 'bg-red-500'
            }`}
          />
        </button>
      </div>

      {/* Right: Screen & Utilities (Leaderboard toggle, Landscape lock, Fullscreen, Settings) */}
      <div className="flex items-center gap-1.5">
        {/* Leaderboard Toggle */}
        <button
          onClick={() => setLeaderboardOpen((prev) => !prev)}
          aria-label="Toggle Leaderboard"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-95 ${
            leaderboardOpen
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
              : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
          } backdrop-blur-md`}
        >
          <Trophy size={15} className="text-yellow-400" />
          <span className="hidden sm:inline">Rank</span>
        </button>

        {/* Landscape Orientation Lock button */}
        <button
          onClick={() => lockLandscape()}
          aria-label="Lock Landscape Orientation"
          title="Lock Landscape Orientation"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/80 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/10"
        >
          <Compass size={16} />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={() => toggleFullscreen()}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/80 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/10"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Game Settings"
          title="Game Settings"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/80 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/10"
        >
          <SettingsIcon size={16} />
        </button>
      </div>
    </header>
  );
}
