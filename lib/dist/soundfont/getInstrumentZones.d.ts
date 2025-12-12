import { ParseResult } from "@ryohey/sf2parser";
export declare function getInstrumentZones(parsed: ParseResult, instrumentID: number): {
    zones: Partial<import("@ryohey/sf2parser").GeneratorParams>[];
    globalZone: any;
};
