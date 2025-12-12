import { ImmediateEvent, MIDIEventBody, SynthEvent } from "../SynthEvent";
export declare class SynthEventScheduler {
    private readonly getCurrentFrame;
    private readonly onImmediateEvent;
    private readonly onDelayableEvent;
    private scheduledEvents;
    private currentEvents;
    constructor(getCurrentFrame: () => number, onImmediateEvent: (e: ImmediateEvent) => void, onDelayableEvent: (e: MIDIEventBody) => void);
    private get currentFrame();
    addEvent(e: SynthEvent & {
        sequenceNumber: number;
    }): void;
    processScheduledEvents(): void;
    removeScheduledEvents(channel: number): void;
}
