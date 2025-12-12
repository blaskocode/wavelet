export interface AmplitudeEnvelopeParameter {
    attackTime: number;
    holdTime: number;
    decayTime: number;
    sustainLevel: number;
    releaseTime: number;
}
export declare class AmplitudeEnvelope {
    private readonly parameter;
    private _phase;
    private isNoteOff;
    private phaseTime;
    private decayLevel;
    private lastAmplitude;
    private readonly sampleRate;
    constructor(parameter: AmplitudeEnvelopeParameter, sampleRate: number);
    private get phase();
    private set phase(value);
    noteOn(): void;
    noteOff(): void;
    forceStop(): void;
    calculateAmplitude(bufferSize: number): number;
    getAmplitude(bufferSize: number): number;
    get isPlaying(): boolean;
}
