/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useMobileControls } from '../store/mobileControlsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Sparkles, Navigation, Zap, Mic } from 'lucide-react';
import { VirtualJoystick } from './VirtualJoystick';
import { BoostButton } from './BoostButton';
import { MobileTopBar } from './MobileTopBar';
import { LeaderboardMobile } from './LeaderboardMobile';
import { MobileSettingsModal } from './MobileSettingsModal';
import { OrientationGuide } from './OrientationGuide';
import { audioManager } from '../utils/audioManager';

export function UI() {
  const { gameState, playerId, joinGame, connect } = useGameStore();
  const { playerName, setPlayerName } = useMobileControls();

  const [inputName, setInputName] = useState(playerName);
  const [isJoining, setIsJoining] = useState(false);
  const player = playerId && gameState ? gameState.players[playerId] : null;
  const isAlive = player?.state === 'alive';
  const isDead = player?.state === 'dead';

  const handleStartGame = () => {
    try {
      audioManager.init();
      audioManager.playTap();
    } catch {}
    const finalName = inputName.trim() || 'NeonSnake';
    setPlayerName(finalName);
    setIsJoining(true);
    connect();
    joinGame(finalName);

    // Timeout safety
    setTimeout(() => {
      setIsJoining(false);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden select-none touch-none">
      {/* Top Bar with Voice Controls, Audio, Screen orientation, and Leaderboard */}
      <MobileTopBar />

      {/* Landscape Orientation Guidance for Mobile */}
      <OrientationGuide />

      {/* Compact Collapsible Leaderboard */}
      <LeaderboardMobile />

      {/* Active In-Game Touch Controls */}
      {isAlive && (
        <>
          <VirtualJoystick />
          <BoostButton />
        </>
      )}

      {/* Settings Modal */}
      <MobileSettingsModal />

      {/* Start / Respawn Mobile Dialog */}
      <AnimatePresence>
        {(!player || isDead) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto bg-black/75 backdrop-blur-md z-40"
          >
            <div className="bg-gradient-to-b from-zinc-900 to-black p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl max-w-sm sm:max-w-md w-full flex flex-col items-center gap-5">
              {/* Title / Status */}
              {isDead ? (
                <div className="text-center flex flex-col items-center">
                  <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase bg-red-950/80 px-3 py-1 rounded-full border border-red-800/60 mb-2">
                    Eliminated
                  </span>
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 tracking-tight">
                    CRASHED!
                  </h2>
                  <div className="mt-2 text-sm text-zinc-300 font-mono">
                    Score:{' '}
                    <span className="font-bold text-yellow-300 text-lg">
                      {Math.floor(player.score)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="text-cyan-400 animate-pulse" size={20} />
                    <h2 className="text-3xl font-black text-white tracking-wider text-neon-cyan">
                      BIBILAVA
                    </h2>
                  </div>
                  <p className="text-xs font-medium text-zinc-400">
                    Mobile-First Multiplayer Neon Arena
                  </p>
                </div>
              )}

              {/* Player Name Input */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Snake Call-Sign
                </label>
                <div className="relative w-full">
                  <input
                    type="text"
                    maxLength={15}
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStartGame();
                    }}
                    placeholder="Enter nickname..."
                    className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-colors"
                  />
                  <button
                    onClick={() => {
                      const tags = ['Cobalt', 'Viper', 'Volt', 'Nova', 'Cyber', 'Striker', 'Ghost', 'Neon'];
                      const randomTag = `${tags[Math.floor(Math.random() * tags.length)]}-${Math.floor(Math.random() * 90 + 10)}`;
                      setInputName(randomTag);
                      audioManager.playTap();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded-lg border border-cyan-800/60 active:scale-95"
                  >
                    Random
                  </button>
                </div>
              </div>

              {/* Mobile Control Tips */}
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">
                  Touchscreen Controls
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="flex flex-col items-center p-1.5 bg-black/40 rounded-xl border border-white/5">
                    <Navigation size={18} className="text-cyan-400 mb-1" />
                    <span className="text-[11px] font-bold text-white">Joystick</span>
                    <span className="text-[9px] text-zinc-400">Left thumb 360°</span>
                  </div>
                  <div className="flex flex-col items-center p-1.5 bg-black/40 rounded-xl border border-white/5">
                    <Zap size={18} className="text-orange-400 mb-1" />
                    <span className="text-[11px] font-bold text-white">Boost</span>
                    <span className="text-[9px] text-zinc-400">Hold right button</span>
                  </div>
                  <div className="flex flex-col items-center p-1.5 bg-black/40 rounded-xl border border-white/5">
                    <Mic size={18} className="text-emerald-400 mb-1" />
                    <span className="text-[11px] font-bold text-white">Voice</span>
                    <span className="text-[9px] text-zinc-400">Top bar audio</span>
                  </div>
                </div>
              </div>

              {/* Start / Respawn Big Touch Button */}
              <button
                onClick={handleStartGame}
                disabled={isJoining}
                className={`w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${
                  isJoining
                    ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                    : isDead
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-red-500/30'
                    : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white shadow-cyan-500/30'
                }`}
              >
                {isJoining ? (
                  <span>CONNECTING...</span>
                ) : isDead ? (
                  <>
                    <RotateCcw size={20} />
                    <span>RESPAWN NOW</span>
                  </>
                ) : (
                  <>
                    <Play size={20} fill="currentColor" />
                    <span>TAP TO ENTER ARENA</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
