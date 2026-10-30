/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Server,
  Info,
  X,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { audioManager } from '../../utils/audioManager';
import { useMobileControls } from '../../store/mobileControlsStore';
import { useGameStore } from '../../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

export function VoiceArchitectureModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { micEnabled, voiceChatMuted, toggleMic, toggleVoiceChatMute } = useMobileControls();
  const { room, playerId } = useGameStore();

  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    const monitor = () => {
      if (micEnabled) {
        setMicLevel(audioManager.getMicLevel());
      } else {
        setMicLevel(0);
      }
      animId = requestAnimationFrame(monitor);
    };
    animId = requestAnimationFrame(monitor);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, micEnabled]);

  const activePlayers = room?.players ? Object.values(room.players) : [];
  const peersCount = Math.max(0, activePlayers.length - 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto select-none">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="w-full max-w-lg bg-zinc-900 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Radio size={20} className="text-emerald-400 animate-pulse" />
                <h2 className="text-base font-bold text-white tracking-wide uppercase">
                  VOICE CHAT & BACKEND ARCHITECTURE
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Voice Controls Panel */}
            <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  Your Voice Status
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  {micEnabled ? 'MIC LIVE' : 'MIC OFF (Standby)'}
                </span>
              </div>

              {/* Live Speech Level Meter */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Input Gain Level:</span>
                  <span>{Math.round(micLevel * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 rounded-full transition-all duration-75"
                    style={{ width: `${Math.min(100, micLevel * 100)}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => toggleMic()}
                  className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border active:scale-95 ${
                    micEnabled
                      ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-white/5 border-white/15 text-zinc-300 hover:text-white'
                  }`}
                >
                  {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                  <span>{micEnabled ? 'Mute Microphone' : 'Enable Microphone'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleVoiceChatMute()}
                  className={`py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border active:scale-95 ${
                    !voiceChatMuted
                      ? 'bg-blue-950 border-blue-400 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'bg-red-950 border-red-500 text-red-300'
                  }`}
                >
                  {!voiceChatMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>{!voiceChatMuted ? 'Mute Peers' : 'Unmute Peers'}</span>
                </button>
              </div>
            </div>

            {/* Architecture Details Required by User Prompt */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/70 border border-white/10 text-xs">
              <h3 className="font-bold text-white uppercase flex items-center gap-1.5 text-cyan-400">
                <Server size={15} />
                Required Infrastructure & Deployment Info
              </h3>

              <div className="flex flex-col gap-2 text-zinc-300 text-[11px] leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Active Signaling Foundation:</strong> Real-time Socket.IO signaling relays SDP offers, answers, ICE candidates, and speaking states per room (`voice_signal` and `voice_status`).
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Active STUN Server:</strong> Configured with Google public STUN (`stun:stun.l.google.com:19302`) for direct P2P audio streaming between {peersCount} peer(s).
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Production Requirement for Cellular NATs:</strong> When players are connected on mobile networks (4G/5G) with symmetric carrier NATs, direct P2P connections are often blocked. A **TURN Relay Server** (e.g., Coturn or Twilio Network Traversal) is required for guaranteed audio relay.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Zap size={14} className="text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-purple-300">Scale Architecture (&gt;4 Players):</strong> Full P2P mesh requires N*(N-1) connections. For lobbies with 6 to 10 players, an **SFU Media Server** (such as LiveKit, Mediasoup, or Agora RTC) is recommended to route one upload stream to all subscribers.
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-200 active:scale-98 transition-transform"
            >
              Back to Lobby
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
