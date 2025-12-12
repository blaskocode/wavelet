import { SampleParameter, SampleRange, SynthEvent } from "../SynthEvent";
export declare class SynthProcessorCore {
    private readonly sampleRate;
    private readonly getCurrentFrame;
    private sampleTable;
    private channels;
    private readonly eventScheduler;
    constructor(sampleRate: number, getCurrentFrame: () => number);
    get currentFrame(): number;
    private getSamples;
    addSample(data: ArrayBuffer, sampleID: number): void;
    addSampleParameter(parameter: SampleParameter, range: SampleRange): void;
    addEvent(e: SynthEvent & {
        sequenceNumber: number;
    }): void;
    noteOn(channel: number, pitch: number, velocity: number): void;
    noteOff(channel: number, pitch: number): void;
    pitchBend(channel: number, value: number): void;
    programChange(channel: number, value: number): void;
    setPitchBendSensitivity(channel: number, value: number): void;
    setMainVolume(channel: number, value: number): void;
    expression(channel: number, value: number): void;
    allSoundsOff(channel: number): void;
    allNotesOff(channel: number): void;
    hold(channel: number, value: number): void;
    setPan(channel: number, value: number): void;
    bankSelect(channel: number, value: number): void;
    modulation(channel: number, value: number): void;
    resetChannel(channel: number): void;
    private getChannelState;
    process(outputs: Float32Array[]): void;
}
