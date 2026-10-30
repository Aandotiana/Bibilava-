/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Sliders, Users, Clock, Zap, Shield, Sparkles, Orbit } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { RoomSettings, GameMode } from '../../shared/types';
import { motion, AnimatePresence } from 'framer-motion';

const GAME_MODES: { id: GameMode; title: string; desc: string; icon: typeof Zap }[] = [
  { id: 'classic', title: 'Classic FFA', desc: 'Standard Neon arena rules: eat, grow, and outmaneuver.', icon: Sparkles },
  { id: 'speed_rush', title: 'Speed Rush (2x)', desc: 'Accelerated turbo speed with frequent booster drops.', icon: Zap },
  { id: 'survival', title: 'Survival Apex', desc: 'Elimination match with shrinking grid boundaries.', icon: Orbit },
];

export function HostSettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { room, playerId, updateSettings } = useGameStore();

  if (!room) return null;
  const isHost = room.hostId === playerId;
  const settings = room.settings;

  const handleUpdate = (partial: Partial<RoomSettings>) => {
    if (!isHost) return;
    updateSettings(partial);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto select-none">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="w-full max-w-md bg-zinc-900 border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={20} className="text-cyan-400" />
                <h2 className="text-base font-bold text-white tracking-wide uppercase">
                  MATCH & ARENA SETTINGS
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Host Only Notice if not host */}
            {!isHost && (
              <div className="py-2 px-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs flex items-center gap-2">
                <Shield size={14} className="shrink-0" />
                <span>Host-managed settings. Displayed in real-time.</span>
              </div>
            )}

            {/* Game Mode Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Game Mode
              </label>
              <div className="flex flex-col gap-2">
                {GAME_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = settings.gameMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      disabled={!isHost}
                      onClick={() => handleUpdate({ gameMode: mode.id })}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,245,255,0.3)]'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20'
                      } ${!isHost ? 'cursor-default' : 'active:scale-98 cursor-pointer'}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-cyan-400 text-black' : 'bg-white/10 text-zinc-400'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{mode.title}</span>
                        <span className="text-[11px] text-zinc-400">{mode.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Players Slider/Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                  <Users size={14} className="text-yellow-400" />
                  Player Capacity
                </span>
                <span className="font-mono text-yellow-300 font-bold bg-yellow-950/60 border border-yellow-800/40 px-2 py-0.5 rounded">
                  Max {settings.maxPlayers}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[2, 4, 6, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={!isHost}
                    onClick={() => handleUpdate({ maxPlayers: num })}
                    className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                      settings.maxPlayers === num
                        ? 'bg-yellow-950 border-yellow-400 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    } ${!isHost ? 'cursor-default' : 'active:scale-95'}`}
                  >
                    {num}P
                  </button>
                ))}
              </div>
            </div>

            {/* Match Duration */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                  <Clock size={14} className="text-purple-400" />
                  Match Time Limit
                </span>
                <span className="font-mono text-purple-300 font-bold">
                  {settings.durationMinutes === 0 ? 'Unlimited' : `${settings.durationMinutes} Minutes`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Unlimited', val: 0 },
                  { label: '2 Min', val: 2 },
                  { label: '3 Min', val: 3 },
                  { label: '5 Min', val: 5 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    disabled={!isHost}
                    onClick={() => handleUpdate({ durationMinutes: opt.val })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      settings.durationMinutes === opt.val
                        ? 'bg-purple-950 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    } ${!isHost ? 'cursor-default' : 'active:scale-95'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orb Density & Speed */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase">
                  Orb Density
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={() => handleUpdate({ orbDensity: 'normal' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      settings.orbDensity === 'normal'
                        ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={() => handleUpdate({ orbDensity: 'high' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      settings.orbDensity === 'high'
                        ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    High ✨
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase">
                  Arena Speed
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={() => handleUpdate({ speed: 'normal' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      settings.speed === 'normal'
                        ? 'bg-blue-950 border-blue-400 text-blue-300'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    disabled={!isHost}
                    onClick={() => handleUpdate({ speed: 'fast' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      settings.speed === 'fast'
                        ? 'bg-blue-950 border-blue-400 text-blue-300'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    Fast ⚡
                  </button>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-200 active:scale-98 transition-transform mt-1"
            >
              {isHost ? 'Apply & Close' : 'Close'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
