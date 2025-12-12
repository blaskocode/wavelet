import { ImmediateEvent, MIDIEventBody } from "../SynthEvent";
import { SynthProcessorCore } from "./SynthProcessorCore";
export declare class SynthEventHandler {
    private readonly processor;
    private rpnEvents;
    private bankSelectMSB;
    constructor(processor: SynthProcessorCore);
    handleImmediateEvent(e: ImmediateEvent): void;
    handleDelayableEvent(e: MIDIEventBody): void;
}
