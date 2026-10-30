/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useMobileControls } from '../store/mobileControlsStore';

export function VirtualJoystick() {
  const { setJoystick, resetJoystick, joystickSize, leftHanded } = useMobileControls();
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);

  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const radius = joystickSize === 'large' ? 68 : 55;
  const knobSize = joystickSize === 'large' ? 58 : 48;
  const baseSize = radius * 2;

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!baseRef.current) return;
      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const rawDx = clientX - centerX;
      const rawDy = clientY - centerY;
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

      // Clamp knob movement to radius
      const clampedDist = Math.min(dist, radius);
      // In Three.js screen space, +Y is up, so dy in 3D is -rawDy
      const angle = Math.atan2(-rawDy, rawDx);
      const normalizedDist = Math.min(1, clampedDist / radius);

      const knobX = dist > 0 ? (rawDx / dist) * clampedDist : 0;
      const knobY = dist > 0 ? (rawDy / dist) * clampedDist : 0;

      setKnobPos({ x: knobX, y: knobY });
      setJoystick({
        active: true,
        angle,
        distance: normalizedDist,
        dx: rawDx / radius,
        dy: -rawDy / radius,
      });
    },
    [radius, setJoystick]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current !== null) return;

    activePointerId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsActive(true);
    handleMove(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current !== e.pointerId) return;
    handleMove(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      activePointerId.current = null;
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      resetJoystick();
    }
  };

  // Touch fallback
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activePointerId.current !== null) return;
    const touch = e.changedTouches[0];
    activePointerId.current = touch.identifier;
    setIsActive(true);
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activePointerId.current) {
        handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activePointerId.current) {
        activePointerId.current = null;
        setIsActive(false);
        setKnobPos({ x: 0, y: 0 });
        resetJoystick();
        break;
      }
    }
  };

  useEffect(() => {
    return () => {
      resetJoystick();
    };
  }, [resetJoystick]);

  return (
    <div
      className={`absolute z-30 select-none touch-none pointer-events-auto ${
        leftHanded
          ? 'right-[max(env(safe-area-inset-right),1rem)]'
          : 'left-[max(env(safe-area-inset-left),1rem)]'
      } bottom-[max(env(safe-area-inset-bottom),1rem)]`}
    >
      {/* Touch capture area around joystick */}
      <div
        ref={baseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          width: `${baseSize + 30}px`,
          height: `${baseSize + 30}px`,
        }}
        className="flex items-center justify-center cursor-pointer p-4 touch-none"
      >
        {/* Visual Joystick Ring */}
        <div
          style={{
            width: `${baseSize}px`,
            height: `${baseSize}px`,
          }}
          className={`relative flex items-center justify-center rounded-full transition-all duration-100 ${
            isActive
              ? 'bg-cyan-950/50 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.5)]'
              : 'bg-black/45 border border-white/25 shadow-lg'
          } backdrop-blur-md`}
        >
          {/* Subtle Directional Marks */}
          <div className="absolute top-1.5 w-1 h-2 bg-white/30 rounded-full" />
          <div className="absolute bottom-1.5 w-1 h-2 bg-white/30 rounded-full" />
          <div className="absolute left-1.5 w-2 h-1 bg-white/30 rounded-full" />
          <div className="absolute right-1.5 w-2 h-1 bg-white/30 rounded-full" />

          {/* Inner concentric ring */}
          <div
            className={`absolute rounded-full border border-dashed transition-colors duration-150 pointer-events-none ${
              isActive ? 'border-cyan-400/50' : 'border-white/10'
            }`}
            style={{
              width: `${baseSize * 0.55}px`,
              height: `${baseSize * 0.55}px`,
            }}
          />

          {/* Center Thumb Knob */}
          <div
            className={`absolute rounded-full flex items-center justify-center pointer-events-none transition-shadow ${
              isActive
                ? 'bg-gradient-to-tr from-cyan-500 to-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.9)] border-2 border-cyan-100'
                : 'bg-gradient-to-tr from-zinc-700 to-zinc-500 shadow-md border border-white/30'
            }`}
            style={{
              width: `${knobSize}px`,
              height: `${knobSize}px`,
              transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
              transition: isActive ? 'none' : 'transform 0.18s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            }}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                isActive ? 'bg-white shadow-[0_0_8px_#ffffff]' : 'bg-white/40'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
