import { SampleParameter, SampleRange } from "../SynthEvent";
export type SampleTableItem = SampleParameter & {
    velRange: [number, number];
};
export type Sample = SampleParameter & {
    buffer: Float32Array;
};
export declare class SampleTable {
    private samples;
    private sampleParameters;
    addSample(data: Float32Array, sampleID: number): void;
    addSampleParameter(parameter: SampleParameter, range: SampleRange): void;
    getSamples(bank: number, instrument: number, pitch: number, velocity: number): Sample[];
}
