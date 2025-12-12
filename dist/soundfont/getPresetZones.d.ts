import { GeneratorParams } from "@ryohey/sf2parser";
import { GeneratorList } from "@ryohey/sf2parser/bin/Structs";
export declare function getPresetZones(generators: GeneratorList[]): {
    zones: (Partial<GeneratorParams> & {
        instrument: number;
    })[];
    globalZone: Partial<GeneratorParams>;
};
