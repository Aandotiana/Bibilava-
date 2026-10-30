/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Mic,
  Headphones,
  Sliders,
  BatteryCharging,
  Sparkles,
  Smartphone,
  Vibrate,
} from 'lucide-react';
import { useMobileControls } from '../store/mobileControlsStore';
import { audioManager } from '../utils/audioManager';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileSettingsModal() {
  const {
    settingsOpen,
    setSettingsOpen,
    graphicsQuality,
    setGraphicsQuality,
    leftHanded,
    setLeftHanded,
    joystickSize,
    setJoystickSize,
    hapticsEnabled,
    setHapticsEnabled,
    masterMuted,
    toggleMasterMute,
    voiceChatMuted,
    toggleVoiceChatMute,
    micEnabled,
    toggleMic,
    masterVolume,
    setMasterVolume,
    sfxVolume,
    setSfxVolume,
    voiceVolume,
    setVoiceVolume,
  } = useMobileControls();

  const [testMicLevel, setTestMicLevel] = useState(0);

  useEffect(() => {
    if (!settingsOpen) return;
    let frameId: number;
    const updateMeter = () => {
      if (micEnabled) {
        setTestMicLevel(audioManager.getMicLevel());
      } else {
        setTestMicLevel(0);
      }
      frameId = requestAnimationFrame(updateMeter);
    };
    frameId = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(frameId);
  }, [settingsOpen, micEnabled]);

  return (
    <AnimatePresence>
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md pointer-events-auto select-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm sm:max-w-md bg-zinc-900 border border-white/15 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={20} className="text-cyan-400" />
                <h2 className="text-lg font-bold text-white tracking-wide">
                  MOBILE SETTINGS
                </h2>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Graphics Quality */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                {graphicsQuality === 'performance' ? (
                  <BatteryCharging size={14} className="text-emerald-400" />
                ) : (
                  <Sparkles size={14} className="text-cyan-400" />
                )}
                Graphics Performance
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGraphicsQuality('performance')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                    graphicsQuality === 'performance'
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  ⚡ Battery Saver (60fps)
                </button>
                <button
                  onClick={() => setGraphicsQuality('high')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                    graphicsQuality === 'high'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  ✨ Ultra Neon Glow
                </button>
              </div>
            </div>

            {/* Controls Layout (Left / Right handed) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone size={14} className="text-yellow-400" />
                Thumb Control Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLeftHanded(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    !leftHanded
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  Right-Handed
                </button>
                <button
                  onClick={() => setLeftHanded(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    leftHanded
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  Left-Handed (Invert)
                </button>
              </div>
            </div>

            {/* Joystick Size & Haptics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase">
                  Joystick Size
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setJoystickSize('normal')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      joystickSize === 'normal'
                        ? 'bg-purple-950 border-purple-400 text-purple-300'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setJoystickSize('large')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      joystickSize === 'large'
                        ? 'bg-purple-950 border-purple-400 text-purple-300'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    Large
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase flex items-center gap-1">
                  <Vibrate size={12} /> Haptic Vibrate
                </label>
                <button
                  onClick={() => setHapticsEnabled(!hapticsEnabled)}
                  className={`py-1.5 rounded-lg text-xs font-bold border ${
                    hapticsEnabled
                      ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-zinc-500'
                  }`}
                >
                  {hapticsEnabled ? 'Vibration: ON' : 'Vibration: OFF'}
                </button>
              </div>
            </div>

            {/* Audio & Volume Settings */}
            <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Sound & Voice Levels
              </h3>

              {/* Master Volume */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    {masterMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
                    Master Volume
                  </span>
                  <button
                    onClick={() => toggleMasterMute()}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      masterMuted ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-white/10 text-white'
                    }`}
                  >
                    {masterMuted ? 'MUTED' : `${Math.round(masterVolume * 100)}%`}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Game SFX (Eat / Boost)</span>
                  <span className="text-[10px] font-mono text-zinc-300">{Math.round(sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Voice Chat Volume */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Headphones size={13} /> Voice Chat Incoming
                  </span>
                  <button
                    onClick={() => toggleVoiceChatMute()}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      voiceChatMuted ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-white/10 text-white'
                    }`}
                  >
                    {voiceChatMuted ? 'MUTED' : `${Math.round(voiceVolume * 100)}%`}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voiceVolume}
                  onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Microphone Activity Meter */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Mic size={14} className={micEnabled ? 'text-emerald-400' : 'text-zinc-500'} />
                    Microphone Input
                  </span>
                  <button
                    onClick={() => toggleMic()}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                      micEnabled
                        ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {micEnabled ? 'Active' : 'Enable Mic'}
                  </button>
                </div>
                {micEnabled && (
                  <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75"
                      style={{ width: `${Math.min(100, testMicLevel * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Done Button */}
            <button
              onClick={() => setSettingsOpen(false)}
              className="w-full py-3 bg-white text-black font-black text-sm rounded-xl hover:bg-zinc-200 active:scale-98 transition-transform mt-1"
            >
              SAVE & RESUME
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
