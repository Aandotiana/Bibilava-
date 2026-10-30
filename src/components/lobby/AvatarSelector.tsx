/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Zap, Flame, Shield, Skull, Sparkles, Orbit, Compass, Eye } from 'lucide-react';

export interface AvatarOption {
  id: string;
  name: string;
  color: string;
  icon: typeof Zap;
  desc: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'viper', name: 'Cyber Viper', color: '#00f5ff', icon: Zap, desc: 'High-voltage striker' },
  { id: 'cobra', name: 'Neon Cobra', color: '#ff007f', icon: Flame, desc: 'Inferno burst venom' },
  { id: 'volt', name: 'Volt Python', color: '#ffe600', icon: Sparkles, desc: 'Kinetic overload' },
  { id: 'mamba', name: 'Bio Mamba', color: '#00ff66', icon: Orbit, desc: 'Toxic plasma wave' },
  { id: 'quantum', name: 'Quantum Krait', color: '#b026ff', icon: Compass, desc: 'Void slip navigator' },
  { id: 'solar', name: 'Solar Adder', color: '#ff6600', icon: Shield, desc: 'Radiant heat shield' },
  { id: 'ghost', name: 'Ghost Serpent', color: '#ffffff', icon: Eye, desc: 'Sub-zero stealth' },
  { id: 'hydra', name: 'Shadow Hydra', color: '#ff3333', icon: Skull, desc: 'Apex arena predator' },
];

export function AvatarSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="w-full flex flex-col gap-2">
      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
        <span>Choose Snake Avatar</span>
        <span className="text-cyan-400 font-mono">
          {AVATAR_OPTIONS.find((a) => a.id === selectedId)?.name || 'Viper'}
        </span>
      </label>

      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {AVATAR_OPTIONS.map((avatar) => {
          const Icon = avatar.icon;
          const isSelected = selectedId === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.id)}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-150 active:scale-95 ${
                isSelected
                  ? 'bg-zinc-800/90 shadow-[0_0_15px_rgba(0,245,255,0.4)]'
                  : 'bg-black/40 border-white/10 hover:border-white/20'
              }`}
              style={{
                borderColor: isSelected ? avatar.color : undefined,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-1 transition-transform"
                style={{
                  backgroundColor: `${avatar.color}20`,
                  boxShadow: isSelected ? `0 0 12px ${avatar.color}80` : 'none',
                }}
              >
                <Icon size={20} style={{ color: avatar.color }} />
              </div>
              <span className="text-[10px] font-bold text-white/90 truncate w-full text-center">
                {avatar.name.split(' ')[1] || avatar.name}
              </span>
              {isSelected && (
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black"
                  style={{ backgroundColor: avatar.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
