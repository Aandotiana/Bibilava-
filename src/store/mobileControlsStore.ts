/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { audioManager } from '../utils/audioManager';

export interface JoystickData {
  active: boolean;
  angle: number; // in radians
  distance: number; // 0.0 to 1.0
  dx: number; // normalized -1.0 to 1.0
  dy: number; // normalized -1.0 to 1.0
}

interface MobileControlsState {
  // Joystick & Input
  joystick: JoystickData;
  isBoostingInput: boolean;
  setJoystick: (data: Partial<JoystickData>) => void;
  resetJoystick: () => void;
  setBoostingInput: (boosting: boolean) => void;

  // Screen & Orientation
  isLandscape: boolean;
  isFullscreen: boolean;
  orientationNoticeDismissed: boolean;
  setIsLandscape: (landscape: boolean) => void;
  dismissOrientationNotice: () => void;
  toggleFullscreen: () => Promise<void>;
  lockLandscape: () => Promise<boolean>;

  // Voice & Audio Controls
  micEnabled: boolean;
  voiceChatMuted: boolean;
  masterMuted: boolean;
  audioLevel: number;
  masterVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  toggleMic: () => Promise<boolean>;
  toggleVoiceChatMute: () => void;
  toggleMasterMute: () => void;
  setMasterVolume: (val: number) => void;
  setSfxVolume: (val: number) => void;
  setVoiceVolume: (val: number) => void;
  setAudioLevel: (val: number) => void;

  // Settings & Customization
  playerName: string;
  setPlayerName: (name: string) => void;
  graphicsQuality: 'performance' | 'high';
  setGraphicsQuality: (mode: 'performance' | 'high') => void;
  leftHanded: boolean;
  setLeftHanded: (val: boolean) => void;
  joystickSize: 'normal' | 'large';
  setJoystickSize: (size: 'normal' | 'large') => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (val: boolean) => void;
  leaderboardOpen: boolean;
  setLeaderboardOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  settingsOpen: boolean;
  setSettingsOpen: (val: boolean) => void;
}

export const useMobileControls = create<MobileControlsState>((set, get) => ({
  joystick: {
    active: false,
    angle: 0,
    distance: 0,
    dx: 0,
    dy: 0,
  },
  isBoostingInput: false,

  setJoystick: (data) =>
    set((state) => ({
      joystick: { ...state.joystick, ...data },
    })),

  resetJoystick: () =>
    set({
      joystick: { active: false, angle: 0, distance: 0, dx: 0, dy: 0 },
    }),

  setBoostingInput: (boosting) => {
    if (boosting !== get().isBoostingInput) {
      if (boosting) {
        audioManager.startBoostHum();
      } else {
        audioManager.stopBoostHum();
      }
      set({ isBoostingInput: boosting });
    }
  },

  isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true,
  isFullscreen: false,
  orientationNoticeDismissed: false,

  setIsLandscape: (landscape) => set({ isLandscape: landscape }),
  dismissOrientationNotice: () => set({ orientationNoticeDismissed: true }),

  toggleFullscreen: async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        set({ isFullscreen: true });
        // Attempt landscape lock if allowed
        await get().lockLandscape();
      } else {
        await document.exitFullscreen();
        set({ isFullscreen: false });
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  },

  lockLandscape: async () => {
    try {
      const orientation = screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation;
      if (orientation && typeof orientation.lock === 'function') {
        await orientation.lock('landscape');
        return true;
      }
    } catch {
      // Screen orientation lock not supported or permitted on this device/browser
    }
    return false;
  },

  micEnabled: false,
  voiceChatMuted: false,
  masterMuted: false,
  audioLevel: 0,
  masterVolume: 0.8,
  sfxVolume: 0.7,
  voiceVolume: 0.8,

  toggleMic: async () => {
    const isEnabled = await audioManager.toggleMicrophone();
    set({ micEnabled: isEnabled });
    return isEnabled;
  },

  toggleVoiceChatMute: () => {
    const isMuted = audioManager.toggleVoiceMute();
    set({ voiceChatMuted: isMuted });
  },

  toggleMasterMute: () => {
    const isMuted = audioManager.toggleMasterMute();
    set({ masterMuted: isMuted });
  },

  setMasterVolume: (val) => {
    audioManager.setMasterVolume(val);
    set({ masterVolume: val });
  },

  setSfxVolume: (val) => {
    audioManager.setSfxVolume(val);
    set({ sfxVolume: val });
  },

  setVoiceVolume: (val) => {
    audioManager.setVoiceVolume(val);
    set({ voiceVolume: val });
  },

  setAudioLevel: (val) => set({ audioLevel: val }),

  playerName: 'NeonSnake',
  setPlayerName: (name) => set({ playerName: name }),

  graphicsQuality: 'performance', // Default performance mode on mobile for smooth 60fps
  setGraphicsQuality: (mode) => set({ graphicsQuality: mode }),

  leftHanded: false,
  setLeftHanded: (val) => set({ leftHanded: val }),

  joystickSize: 'normal',
  setJoystickSize: (size) => set({ joystickSize: size }),

  hapticsEnabled: true,
  setHapticsEnabled: (val) => {
    audioManager.hapticsEnabled = val;
    set({ hapticsEnabled: val });
  },

  leaderboardOpen: false,
  setLeaderboardOpen: (updater) =>
    set((state) => ({
      leaderboardOpen: typeof updater === 'function' ? updater(state.leaderboardOpen) : updater,
    })),

  settingsOpen: false,
  setSettingsOpen: (val) => set({ settingsOpen: val }),
}));
