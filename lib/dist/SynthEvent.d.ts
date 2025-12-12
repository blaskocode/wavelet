import { AnyChannelEvent } from "midifile-ts";
import { AmplitudeEnvelopeParameter } from "./processor/AmplitudeEnvelope";
import { DistributiveOmit } from "./types";
export type SampleLoop = {
    type: "no_loop";
} | {
    type: "loop_continuous" | "loop_sustain";
    start: number;
    end: number;
};
export interface SampleParameter {
    name: string;
    sampleID: number;
    pitch: number;
    loop: SampleLoop;
    sampleStart: number;
    sampleEnd: number;
    sampleRate: number;
    amplitudeEnvelope: AmplitudeEnvelopeParameter;
    scaleTuning: number;
    pan: number;
    exclusiveClass?: number | undefined;
    volume: number;
}
export interface SampleRange {
    bank: number;
    instrument: number;
    keyRange: [number, number];
    velRange: [number, number];
}
export interface LoadSampleEvent {
    type: "loadSample";
    data: ArrayBuffer;
    sampleID: number;
}
export interface SampleParameterEvent {
    type: "sampleParameter";
    parameter: SampleParameter;
    range: SampleRange;
}
export type MIDIEventBody = DistributiveOmit<AnyChannelEvent, "deltaTime">;
export type MIDIEvent = {
    type: "midi";
    midi: MIDIEventBody;
    delayTime: number;
};
export type ImmediateEvent = LoadSampleEvent | SampleParameterEvent;
export type SynthEvent = ImmediateEvent | MIDIEvent;
export type SynthMessage = SynthEvent & {
    sequenceNumber: number;
};
export declare const DrumInstrumentNumber = 128;
