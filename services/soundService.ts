import { Howl } from 'howler';

// Sound effects service using Howler.js for reliable cross-platform audio

class SoundService {
  private introSound: Howl | null = null;
  private levelUpSound: Howl | null = null;
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Pre-load intro sound
    this.introSound = new Howl({
      src: ['/intro.mp3'],
      volume: 1.0,
      preload: true
    });
    
    // Pre-load level up sound
    this.levelUpSound = new Howl({
      src: ['/levelup.mp3'],
      volume: 1.0,
      preload: true
    });
  }

  // Play intro/splash sound - returns duration in ms
  playIntro(): number {
    if (!this.enabled || !this.introSound) return 3000;
    
    this.introSound.play();
    return (this.introSound.duration() * 1000) || 3000;
  }

  // Level up - play the sparkburst audio file
  playLevelUp() {
    if (!this.enabled || !this.levelUpSound) return;
    this.levelUpSound.play();
  }

  private getContext(): AudioContext | null {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Satisfying pop sound for likes - DISABLED
  playLike() {
    // Sound removed per user request
  }

  // Bookmark/save sound
  playSave() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.error('playSave error:', e);
    }
  }

  // Share sound
  playShare() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.error('playShare error:', e);
    }
  }

  // Button tap sound
  playTap() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.error('playTap error:', e);
    }
  }

  // Success sound
  playSuccess() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    try {
      [392, 523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const startTime = ctx.currentTime + i * 0.12;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
        
        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch (e) {
      console.error('playSuccess error:', e);
    }
  }

  // Initialize audio context (call on user interaction)
  async init() {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  }
}

export const soundService = new SoundService();
