/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Socket } from 'socket.io-client';

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;

  // Boost oscillator
  private boostOsc: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;
  private boostFilter: BiquadFilterNode | null = null;
  private isBoosting = false;

  // Voice Chat
  private localStream: MediaStream | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private analyserDataArray: Uint8Array | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private socket: Socket | null = null;

  // State
  public masterMuted = false;
  public voiceMuted = false;
  public micEnabled = false;
  public masterVolume = 0.8;
  public sfxVolume = 0.7;
  public voiceVolume = 0.8;
  public hapticsEnabled = true;

  private noteIndex = 0;
  private readonly pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterMuted ? 0 : this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = this.voiceMuted ? 0 : this.voiceVolume;
      this.voiceGain.connect(this.masterGain);
    } catch (err) {
      console.warn('AudioContext init error:', err);
    }
  }

  public setSocket(socket: Socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('voice_signal', async ({ senderId, signal }: { senderId: string; signal: any }) => {
      try {
        if (typeof RTCPeerConnection === 'undefined') return;
        let pc = this.peerConnections.get(senderId);
        if (!pc) {
          pc = this.createPeerConnection(senderId);
          if (!pc) return;
        }
        if (signal?.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.socket?.emit('voice_signal', {
              targetId: senderId,
              signal: { sdp: pc.localDescription },
            });
          }
        } else if (signal?.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.warn('Voice signal handling error:', err);
      }
    });

    this.socket.on('voice_player_disconnected', ({ playerId }: { playerId: string }) => {
      const pc = this.peerConnections.get(playerId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(playerId);
      }
      const el = this.remoteAudioElements.get(playerId);
      if (el) {
        el.srcObject = null;
        el.remove();
        this.remoteAudioElements.delete(playerId);
      }
    });
  }

  private createPeerConnection(targetId: string): RTCPeerConnection | null {
    if (typeof RTCPeerConnection === 'undefined') return null;
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && this.socket) {
          this.socket.emit('voice_signal', {
            targetId,
            signal: { candidate: event.candidate },
          });
        }
      };

      pc.ontrack = (event) => {
        let audioEl = this.remoteAudioElements.get(targetId);
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          this.remoteAudioElements.set(targetId, audioEl);
        }
        audioEl.srcObject = event.streams[0];
        audioEl.muted = this.voiceMuted || this.masterMuted;
        audioEl.volume = this.voiceVolume;
      };

      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, this.localStream!);
        });
      }

      this.peerConnections.set(targetId, pc);
      return pc;
    } catch {
      return null;
    }
  }

  public async enableMicrophone(): Promise<boolean> {
    try {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.localStream = stream;
      this.micEnabled = true;

      // Setup audio analyzer for voice activity meter
      if (this.ctx) {
        const source = this.ctx.createMediaStreamSource(stream);
        this.localAnalyser = this.ctx.createAnalyser();
        this.localAnalyser.fftSize = 64;
        source.connect(this.localAnalyser);
        this.analyserDataArray = new Uint8Array(this.localAnalyser.frequencyBinCount);
      }

      // Add tracks to existing peer connections
      this.peerConnections.forEach((pc) => {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      });

      if (this.socket) {
        this.socket.emit('voice_status', { isSpeaking: false, isMuted: false });
      }

      this.triggerHaptic('light');
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      this.micEnabled = false;
      return false;
    }
  }

  public disableMicrophone() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }
    this.micEnabled = false;
    this.localAnalyser = null;
    this.analyserDataArray = null;

    if (this.socket) {
      this.socket.emit('voice_status', { isSpeaking: false, isMuted: true });
    }
    this.triggerHaptic('light');
  }

  public toggleMicrophone(): Promise<boolean> {
    if (this.micEnabled) {
      this.disableMicrophone();
      return Promise.resolve(false);
    } else {
      return this.enableMicrophone();
    }
  }

  public getMicLevel(): number {
    if (!this.micEnabled || !this.localAnalyser || !this.analyserDataArray) return 0;
    this.localAnalyser.getByteFrequencyData(this.analyserDataArray);
    let sum = 0;
    for (let i = 0; i < this.analyserDataArray.length; i++) {
      sum += this.analyserDataArray[i];
    }
    const average = sum / this.analyserDataArray.length;
    return Math.min(1, average / 128); // 0.0 to 1.0
  }

  public toggleVoiceMute(): boolean {
    this.voiceMuted = !this.voiceMuted;
    this.updateVolumes();
    this.remoteAudioElements.forEach((el) => {
      el.muted = this.voiceMuted || this.masterMuted;
    });
    this.triggerHaptic('light');
    return this.voiceMuted;
  }

  public toggleMasterMute(): boolean {
    this.masterMuted = !this.masterMuted;
    this.updateVolumes();
    this.remoteAudioElements.forEach((el) => {
      el.muted = this.voiceMuted || this.masterMuted;
    });
    this.triggerHaptic('light');
    return this.masterMuted;
  }

  public setMasterVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    this.updateVolumes();
  }

  public setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    this.updateVolumes();
  }

  public setVoiceVolume(v: number) {
    this.voiceVolume = Math.max(0, Math.min(1, v));
    this.updateVolumes();
    this.remoteAudioElements.forEach((el) => {
      el.volume = this.voiceVolume;
    });
  }

  private updateVolumes() {
    if (!this.ctx) return;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.masterMuted ? 0 : this.masterVolume,
        this.ctx.currentTime
      );
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    if (this.voiceGain) {
      this.voiceGain.gain.setValueAtTime(
        this.voiceMuted ? 0 : this.voiceVolume,
        this.ctx.currentTime
      );
    }
  }

  // --- SOUND EFFECTS (Web Audio Synthesis) ---
  public playEatOrb(value: number = 1) {
    if (this.masterMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = this.pentatonic[this.noteIndex % this.pentatonic.length] * (value > 2 ? 1.5 : 1);
      this.noteIndex = (this.noteIndex + 1) % this.pentatonic.length;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);

      this.triggerHaptic('eat');
    } catch {
      // AudioContext error handling
    }
  }

  public startBoostHum() {
    if (this.isBoosting || this.masterMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      this.isBoosting = true;
      this.boostOsc = this.ctx.createOscillator();
      this.boostGain = this.ctx.createGain();
      this.boostFilter = this.ctx.createBiquadFilter();

      this.boostOsc.type = 'sawtooth';
      this.boostOsc.frequency.setValueAtTime(80, this.ctx.currentTime);
      this.boostOsc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.3);

      this.boostFilter.type = 'lowpass';
      this.boostFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
      this.boostFilter.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.3);

      this.boostGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.boostGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.15);

      this.boostOsc.connect(this.boostFilter);
      this.boostFilter.connect(this.boostGain);
      this.boostGain.connect(this.sfxGain);

      this.boostOsc.start();
      this.triggerHaptic('boost');
    } catch {
      // Audio context catch
    }
  }

  public stopBoostHum() {
    if (!this.isBoosting) return;
    this.isBoosting = false;
    if (this.boostGain && this.ctx) {
      try {
        this.boostGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        setTimeout(() => {
          if (this.boostOsc) {
            try {
              this.boostOsc.stop();
              this.boostOsc.disconnect();
            } catch {}
            this.boostOsc = null;
          }
        }, 120);
      } catch {
        this.boostOsc = null;
      }
    }
  }

  public playDeath() {
    if (this.masterMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      this.stopBoostHum();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);

      this.triggerHaptic('death');
    } catch {}
  }

  public playTap() {
    if (this.masterMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);

      this.triggerHaptic('light');
    } catch {}
  }

  // --- HAPTICS FOR ANDROID TOUCHSCREENS ---
  public triggerHaptic(type: 'light' | 'boost' | 'eat' | 'death') {
    if (!this.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'boost':
          navigator.vibrate([25, 20, 25]);
          break;
        case 'eat':
          navigator.vibrate(20);
          break;
        case 'death':
          navigator.vibrate([60, 40, 80]);
          break;
      }
    } catch {}
  }
}

export const audioManager = new AudioManager();
