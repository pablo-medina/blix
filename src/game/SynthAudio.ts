type AudioContextConstructor = typeof AudioContext;

export class SynthAudio {
    private context: AudioContext | null = null;
    private master: GainNode | null = null;

    unlock(): void {
        void this.ready();
    }

    private async ready(): Promise<{ context: AudioContext; master: GainNode } | null> {
        const AudioContextClass = (
            window.AudioContext ||
            (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
        );
        if (!AudioContextClass) return null;

        if (!this.context || this.context.state === 'closed') {
            this.context = new AudioContextClass();
            this.master = this.context.createGain();
            const limiter = this.context.createDynamicsCompressor();
            this.master.gain.value = 0.78;
            limiter.threshold.value = -8;
            limiter.knee.value = 8;
            limiter.ratio.value = 10;
            limiter.attack.value = 0.002;
            limiter.release.value = 0.12;
            this.master.connect(limiter);
            limiter.connect(this.context.destination);
        }
        if (this.context.state === 'suspended') {
            try {
                await this.context.resume();
            } catch {
                return null;
            }
        }
        if (this.context.state !== 'running' || !this.master) return null;
        return { context: this.context, master: this.master };
    }

    bounce(): void {
        void this.tone(310, 135, 0.065, 'sine', 0.34);
    }

    brick(): void {
        void this.noise(0.085, 0.28, 1250);
        void this.tone(210, 72, 0.095, 'square', 0.22);
    }

    metal(): void {
        void this.tone(1080, 470, 0.09, 'triangle', 0.24);
        void this.tone(1640, 760, 0.065, 'sine', 0.14, 0.012);
    }

    laser(): void {
        void this.tone(1550, 260, 0.13, 'sawtooth', 0.2);
        void this.tone(820, 170, 0.1, 'square', 0.11, 0.015);
    }

    menuMove(): void {
        void this.tone(560, 760, 0.055, 'sine', 0.22);
    }

    menuSelect(): void {
        void this.tone(440, 820, 0.1, 'triangle', 0.24);
        void this.tone(820, 1240, 0.12, 'sine', 0.15, 0.035);
    }

    explosion(): void {
        void this.noise(0.24, 0.38, 650);
        void this.tone(145, 38, 0.25, 'sawtooth', 0.2);
    }

    enemyHit(): void {
        void this.noise(0.085, 0.24, 1750);
        void this.tone(480, 135, 0.11, 'triangle', 0.28);
        void this.tone(920, 360, 0.075, 'square', 0.11, 0.008);
    }

    enemyRam(): void {
        void this.noise(0.17, 0.34, 920);
        void this.tone(210, 52, 0.19, 'sawtooth', 0.27);
        void this.tone(680, 190, 0.115, 'triangle', 0.16, 0.012);
    }

    private async tone(
        startFrequency: number,
        endFrequency: number,
        duration: number,
        type: OscillatorType,
        volume: number,
        delay = 0
    ): Promise<void> {
        const audio = await this.ready();
        if (!audio) return;
        const { context, master } = audio;

        const start = context.currentTime + delay;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(startFrequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.01);
    }

    private async noise(duration: number, volume: number, cutoff: number): Promise<void> {
        const audio = await this.ready();
        if (!audio) return;
        const { context, master } = audio;

        const sampleCount = Math.ceil(context.sampleRate * duration);
        const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let index = 0; index < sampleCount; index++) {
            samples[index] = Math.random() * 2 - 1;
        }

        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        const start = context.currentTime;
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoff, start);
        filter.frequency.exponentialRampToValueAtTime(90, start + duration);
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        source.start(start);
    }
}
