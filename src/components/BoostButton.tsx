/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Zap, Flame } from 'lucide-react';
import { useMobileControls } from '../store/mobileControlsStore';
import { useGameStore } from '../store/gameStore';

export function BoostButton() {
  const { setBoostingInput, leftHanded } = useMobileControls();
  const { gameState, playerId } = useGameStore();

  const player = playerId && gameState ? gameState.players[playerId] : null;
  const canBoost = player ? player.score > 10.2 : true;

  const [isPressed, setIsPressed] = useState(false);
  const activePointerId = useRef<number | null>(null);

  const startBoost = () => {
    setIsPressed(true);
    setBoostingInput(true);
  };

  const stopBoost = () => {
    setIsPressed(false);
    setBoostingInput(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    startBoost();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      activePointerId.current = null;
      stopBoost();
    }
  };

  // Touch fallback
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current !== null) return;
    const touch = e.changedTouches[0];
    activePointerId.current = touch.identifier;
    startBoost();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activePointerId.current) {
        activePointerId.current = null;
        stopBoost();
        break;
      }
    }
  };

  return (
    <div
      className={`absolute z-30 select-none touch-none pointer-events-auto ${
        leftHanded
          ? 'left-[max(env(safe-area-inset-left),1rem)]'
          : 'right-[max(env(safe-area-inset-right),1rem)]'
      } bottom-[max(env(safe-area-inset-bottom),1rem)] flex flex-col items-center gap-1.5`}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`relative w-22 h-22 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-100 active:scale-95 cursor-pointer touch-none ${
          isPressed
            ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 shadow-[0_0_35px_rgba(249,115,22,0.9)] scale-95 border-2 border-yellow-200'
            : canBoost
            ? 'bg-gradient-to-tr from-zinc-900 via-orange-950/70 to-zinc-800 border-2 border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.35)]'
            : 'bg-zinc-900/60 border border-white/10 opacity-50 cursor-not-allowed'
        } backdrop-blur-md`}
      >
        {/* Pulsing glow ring when active */}
        {isPressed && (
          <div className="absolute inset-0 rounded-full animate-ping bg-orange-500/30 pointer-events-none" />
        )}

        {/* Outer orbital dash */}
        <div
          className={`absolute inset-1.5 rounded-full border border-dashed pointer-events-none transition-colors ${
            isPressed ? 'border-yellow-200/80 animate-spin' : 'border-orange-500/20'
          }`}
          style={{ animationDuration: '4s' }}
        />

        {/* Icon & Label */}
        {isPressed ? (
          <Flame size={34} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse pointer-events-none" />
        ) : (
          <Zap size={30} className={`${canBoost ? 'text-orange-400' : 'text-zinc-500'} pointer-events-none`} />
        )}

        <span
          className={`text-[11px] font-black tracking-widest uppercase mt-0.5 pointer-events-none ${
            isPressed ? 'text-white' : canBoost ? 'text-orange-300' : 'text-zinc-500'
          }`}
        >
          Boost
        </span>

        {/* Low energy hint */}
        {!canBoost && (
          <span className="absolute -bottom-5 text-[9px] font-mono text-zinc-400 whitespace-nowrap pointer-events-none">
            Need &gt; 10
          </span>
        )}
      </div>
    </div>
  );
}
