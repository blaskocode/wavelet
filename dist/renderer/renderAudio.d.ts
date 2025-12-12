import { AudioData, LoadSampleEvent, SampleParameterEvent, SynthEvent } from "..";
export interface RenderAudioOptions {
    sampleRate?: number;
    onProgress?: (numFrames: number, totalFrames: number) => void;
    cancel?: () => boolean;
    bufferSize?: number;
    waitForEventLoop?: () => Promise<void>;
}
export declare const renderAudio: (samples: (LoadSampleEvent | SampleParameterEvent)[], events: SynthEvent[], options?: RenderAudioOptions) => Promise<AudioData>;
