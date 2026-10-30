/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sparkles, Users, PlusCircle, ArrowRight, AlertCircle, X, Shield, Zap } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { useMobileControls } from '../../store/mobileControlsStore';
import { AvatarSelector } from './AvatarSelector';
import { audioManager } from '../../utils/audioManager';

export function LobbyHome() {
  const { createRoom, joinRoom, roomError, clearRoomError } = useGameStore();
  const { playerName, setPlayerName } = useMobileControls();

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [nickname, setNickname] = useState(playerName || 'NeonSnake');
  const [selectedAvatar, setSelectedAvatar] = useState('viper');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [gameMode, setGameMode] = useState<'classic' | 'speed_rush' | 'survival'>('classic');

  // Check URL query parameters for ?room=CODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = urlParams.get('room');
      if (urlRoom) {
        setRoomCodeInput(urlRoom.toUpperCase());
        setMode('join');
      }
    }
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.init();
    audioManager.playTap();
    const finalNick = nickname.trim() || 'NeonHost';
    setPlayerName(finalNick);
    const finalRoomName = roomNameInput.trim() || `${finalNick}'s Arena`;

    createRoom(finalRoomName, finalNick, selectedAvatar, {
      maxPlayers,
      gameMode,
      durationMinutes: 3,
      orbDensity: 'normal',
      speed: 'normal',
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.init();
    audioManager.playTap();
    const finalNick = nickname.trim() || `Player-${Math.floor(Math.random() * 900 + 100)}`;
    const finalCode = roomCodeInput.trim().toUpperCase();
    if (!finalCode) return;
    setPlayerName(finalNick);
    joinRoom(finalCode, finalNick, selectedAvatar);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-4 select-none my-auto">
      {/* Brand Hero */}
      <div className="flex flex-col items-center text-center gap-1.5 my-2">
        <div className="flex items-center gap-2">
          <Sparkles className="text-cyan-400 animate-pulse" size={24} />
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-widest text-neon-cyan">
            BIBILAVA
          </h1>
        </div>
        <p className="text-xs font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 tracking-wider uppercase">
          Private Friends Multiplayer Lobby
        </p>
      </div>

      {/* Room Error Notification Banner */}
      {roomError && (
        <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{roomError}</span>
          </div>
          <button
            onClick={clearRoomError}
            className="text-red-400 hover:text-white p-1 rounded-full active:scale-90"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Mode Tabs: Create Room vs Join Room */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900 border border-white/10 shadow-lg">
        <button
          type="button"
          onClick={() => {
            setMode('create');
            audioManager.playTap();
          }}
          className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            mode === 'create'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(0,245,255,0.4)]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <PlusCircle size={15} />
          <span>Create Room</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('join');
            audioManager.playTap();
          }}
          className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            mode === 'join'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(255,0,127,0.4)]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users size={15} />
          <span>Join Room</span>
        </button>
      </div>

      {/* Main Form Box */}
      <div className="p-5 rounded-3xl bg-zinc-900/90 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
        {/* Nickname Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Your Nickname</span>
            <button
              type="button"
              onClick={() => {
                const names = ['CyberViper', 'NeonVolt', 'PlasmaStriker', 'ShadowHydra', 'QuantumFang', 'SolarCobra'];
                setNickname(`${names[Math.floor(Math.random() * names.length)]}-${Math.floor(Math.random() * 90 + 10)}`);
                audioManager.playTap();
              }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 active:scale-95"
            >
              🎲 Random
            </button>
          </label>
          <input
            type="text"
            maxLength={15}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter player nickname..."
            className="w-full py-3 px-4 bg-white/5 border border-white/15 rounded-xl text-white font-mono text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Avatar Selection */}
        <AvatarSelector selectedId={selectedAvatar} onSelect={setSelectedAvatar} />

        {/* CREATE ROOM FORM */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="flex flex-col gap-3 pt-2 border-t border-white/10">
            {/* Optional Room Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Room Name (Optional)
              </label>
              <input
                type="text"
                maxLength={24}
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                placeholder={`${nickname || 'Neon'}'s Arena`}
                className="w-full py-2.5 px-3 bg-white/5 border border-white/15 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Quick Player Capacity */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[11px] font-bold text-zinc-400 uppercase">
                  Player Limit
                </span>
                <span className="font-mono text-cyan-300 font-bold">{maxPlayers} Players</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[4, 6, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      maxPlayers === num
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    {num}P
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Create Button */}
            <button
              type="submit"
              className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,245,255,0.4)] active:scale-95 transition-all"
            >
              <PlusCircle size={18} />
              <span>CREATE PRIVATE ROOM</span>
            </button>
          </form>
        )}

        {/* JOIN ROOM FORM */}
        {mode === 'join' && (
          <form onSubmit={handleJoin} className="flex flex-col gap-3 pt-2 border-t border-white/10">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Enter Room Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. CYBER"
                className="w-full py-3.5 px-4 bg-white/5 border border-pink-500/40 rounded-xl text-white font-mono text-center text-lg font-black tracking-widest placeholder-zinc-600 focus:outline-none focus:border-pink-400 uppercase"
              />
              <span className="text-[10px] text-zinc-500 text-center">
                Ask your friend for their 5-character room code or open their invite link
              </span>
            </div>

            {/* Submit Join Button */}
            <button
              type="submit"
              disabled={!roomCodeInput.trim()}
              className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 disabled:opacity-40 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,127,0.4)] active:scale-95 transition-all"
            >
              <ArrowRight size={18} />
              <span>JOIN FRIENDS LOBBY</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
