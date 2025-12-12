import { Sample } from "./SampleTable";
export declare class WavetableOscillator {
    readonly sample: Sample;
    private sampleIndex;
    private _isPlaying;
    private _isNoteOff;
    private baseSpeed;
    private readonly envelope;
    private readonly pitchLFO;
    private readonly sampleRate;
    speed: number;
    private velocity;
    volume: number;
    modulation: number;
    modulationDepthRange: number;
    pan: number;
    isHold: boolean;
    constructor(sample: Sample, sampleRate: number);
    noteOn(pitch: number, velocity: number): void;
    noteOff(): void;
    forceStop(): void;
    process(outputs: Float32Array[]): void;
    get isPlaying(): boolean;
    get isNoteOff(): boolean;
    get exclusiveClass(): number | undefined;
}
