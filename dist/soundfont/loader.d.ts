import { LoadSampleEvent, SampleParameterEvent } from "../SynthEvent";
export interface BufferCreator {
    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer;
}
export declare const getSampleEventsFromSoundFont: (data: Uint8Array) => {
    event: LoadSampleEvent | SampleParameterEvent;
    transfer?: Transferable[];
}[];
