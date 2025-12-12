const audioDataToAudioBuffer = (audioData) => {
    const audioBuffer = new AudioBuffer({
        length: audioData.length,
        sampleRate: audioData.sampleRate,
        numberOfChannels: 2,
    });
    audioBuffer.copyToChannel(new Float32Array(audioData.leftData), 0);
    audioBuffer.copyToChannel(new Float32Array(audioData.rightData), 1);
    return audioBuffer;
};

/**
 * This is a custom implementation of Math.max to prevent call stack size exceeded error
 *   when using Math.max(...arr).
 */
function max(arr) {
    if (arr.length === 0) {
        return undefined;
    }
    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

class Logger {
    enabled = true;
    log(...args) {
        if (this.enabled) {
            console.log(...args);
        }
    }
    warn(...args) {
        if (this.enabled) {
            console.warn(...args);
        }
    }
    error(...args) {
        if (this.enabled) {
            console.error(...args);
        }
    }
}
const logger = new Logger();
logger.enabled = false;

class SampleTable {
    samples = {};
    sampleParameters = {};
    addSample(data, sampleID) {
        this.samples[sampleID] = data;
    }
    addSampleParameter(parameter, range) {
        const { bank, instrument, keyRange, velRange } = range;
        for (let i = keyRange[0]; i <= keyRange[1]; i++) {
            if (this.sampleParameters[bank] === undefined) {
                this.sampleParameters[bank] = {};
            }
            if (this.sampleParameters[bank][instrument] === undefined) {
                this.sampleParameters[bank][instrument] = {};
            }
            if (this.sampleParameters[bank][instrument][i] === undefined) {
                this.sampleParameters[bank][instrument][i] = [];
            }
            this.sampleParameters[bank][instrument][i].push({
                ...parameter,
                velRange,
            });
        }
    }
    getSamples(bank, instrument, pitch, velocity) {
        const instrumentParameters = this.sampleParameters[bank]?.[instrument] ??
            this.sampleParameters[0]?.[instrument] ?? // fallback to bank 0
            null;
        const parameters = instrumentParameters?.[pitch]?.filter((s) => velocity >= s.velRange[0] && velocity <= s.velRange[1]) ?? [];
        const samples = [];
        for (const parameter of parameters) {
            const buffer = this.samples[parameter.sampleID];
            if (buffer === undefined) {
                console.warn(`sample not found: ${parameter.sampleID}`);
                continue;
            }
            samples.push({
                ...parameter,
                buffer,
            });
        }
        return samples;
    }
}

var MIDIControlEvents = {
    MSB_BANK: 0x00,
    MSB_MODWHEEL: 0x01,
    MSB_BREATH: 0x02,
    MSB_FOOT: 0x04,
    MSB_PORTAMENTO_TIME: 0x05,
    MSB_DATA_ENTRY: 0x06,
    MSB_MAIN_VOLUME: 0x07,
    MSB_BALANCE: 0x08,
    MSB_PAN: 0x0a,
    MSB_EXPRESSION: 0x0b,
    MSB_EFFECT1: 0x0c,
    MSB_EFFECT2: 0x0d,
    MSB_GENERAL_PURPOSE1: 0x10,
    MSB_GENERAL_PURPOSE2: 0x11,
    MSB_GENERAL_PURPOSE3: 0x12,
    MSB_GENERAL_PURPOSE4: 0x13,
    LSB_BANK: 0x20,
    LSB_MODWHEEL: 0x21,
    LSB_BREATH: 0x22,
    LSB_FOOT: 0x24,
    LSB_PORTAMENTO_TIME: 0x25,
    LSB_DATA_ENTRY: 0x26,
    LSB_MAIN_VOLUME: 0x27,
    LSB_BALANCE: 0x28,
    LSB_PAN: 0x2a,
    LSB_EXPRESSION: 0x2b,
    LSB_EFFECT1: 0x2c,
    LSB_EFFECT2: 0x2d,
    LSB_GENERAL_PURPOSE1: 0x30,
    LSB_GENERAL_PURPOSE2: 0x31,
    LSB_GENERAL_PURPOSE3: 0x32,
    LSB_GENERAL_PURPOSE4: 0x33,
    SUSTAIN: 0x40,
    PORTAMENTO: 0x41,
    SOSTENUTO: 0x42,
    SUSTENUTO: 0x42,
    SOFT_PEDAL: 0x43,
    LEGATO_FOOTSWITCH: 0x44,
    HOLD2: 0x45,
    SC1_SOUND_VARIATION: 0x46,
    SC2_TIMBRE: 0x47,
    SC3_RELEASE_TIME: 0x48,
    SC4_ATTACK_TIME: 0x49,
    SC5_BRIGHTNESS: 0x4a,
    SC6: 0x4b,
    SC7: 0x4c,
    SC8: 0x4d,
    SC9: 0x4e,
    SC10: 0x4f,
    GENERAL_PURPOSE5: 0x50,
    GENERAL_PURPOSE6: 0x51,
    GENERAL_PURPOSE7: 0x52,
    GENERAL_PURPOSE8: 0x53,
    PORTAMENTO_CONTROL: 0x54,
    E1_REVERB_DEPTH: 0x5b,
    E2_TREMOLO_DEPTH: 0x5c,
    E3_CHORUS_DEPTH: 0x5d,
    E4_DETUNE_DEPTH: 0x5e,
    E5_PHASER_DEPTH: 0x5f,
    DATA_INCREMENT: 0x60,
    DATA_DECREMENT: 0x61,
    NONREG_PARM_NUM_LSB: 0x62,
    NONREG_PARM_NUM_MSB: 0x63,
    REGIST_PARM_NUM_LSB: 0x64,
    REGIST_PARM_NUM_MSB: 0x65,
    ALL_SOUNDS_OFF: 0x78,
    RESET_CONTROLLERS: 0x79,
    LOCAL_CONTROL_SWITCH: 0x7a,
    ALL_NOTES_OFF: 0x7b,
    OMNI_OFF: 0x7c,
    OMNI_ON: 0x7d,
    MONO1: 0x7e,
    MONO2: 0x7f,
};

function toCharCodes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i));
    }
    return bytes;
}

/** @class */ ((function () {
    function Buffer() {
        this.data = [];
        this.position = 0;
    }
    Object.defineProperty(Buffer.prototype, "length", {
        get: function () {
            return this.data.length;
        },
        enumerable: false,
        configurable: true
    });
    Buffer.prototype.writeByte = function (v) {
        this.data.push(v);
        this.position++;
    };
    Buffer.prototype.writeStr = function (str) {
        this.writeBytes(toCharCodes(str));
    };
    Buffer.prototype.writeInt32 = function (v) {
        this.writeByte((v >> 24) & 0xff);
        this.writeByte((v >> 16) & 0xff);
        this.writeByte((v >> 8) & 0xff);
        this.writeByte(v & 0xff);
    };
    Buffer.prototype.writeInt16 = function (v) {
        this.writeByte((v >> 8) & 0xff);
        this.writeByte(v & 0xff);
    };
    Buffer.prototype.writeBytes = function (arr) {
        var _this = this;
        arr.forEach(function (v) { return _this.writeByte(v); });
    };
    Buffer.prototype.writeChunk = function (id, func) {
        this.writeStr(id);
        var chunkBuf = new Buffer();
        func(chunkBuf);
        this.writeInt32(chunkBuf.length);
        this.writeBytes(chunkBuf.data);
    };
    Buffer.prototype.toBytes = function () {
        return new Uint8Array(this.data);
    };
    return Buffer;
})());

class SynthEventHandler {
    processor;
    rpnEvents = {};
    bankSelectMSB = {};
    constructor(processor) {
        this.processor = processor;
    }
    handleImmediateEvent(e) {
        switch (e.type) {
            case "sampleParameter":
                this.processor.addSampleParameter(e.parameter, e.range);
                break;
            case "loadSample":
                this.processor.addSample(e.data, e.sampleID);
                break;
        }
    }
    handleDelayableEvent(e) {
        logger.log("handle delayable event", e);
        switch (e.type) {
            case "channel": {
                switch (e.subtype) {
                    case "noteOn":
                        this.processor.noteOn(e.channel, e.noteNumber, e.velocity);
                        break;
                    case "noteOff":
                        this.processor.noteOff(e.channel, e.noteNumber);
                        break;
                    case "pitchBend":
                        this.processor.pitchBend(e.channel, e.value);
                        break;
                    case "programChange":
                        this.processor.programChange(e.channel, e.value);
                        break;
                    case "controller": {
                        switch (e.controllerType) {
                            case MIDIControlEvents.NONREG_PARM_NUM_MSB:
                            case MIDIControlEvents.NONREG_PARM_NUM_LSB: // NRPN LSB
                                // Delete the rpn for do not send NRPN data events
                                delete this.rpnEvents[e.channel];
                                break;
                            case MIDIControlEvents.REGIST_PARM_NUM_MSB: {
                                if (e.value === 127) {
                                    delete this.rpnEvents[e.channel];
                                }
                                else {
                                    this.rpnEvents[e.channel] = {
                                        ...this.rpnEvents[e.channel],
                                        rpnMSB: e,
                                    };
                                }
                                break;
                            }
                            case MIDIControlEvents.REGIST_PARM_NUM_LSB: {
                                if (e.value === 127) {
                                    delete this.rpnEvents[e.channel];
                                }
                                else {
                                    this.rpnEvents[e.channel] = {
                                        ...this.rpnEvents[e.channel],
                                        rpnLSB: e,
                                    };
                                }
                                break;
                            }
                            case MIDIControlEvents.MSB_DATA_ENTRY: {
                                const rpn = {
                                    ...this.rpnEvents[e.channel],
                                    dataMSB: e,
                                };
                                this.rpnEvents[e.channel] = rpn;
                                // In case of pitch bend sensitivity,
                                // send without waiting for Data LSB event
                                if (rpn.rpnLSB?.value === 0) {
                                    this.processor.setPitchBendSensitivity(e.channel, rpn.dataMSB.value);
                                }
                                break;
                            }
                            case MIDIControlEvents.LSB_DATA_ENTRY: {
                                this.rpnEvents[e.channel] = {
                                    ...this.rpnEvents[e.channel],
                                    dataLSB: e,
                                };
                                // TODO: Send other RPN events
                                break;
                            }
                            case MIDIControlEvents.MSB_MAIN_VOLUME:
                                this.processor.setMainVolume(e.channel, e.value);
                                break;
                            case MIDIControlEvents.MSB_EXPRESSION:
                                this.processor.expression(e.channel, e.value);
                                break;
                            case MIDIControlEvents.ALL_SOUNDS_OFF:
                                this.processor.allSoundsOff(e.channel);
                                break;
                            case MIDIControlEvents.ALL_NOTES_OFF:
                                this.processor.allNotesOff(e.channel);
                                break;
                            case MIDIControlEvents.SUSTAIN:
                                this.processor.hold(e.channel, e.value);
                                break;
                            case MIDIControlEvents.MSB_PAN:
                                this.processor.setPan(e.channel, e.value);
                                break;
                            case MIDIControlEvents.MSB_MODWHEEL:
                                this.processor.modulation(e.channel, e.value);
                                break;
                            case MIDIControlEvents.MSB_BANK:
                                this.bankSelectMSB[e.channel] = e.value;
                                break;
                            case MIDIControlEvents.LSB_BANK: {
                                const msb = this.bankSelectMSB[e.channel];
                                if (msb !== undefined) {
                                    const bank = (msb << 7) + e.value;
                                    this.processor.bankSelect(e.channel, bank);
                                }
                                break;
                            }
                            case MIDIControlEvents.RESET_CONTROLLERS:
                                this.processor.resetChannel(e.channel);
                                break;
                        }
                        break;
                    }
                }
                break;
            }
        }
    }
}

// https://gist.github.com/fmal/763d9c953c5a5f8b8f9099dbc58da55e
function insertSorted(arr, item, prop) {
    let low = 0;
    let high = arr.length;
    let mid;
    while (low < high) {
        mid = (low + high) >>> 1; // like (num / 2) but faster
        if (arr[mid][prop] < item[prop]) {
            low = mid + 1;
        }
        else {
            high = mid;
        }
    }
    arr.splice(low, 0, item);
}

class SynthEventScheduler {
    getCurrentFrame;
    onImmediateEvent;
    onDelayableEvent;
    scheduledEvents = [];
    currentEvents = [];
    constructor(getCurrentFrame, onImmediateEvent, onDelayableEvent) {
        this.getCurrentFrame = getCurrentFrame;
        this.onImmediateEvent = onImmediateEvent;
        this.onDelayableEvent = onDelayableEvent;
    }
    get currentFrame() {
        return this.getCurrentFrame();
    }
    addEvent(e) {
        logger.log(e);
        if ("delayTime" in e) {
            // handle in process
            insertSorted(this.scheduledEvents, {
                ...e,
                scheduledFrame: this.currentFrame + e.delayTime,
            }, "scheduledFrame");
        }
        else {
            this.onImmediateEvent(e);
        }
    }
    processScheduledEvents() {
        if (this.scheduledEvents.length === 0) {
            return;
        }
        while (true) {
            const e = this.scheduledEvents[0];
            if (e === undefined || e.scheduledFrame > this.currentFrame) {
                // scheduledEvents are sorted by scheduledFrame,
                // so we can break early instead of iterating through all scheduledEvents,
                break;
            }
            this.scheduledEvents.shift();
            this.currentEvents.push(e);
        }
        this.currentEvents.sort(sortEvents);
        while (true) {
            const e = this.currentEvents.shift();
            if (e === undefined) {
                break;
            }
            this.onDelayableEvent(e.midi);
        }
    }
    removeScheduledEvents(channel) {
        this.scheduledEvents = this.scheduledEvents.filter((e) => e.midi.channel !== channel);
        this.currentEvents = this.currentEvents.filter((e) => e.midi.channel !== channel);
    }
}
function sortEvents(a, b) {
    // First, compare by scheduledFrame.
    if (a.scheduledFrame < b.scheduledFrame) {
        return -1;
    }
    else if (a.scheduledFrame > b.scheduledFrame) {
        return 1;
    }
    // If scheduledFrame is the same, compare by sequenceNumber.
    if (a.sequenceNumber < b.sequenceNumber) {
        return -1;
    }
    else if (a.sequenceNumber > b.sequenceNumber) {
        return 1;
    }
    // If both fields are the same.
    return 0;
}

var EnvelopePhase;
(function (EnvelopePhase) {
    EnvelopePhase[EnvelopePhase["attack"] = 0] = "attack";
    EnvelopePhase[EnvelopePhase["hold"] = 1] = "hold";
    EnvelopePhase[EnvelopePhase["decay"] = 2] = "decay";
    EnvelopePhase[EnvelopePhase["sustain"] = 3] = "sustain";
    EnvelopePhase[EnvelopePhase["release"] = 4] = "release";
    EnvelopePhase[EnvelopePhase["forceStop"] = 5] = "forceStop";
    EnvelopePhase[EnvelopePhase["stopped"] = 6] = "stopped";
})(EnvelopePhase || (EnvelopePhase = {}));
const forceStopReleaseTime = 0.1;
class AmplitudeEnvelope {
    parameter;
    _phase = EnvelopePhase.stopped;
    isNoteOff = false;
    phaseTime = 0;
    decayLevel = 0; // amplitude level at the end of decay phase
    lastAmplitude = 0;
    sampleRate;
    constructor(parameter, sampleRate) {
        this.parameter = parameter;
        this.sampleRate = sampleRate;
    }
    get phase() {
        return this._phase;
    }
    set phase(phase) {
        if (this._phase === phase) {
            return;
        }
        this._phase = phase;
        this.phaseTime = 0;
    }
    noteOn() {
        this.phase = EnvelopePhase.attack;
        this.isNoteOff = false;
        this.phaseTime = 0;
        this.decayLevel = this.parameter.sustainLevel;
    }
    noteOff() {
        this.isNoteOff = true;
    }
    // Rapidly decrease the volume. This method ignores release time parameter
    forceStop() {
        this.phase = EnvelopePhase.forceStop;
    }
    calculateAmplitude(bufferSize) {
        const { attackTime, holdTime, decayTime, sustainLevel, releaseTime } = this.parameter;
        const { sampleRate } = this;
        if (this.isNoteOff &&
            (this.phase === EnvelopePhase.decay ||
                this.phase === EnvelopePhase.sustain)) {
            this.phase = EnvelopePhase.release;
            this.decayLevel = this.lastAmplitude;
        }
        // Attack
        switch (this.phase) {
            case EnvelopePhase.attack: {
                const amplificationPerFrame = (1 / (attackTime * sampleRate)) * bufferSize;
                const value = this.lastAmplitude + amplificationPerFrame;
                if (value >= 1) {
                    this.phase = EnvelopePhase.hold;
                    return 1;
                }
                return value;
            }
            case EnvelopePhase.hold: {
                if (this.phaseTime >= holdTime) {
                    this.phase = EnvelopePhase.decay;
                }
                return this.lastAmplitude;
            }
            case EnvelopePhase.decay: {
                const attenuationDecibel = linearToDecibel(sustainLevel / 1);
                const value = logAttenuation(1.0, attenuationDecibel, decayTime, this.phaseTime);
                if (this.phaseTime > decayTime) {
                    if (sustainLevel <= 0) {
                        this.phase = EnvelopePhase.stopped;
                        return 0;
                    }
                    else {
                        this.phase = EnvelopePhase.sustain;
                        return sustainLevel;
                    }
                }
                return value;
            }
            case EnvelopePhase.sustain: {
                return sustainLevel;
            }
            case EnvelopePhase.release: {
                const value = logAttenuation(this.decayLevel, -100, // -100dB means almost silence
                releaseTime, this.phaseTime);
                if (this.phaseTime > releaseTime || value <= 0) {
                    this.phase = EnvelopePhase.stopped;
                    return 0;
                }
                return value;
            }
            case EnvelopePhase.forceStop: {
                const attenuationPerFrame = (1 / (forceStopReleaseTime * sampleRate)) * bufferSize;
                const value = this.lastAmplitude - attenuationPerFrame;
                if (value <= 0) {
                    this.phase = EnvelopePhase.stopped;
                    return 0;
                }
                return value;
            }
            case EnvelopePhase.stopped: {
                return 0;
            }
        }
    }
    getAmplitude(bufferSize) {
        const value = this.calculateAmplitude(bufferSize);
        this.lastAmplitude = value;
        this.phaseTime += bufferSize / sampleRate;
        return value;
    }
    get isPlaying() {
        return this.phase !== EnvelopePhase.stopped;
    }
}
// An exponential decay function. It attenuates the value of decibel over the duration time.
function logAttenuation(fromLevel, attenuationDecibel, duration, time) {
    return fromLevel * decibelToLinear((attenuationDecibel / duration) * time);
}
function linearToDecibel(value) {
    return 20 * Math.log10(value);
}
function decibelToLinear(value) {
    return Math.pow(10, value / 20);
}

class LFO {
    // Hz
    frequency = 5;
    phase = 0;
    sampleRate;
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
    }
    getValue(bufferSize) {
        const phase = this.phase;
        this.phase +=
            ((Math.PI * 2 * this.frequency) / this.sampleRate) * bufferSize;
        return Math.sin(phase);
    }
}

class WavetableOscillator {
    sample;
    sampleIndex = 0;
    _isPlaying = false;
    _isNoteOff = false;
    baseSpeed = 1;
    envelope;
    pitchLFO;
    sampleRate;
    speed = 1;
    // 0 to 1
    velocity = 1;
    // 0 to 1
    volume = 1;
    modulation = 0;
    // cent
    modulationDepthRange = 50;
    // -1 to 1
    pan = 0;
    // This oscillator should be note off when hold pedal off
    isHold = false;
    constructor(sample, sampleRate) {
        this.sample = sample;
        this.sampleRate = sampleRate;
        this.envelope = new AmplitudeEnvelope(sample.amplitudeEnvelope, sampleRate);
        this.pitchLFO = new LFO(sampleRate);
    }
    noteOn(pitch, velocity) {
        this.velocity = velocity;
        this._isPlaying = true;
        this.sampleIndex = this.sample.sampleStart;
        this.baseSpeed = Math.pow(2, ((pitch - this.sample.pitch) / 12) * this.sample.scaleTuning);
        this.pitchLFO.frequency = 5;
        this.envelope.noteOn();
    }
    noteOff() {
        this.envelope.noteOff();
        this._isNoteOff = true;
    }
    forceStop() {
        this.envelope.forceStop();
    }
    process(outputs) {
        if (!this._isPlaying) {
            return;
        }
        const speed = (this.baseSpeed * this.speed * this.sample.sampleRate) / this.sampleRate;
        const volume = (this.velocity * this.volume) ** 2 * this.sample.volume;
        // zero to pi/2
        const panTheta = ((Math.min(1, Math.max(-1, this.pan + this.sample.pan)) + 1) * Math.PI) /
            4;
        const leftPanVolume = Math.cos(panTheta);
        const rightPanVolume = Math.sin(panTheta);
        const gain = this.envelope.getAmplitude(outputs[0].length);
        const leftGain = gain * volume * leftPanVolume;
        const rightGain = gain * volume * rightPanVolume;
        const pitchLFOValue = this.pitchLFO.getValue(outputs[0].length);
        const pitchModulation = pitchLFOValue * this.modulation * (this.modulationDepthRange / 1200);
        const modulatedSpeed = speed * (1 + pitchModulation);
        for (let i = 0; i < outputs[0].length; ++i) {
            const index = Math.floor(this.sampleIndex);
            const advancedIndex = this.sampleIndex + modulatedSpeed;
            let loopIndex = null;
            if ((this.sample.loop.type === "loop_continuous" ||
                (this.sample.loop.type === "loop_sustain" && !this._isNoteOff)) &&
                advancedIndex >= this.sample.loop.end) {
                loopIndex =
                    this.sample.loop.start + (advancedIndex - Math.floor(advancedIndex));
            }
            const nextIndex = loopIndex !== null
                ? Math.floor(loopIndex)
                : Math.min(index + 1, this.sample.sampleEnd - 1);
            // linear interpolation
            const current = this.sample.buffer[index];
            const next = this.sample.buffer[nextIndex];
            const level = current + (next - current) * (this.sampleIndex - index);
            outputs[0][i] += level * leftGain;
            outputs[1][i] += level * rightGain;
            this.sampleIndex = loopIndex ?? advancedIndex;
            if (this.sampleIndex >= this.sample.sampleEnd) {
                this._isPlaying = false;
                break;
            }
        }
    }
    get isPlaying() {
        return this._isPlaying && this.envelope.isPlaying;
    }
    get isNoteOff() {
        return this._isNoteOff;
    }
    get exclusiveClass() {
        return this.sample.exclusiveClass;
    }
}

const initialChannelState = () => ({
    volume: 1,
    bank: 0,
    instrument: 0,
    pitchBend: 0,
    pitchBendSensitivity: 2,
    oscillators: {},
    expression: 1,
    pan: 0,
    modulation: 0,
    hold: false,
});
const RHYTHM_CHANNEL = 9;
const RHYTHM_BANK = 128;
class SynthProcessorCore {
    sampleRate;
    getCurrentFrame;
    sampleTable = new SampleTable();
    channels = {};
    eventScheduler;
    constructor(sampleRate, getCurrentFrame) {
        this.sampleRate = sampleRate;
        this.getCurrentFrame = getCurrentFrame;
        const eventHandler = new SynthEventHandler(this);
        this.eventScheduler = new SynthEventScheduler(getCurrentFrame, (e) => eventHandler.handleImmediateEvent(e), (e) => eventHandler.handleDelayableEvent(e));
        this.sampleRate = sampleRate;
        this.getCurrentFrame = getCurrentFrame;
    }
    get currentFrame() {
        return this.getCurrentFrame();
    }
    getSamples(channel, pitch, velocity) {
        const state = this.getChannelState(channel);
        // Play drums for CH.10
        const bank = channel === RHYTHM_CHANNEL ? RHYTHM_BANK : state.bank;
        return this.sampleTable.getSamples(bank, state.instrument, pitch, velocity);
    }
    addSample(data, sampleID) {
        this.sampleTable.addSample(new Float32Array(data), sampleID);
    }
    addSampleParameter(parameter, range) {
        this.sampleTable.addSampleParameter(parameter, range);
    }
    addEvent(e) {
        this.eventScheduler.addEvent(e);
    }
    noteOn(channel, pitch, velocity) {
        const state = this.getChannelState(channel);
        const samples = this.getSamples(channel, pitch, velocity);
        if (samples.length === 0) {
            logger.warn(`There is no sample for noteNumber ${pitch} in instrument ${state.instrument} in bank ${state.bank}`);
            return;
        }
        for (const sample of samples) {
            const oscillator = new WavetableOscillator(sample, this.sampleRate);
            const volume = velocity / 127;
            oscillator.noteOn(pitch, volume);
            if (state.oscillators[pitch] === undefined) {
                state.oscillators[pitch] = [];
            }
            if (sample.exclusiveClass !== undefined) {
                for (const key in state.oscillators) {
                    for (const osc of state.oscillators[key]) {
                        if (osc.exclusiveClass === sample.exclusiveClass) {
                            osc.forceStop();
                        }
                    }
                }
            }
            state.oscillators[pitch].push(oscillator);
        }
    }
    noteOff(channel, pitch) {
        const state = this.getChannelState(channel);
        if (state.oscillators[pitch] === undefined) {
            return;
        }
        for (const osc of state.oscillators[pitch]) {
            if (!osc.isNoteOff) {
                if (state.hold) {
                    osc.isHold = true;
                }
                else {
                    osc.noteOff();
                }
            }
        }
    }
    pitchBend(channel, value) {
        const state = this.getChannelState(channel);
        state.pitchBend = (value / 0x2000 - 1) * state.pitchBendSensitivity;
    }
    programChange(channel, value) {
        const state = this.getChannelState(channel);
        state.instrument = value;
    }
    setPitchBendSensitivity(channel, value) {
        const state = this.getChannelState(channel);
        state.pitchBendSensitivity = value;
    }
    setMainVolume(channel, value) {
        const state = this.getChannelState(channel);
        state.volume = value / 127;
    }
    expression(channel, value) {
        const state = this.getChannelState(channel);
        state.expression = value / 127;
    }
    allSoundsOff(channel) {
        this.eventScheduler.removeScheduledEvents(channel);
        const state = this.getChannelState(channel);
        for (const key in state.oscillators) {
            for (const osc of state.oscillators[key]) {
                osc.forceStop();
            }
        }
    }
    allNotesOff(channel) {
        const state = this.getChannelState(channel);
        for (const key in state.oscillators) {
            for (const osc of state.oscillators[key]) {
                osc.noteOff();
            }
        }
    }
    hold(channel, value) {
        const hold = value >= 64;
        const state = this.getChannelState(channel);
        state.hold = hold;
        if (hold) {
            return;
        }
        for (const key in state.oscillators) {
            for (const osc of state.oscillators[key]) {
                if (osc.isHold) {
                    osc.noteOff();
                }
            }
        }
    }
    setPan(channel, value) {
        const state = this.getChannelState(channel);
        state.pan = (value / 127 - 0.5) * 2;
    }
    bankSelect(channel, value) {
        const state = this.getChannelState(channel);
        state.bank = value;
    }
    modulation(channel, value) {
        const state = this.getChannelState(channel);
        state.modulation = value / 127;
    }
    resetChannel(channel) {
        delete this.channels[channel];
    }
    getChannelState(channel) {
        const state = this.channels[channel];
        if (state !== undefined) {
            return state;
        }
        const newState = initialChannelState();
        this.channels[channel] = newState;
        return newState;
    }
    process(outputs) {
        this.eventScheduler.processScheduledEvents();
        for (const channel in this.channels) {
            const state = this.channels[channel];
            for (let key in state.oscillators) {
                state.oscillators[key] = state.oscillators[key].filter((oscillator) => {
                    oscillator.speed = Math.pow(2, state.pitchBend / 12);
                    oscillator.volume = state.volume * state.expression;
                    oscillator.pan = state.pan;
                    oscillator.modulation = state.modulation;
                    oscillator.process([outputs[0], outputs[1]]);
                    if (!oscillator.isPlaying) {
                        return false;
                    }
                    return true;
                });
            }
        }
    }
}

// returns in frame unit
const getSongLength = (events) => max(events.map((e) => (e.type === "midi" ? e.delayTime : 0))) ?? 0;
// Maximum time to wait for the note release sound to become silent
const silentTimeoutSec = 5;
const isArrayZero = (arr) => {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== 0) {
            return false;
        }
    }
    return true;
};
const renderAudio = async (samples, events, options) => {
    let currentFrame = 0;
    const sampleRate = options?.sampleRate ?? 44100;
    const bufSize = options?.bufferSize ?? 500;
    const synth = new SynthProcessorCore(sampleRate, () => currentFrame);
    let sequenceNumber = 0;
    samples.forEach((e) => synth.addEvent({ ...e, sequenceNumber: sequenceNumber++ }));
    events.forEach((e) => synth.addEvent({ ...e, sequenceNumber: sequenceNumber++ }));
    const songLengthFrame = getSongLength(events);
    const iterCount = Math.ceil(songLengthFrame / bufSize);
    const additionalIterCount = Math.ceil((silentTimeoutSec * sampleRate) / bufSize);
    const allIterCount = iterCount + additionalIterCount;
    const audioBufferSize = allIterCount * bufSize;
    const leftData = new Float32Array(audioBufferSize);
    const rightData = new Float32Array(audioBufferSize);
    const buffer = [new Float32Array(bufSize), new Float32Array(bufSize)];
    for (let i = 0; i < allIterCount; i++) {
        buffer[0].fill(0);
        buffer[1].fill(0);
        synth.process(buffer);
        const offset = i * bufSize;
        leftData.set(buffer[0], offset);
        rightData.set(buffer[1], offset);
        currentFrame += bufSize;
        // Wait for silence after playback is complete.
        if (i > iterCount && isArrayZero(buffer[0]) && isArrayZero(buffer[1])) {
            console.log(`early break ${i} in ${iterCount + additionalIterCount}`);
            break;
        }
        // give a chance to terminate the loop or update progress
        if (i % 1000 === 0) {
            await options?.waitForEventLoop?.();
            options?.onProgress?.(offset, audioBufferSize);
            if (options?.cancel?.()) {
                throw new Error("renderAudio cancelled");
            }
        }
    }
    // slice() to delete silent parts
    const trimmedLeft = leftData.slice(0, currentFrame);
    const trimmedRight = rightData.slice(0, currentFrame);
    return {
        length: trimmedLeft.length,
        leftData: trimmedLeft.buffer,
        rightData: trimmedRight.buffer,
        sampleRate,
    };
};

class Stream {
    constructor(data, offset) {
        this.data = data;
        this.ip = offset;
    }
    readString(size) {
        const str = String.fromCharCode.apply(null, this.data.subarray(this.ip, (this.ip += size)));
        const nullLocation = str.indexOf("\u0000");
        if (nullLocation > 0) {
            return str.substr(0, nullLocation);
        }
        return str;
    }
    readWORD() {
        return this.data[this.ip++] | (this.data[this.ip++] << 8);
    }
    readDWORD(bigEndian = false) {
        if (bigEndian) {
            return (((this.data[this.ip++] << 24) |
                (this.data[this.ip++] << 16) |
                (this.data[this.ip++] << 8) |
                this.data[this.ip++]) >>>
                0);
        }
        else {
            return ((this.data[this.ip++] |
                (this.data[this.ip++] << 8) |
                (this.data[this.ip++] << 16) |
                (this.data[this.ip++] << 24)) >>>
                0);
        }
    }
    readByte() {
        return this.data[this.ip++];
    }
    readAt(offset) {
        return this.data[this.ip + offset];
    }
    /* helper */
    readUInt8() {
        return this.readByte();
    }
    readInt8() {
        return (this.readByte() << 24) >> 24;
    }
    readUInt16() {
        return this.readWORD();
    }
    readInt16() {
        return (this.readWORD() << 16) >> 16;
    }
    readUInt32() {
        return this.readDWORD();
    }
}

function parseChunk$1(input, ip, bigEndian) {
    const stream = new Stream(input, ip);
    const type = stream.readString(4);
    const size = stream.readDWORD(bigEndian);
    return new Chunk(type, size, stream.ip);
}
function parseRiff(input, index = 0, length, { padding = true, bigEndian = false } = {}) {
    const chunkList = [];
    const end = length + index;
    let ip = index;
    while (ip < end) {
        const chunk = parseChunk$1(input, ip, bigEndian);
        ip = chunk.offset + chunk.size;
        // padding
        if (padding && ((ip - index) & 1) === 1) {
            ip++;
        }
        chunkList.push(chunk);
    }
    return chunkList;
}
class Chunk {
    constructor(type, size, offset) {
        this.type = type;
        this.size = size;
        this.offset = offset;
    }
}

const GeneratorEnumeratorTable = [
    "startAddrsOffset",
    "endAddrsOffset",
    "startloopAddrsOffset",
    "endloopAddrsOffset",
    "startAddrsCoarseOffset",
    "modLfoToPitch",
    "vibLfoToPitch",
    "modEnvToPitch",
    "initialFilterFc",
    "initialFilterQ",
    "modLfoToFilterFc",
    "modEnvToFilterFc",
    "endAddrsCoarseOffset",
    "modLfoToVolume",
    undefined, // 14
    "chorusEffectsSend",
    "reverbEffectsSend",
    "pan",
    undefined,
    undefined,
    undefined, // 18,19,20
    "delayModLFO",
    "freqModLFO",
    "delayVibLFO",
    "freqVibLFO",
    "delayModEnv",
    "attackModEnv",
    "holdModEnv",
    "decayModEnv",
    "sustainModEnv",
    "releaseModEnv",
    "keynumToModEnvHold",
    "keynumToModEnvDecay",
    "delayVolEnv",
    "attackVolEnv",
    "holdVolEnv",
    "decayVolEnv",
    "sustainVolEnv",
    "releaseVolEnv",
    "keynumToVolEnvHold",
    "keynumToVolEnvDecay",
    "instrument",
    undefined, // 42
    "keyRange",
    "velRange",
    "startloopAddrsCoarseOffset",
    "keynum",
    "velocity",
    "initialAttenuation",
    undefined, // 49
    "endloopAddrsCoarseOffset",
    "coarseTune",
    "fineTune",
    "sampleID",
    "sampleModes",
    undefined, // 55
    "scaleTuning",
    "exclusiveClass",
    "overridingRootKey",
];

class VersionTag {
    static parse(stream) {
        const v = new VersionTag();
        v.major = stream.readInt8();
        v.minor = stream.readInt8();
        return v;
    }
}
class Info {
    // LIST - INFO の全ての chunk
    static parse(data, chunks) {
        function getChunk(type) {
            return chunks.find((c) => c.type === type);
        }
        function toStream(chunk) {
            return new Stream(data, chunk.offset);
        }
        function readString(type) {
            const chunk = getChunk(type);
            if (!chunk) {
                return null;
            }
            return toStream(chunk).readString(chunk.size);
        }
        function readVersionTag(type) {
            const chunk = getChunk(type);
            if (!chunk) {
                return null;
            }
            return VersionTag.parse(toStream(chunk));
        }
        const info = new Info();
        info.comment = readString("ICMT");
        info.copyright = readString("ICOP");
        info.creationDate = readString("ICRD");
        info.engineer = readString("IENG");
        info.name = readString("INAM");
        info.product = readString("IPRD");
        info.software = readString("ISFT");
        info.version = readVersionTag("ifil");
        info.soundEngine = readString("isng");
        info.romName = readString("irom");
        info.romVersion = readVersionTag("iver");
        return info;
    }
}
class PresetHeader {
    get isEnd() {
        return this.presetName === "EOP";
    }
    static parse(stream) {
        const p = new PresetHeader();
        p.presetName = stream.readString(20);
        p.preset = stream.readWORD();
        p.bank = stream.readWORD();
        p.presetBagIndex = stream.readWORD();
        p.library = stream.readDWORD();
        p.genre = stream.readDWORD();
        p.morphology = stream.readDWORD();
        return p;
    }
}
class PresetBag {
    static parse(stream) {
        const p = new PresetBag();
        p.presetGeneratorIndex = stream.readWORD();
        p.presetModulatorIndex = stream.readWORD();
        return p;
    }
}
class RangeValue {
    constructor(lo, hi) {
        this.lo = lo;
        this.hi = hi;
    }
    static parse(stream) {
        return new RangeValue(stream.readByte(), stream.readByte());
    }
}
class ModulatorList {
    get type() {
        return GeneratorEnumeratorTable[this.destinationOper];
    }
    get isEnd() {
        return (this.sourceOper === 0 &&
            this.destinationOper === 0 &&
            this.value === 0 &&
            this.amountSourceOper === 0 &&
            this.transOper === 0);
    }
    static parse(stream) {
        const t = new ModulatorList();
        t.sourceOper = stream.readWORD();
        t.destinationOper = stream.readWORD();
        switch (t.type) {
            case "keyRange": /* FALLTHROUGH */
            case "velRange": /* FALLTHROUGH */
            case "keynum": /* FALLTHROUGH */
            case "velocity":
                t.value = RangeValue.parse(stream);
                break;
            default:
                t.value = stream.readInt16();
                break;
        }
        t.amountSourceOper = stream.readWORD();
        t.transOper = stream.readWORD();
        return t;
    }
}
class GeneratorList {
    get type() {
        return GeneratorEnumeratorTable[this.code];
    }
    get isEnd() {
        return this.code === 0 && this.value === 0;
    }
    static parse(stream) {
        const t = new GeneratorList();
        t.code = stream.readWORD();
        switch (t.type) {
            case "keynum": /* FALLTHROUGH */
            case "keyRange": /* FALLTHROUGH */
            case "velRange": /* FALLTHROUGH */
            case "velocity":
                t.value = RangeValue.parse(stream);
                break;
            default:
                t.value = stream.readInt16();
                break;
        }
        return t;
    }
}
class Instrument {
    get isEnd() {
        return this.instrumentName === "EOI";
    }
    static parse(stream) {
        const t = new Instrument();
        t.instrumentName = stream.readString(20);
        t.instrumentBagIndex = stream.readWORD();
        return t;
    }
}
class InstrumentBag {
    static parse(stream) {
        const t = new InstrumentBag();
        t.instrumentGeneratorIndex = stream.readWORD();
        t.instrumentModulatorIndex = stream.readWORD();
        return t;
    }
}
class SampleHeader {
    get isEnd() {
        return this.sampleName === "EOS";
    }
    static parse(stream) {
        const s = new SampleHeader();
        s.sampleName = stream.readString(20);
        s.start = stream.readDWORD();
        s.end = stream.readDWORD();
        s.loopStart = stream.readDWORD();
        s.loopEnd = stream.readDWORD();
        s.sampleRate = stream.readDWORD();
        s.originalPitch = stream.readByte();
        s.pitchCorrection = stream.readInt8();
        s.sampleLink = stream.readWORD();
        s.sampleType = stream.readWORD();
        s.loopStart -= s.start;
        s.loopEnd -= s.start;
        return s;
    }
}

function parse(input, option = {}) {
    // parse RIFF chunk
    const chunkList = parseRiff(input, 0, input.length, option);
    if (chunkList.length !== 1) {
        throw new Error("wrong chunk length");
    }
    const chunk = chunkList[0];
    if (chunk === null) {
        throw new Error("chunk not found");
    }
    function parseRiffChunk(chunk, data) {
        const chunkList = getChunkList(chunk, data, "RIFF", "sfbk");
        if (chunkList.length !== 3) {
            throw new Error("invalid sfbk structure");
        }
        return Object.assign({ 
            // INFO-list
            info: parseInfoList(chunkList[0], data), 
            // sdta-list
            samplingData: parseSdtaList(chunkList[1], data) }, parsePdtaList(chunkList[2], data));
    }
    function parsePdtaList(chunk, data) {
        const chunkList = getChunkList(chunk, data, "LIST", "pdta");
        // check number of chunks
        if (chunkList.length !== 9) {
            throw new Error("invalid pdta chunk");
        }
        return {
            presetHeaders: parsePhdr(chunkList[0], data),
            presetZone: parsePbag(chunkList[1], data),
            presetModulators: parsePmod(chunkList[2], data),
            presetGenerators: parsePgen(chunkList[3], data),
            instruments: parseInst(chunkList[4], data),
            instrumentZone: parseIbag(chunkList[5], data),
            instrumentModulators: parseImod(chunkList[6], data),
            instrumentGenerators: parseIgen(chunkList[7], data),
            sampleHeaders: parseShdr(chunkList[8], data),
        };
    }
    const result = parseRiffChunk(chunk, input);
    return Object.assign(Object.assign({}, result), { samples: loadSample(result.sampleHeaders, result.samplingData.offsetMSB, result.samplingData.offsetLSB, input) });
}
function getChunkList(chunk, data, expectedType, expectedSignature) {
    // check parse target
    if (chunk.type !== expectedType) {
        throw new Error("invalid chunk type:" + chunk.type);
    }
    const stream = new Stream(data, chunk.offset);
    // check signature
    const signature = stream.readString(4);
    if (signature !== expectedSignature) {
        throw new Error("invalid signature:" + signature);
    }
    // read structure
    return parseRiff(data, stream.ip, chunk.size - 4);
}
function parseInfoList(chunk, data) {
    const chunkList = getChunkList(chunk, data, "LIST", "INFO");
    return Info.parse(data, chunkList);
}
function parseSdtaList(chunk, data) {
    var _a;
    const chunkList = getChunkList(chunk, data, "LIST", "sdta");
    return {
        offsetMSB: chunkList[0].offset,
        offsetLSB: (_a = chunkList[1]) === null || _a === void 0 ? void 0 : _a.offset,
    };
}
function parseChunk(chunk, data, type, clazz, terminate) {
    const result = [];
    if (chunk.type !== type) {
        throw new Error("invalid chunk type:" + chunk.type);
    }
    const stream = new Stream(data, chunk.offset);
    const size = chunk.offset + chunk.size;
    while (stream.ip < size) {
        const obj = clazz.parse(stream);
        if (terminate && terminate(obj)) {
            break;
        }
        result.push(obj);
    }
    return result;
}
const parsePhdr = (chunk, data) => parseChunk(chunk, data, "phdr", PresetHeader, (p) => p.isEnd);
const parsePbag = (chunk, data) => parseChunk(chunk, data, "pbag", PresetBag);
const parseInst = (chunk, data) => parseChunk(chunk, data, "inst", Instrument, (i) => i.isEnd);
const parseIbag = (chunk, data) => parseChunk(chunk, data, "ibag", InstrumentBag);
const parsePmod = (chunk, data) => parseChunk(chunk, data, "pmod", ModulatorList, (m) => m.isEnd);
const parseImod = (chunk, data) => parseChunk(chunk, data, "imod", ModulatorList, (m) => m.isEnd);
const parsePgen = (chunk, data) => parseChunk(chunk, data, "pgen", GeneratorList, (g) => g.isEnd);
const parseIgen = (chunk, data) => parseChunk(chunk, data, "igen", GeneratorList);
const parseShdr = (chunk, data) => parseChunk(chunk, data, "shdr", SampleHeader, (s) => s.isEnd);
function adjustSampleData(sample, sampleRate) {
    let multiply = 1;
    // buffer
    while (sampleRate < 22050) {
        const newSample = new Int16Array(sample.length * 2);
        for (let i = 0, j = 0, il = sample.length; i < il; ++i) {
            newSample[j++] = sample[i];
            newSample[j++] = sample[i];
        }
        sample = newSample;
        multiply *= 2;
        sampleRate *= 2;
    }
    return {
        sample,
        multiply,
    };
}
function loadSample(sampleHeader, samplingDataOffsetMSB, samplingDataOffsetLSB, data) {
    return sampleHeader.map((header) => {
        let sample = new Int16Array(new Uint8Array(data.subarray(samplingDataOffsetMSB + header.start * 2, samplingDataOffsetMSB + header.end * 2)).buffer);
        // TODO: support 24bit sample
        if (header.sampleRate > 0) {
            const adjust = adjustSampleData(sample, header.sampleRate);
            sample = adjust.sample;
            header.sampleRate *= adjust.multiply;
            header.loopStart *= adjust.multiply;
            header.loopEnd *= adjust.multiply;
        }
        return sample;
    });
}

function createGeneraterObject(generators) {
    const result = {};
    for (const gen of generators) {
        const type = gen.type;
        if (type !== undefined) {
            result[type] = gen.value;
        }
    }
    return result;
}
const defaultInstrumentZone = {
    keynum: undefined,
    instrument: undefined,
    velocity: undefined,
    exclusiveClass: undefined,
    keyRange: new RangeValue(0, 127),
    velRange: new RangeValue(0, 127),
    sampleID: undefined,
    delayVolEnv: -12000,
    attackVolEnv: -12000,
    decayVolEnv: -12000,
    holdVolEnv: -12000,
    sustainVolEnv: 0,
    releaseVolEnv: -12000,
    delayModEnv: -12000,
    attackModEnv: -12000,
    decayModEnv: -12000,
    holdModEnv: -12000,
    sustainModEnv: 0,
    releaseModEnv: -12000,
    modEnvToPitch: 0,
    modEnvToFilterFc: 0,
    modLfoToFilterFc: 0,
    modLfoToPitch: 0,
    modLfoToVolume: 0,
    vibLfoToPitch: 0,
    chorusEffectsSend: 0,
    reverbEffectsSend: 0,
    delayModLFO: 0,
    freqModLFO: 0,
    delayVibLFO: 0,
    keynumToModEnvDecay: 0,
    keynumToModEnvHold: 0,
    keynumToVolEnvDecay: 0,
    keynumToVolEnvHold: 0,
    coarseTune: 0,
    fineTune: 0,
    scaleTuning: 100,
    freqVibLFO: 0,
    startAddrsOffset: 0,
    startAddrsCoarseOffset: 0,
    endAddrsOffset: 0,
    endAddrsCoarseOffset: 0,
    startloopAddrsOffset: 0,
    startloopAddrsCoarseOffset: 0,
    initialAttenuation: 0,
    endloopAddrsOffset: 0,
    endloopAddrsCoarseOffset: 0,
    overridingRootKey: undefined,
    initialFilterQ: 1,
    initialFilterFc: 13500,
    sampleModes: 0,
    pan: undefined,
};

function arrayRange(start, end) {
    return Array.from({ length: end - start }, (_, k) => k + start);
}
function getInstrumentZone(parsed, instrumentZoneIndex) {
    const instrumentBag = parsed.instrumentZone[instrumentZoneIndex];
    const nextInstrumentBag = parsed.instrumentZone[instrumentZoneIndex + 1];
    const generatorIndex = instrumentBag.instrumentGeneratorIndex;
    const nextGeneratorIndex = nextInstrumentBag
        ? nextInstrumentBag.instrumentGeneratorIndex
        : parsed.instrumentGenerators.length;
    return parsed.instrumentGenerators.slice(generatorIndex, nextGeneratorIndex);
}
function getInstrumentZoneIndexes(parsed, instrumentID) {
    const instrument = parsed.instruments[instrumentID];
    const nextInstrument = parsed.instruments[instrumentID + 1];
    return arrayRange(instrument.instrumentBagIndex, nextInstrument
        ? nextInstrument.instrumentBagIndex
        : parsed.instrumentZone.length);
}
function getInstrumentGenerators(parsed, instrumentID) {
    return getInstrumentZoneIndexes(parsed, instrumentID).map((i) => getInstrumentZone(parsed, i));
}

function getPresetGenerators(parsed, presetHeaderIndex) {
    let presetGenerators;
    const presetHeader = parsed.presetHeaders[presetHeaderIndex];
    const presetBag = parsed.presetZone[presetHeader.presetBagIndex];
    const nextPresetHeaderIndex = presetHeaderIndex + 1;
    if (nextPresetHeaderIndex < parsed.presetHeaders.length) {
        // 次の preset までのすべての generator を取得する
        const nextPresetHeader = parsed.presetHeaders[nextPresetHeaderIndex];
        const nextPresetBag = parsed.presetZone[nextPresetHeader.presetBagIndex];
        presetGenerators = parsed.presetGenerators.slice(presetBag.presetGeneratorIndex, nextPresetBag.presetGeneratorIndex);
    }
    else {
        // 最後の preset だった場合は最後まで取得する
        presetGenerators = parsed.presetGenerators.slice(presetBag.presetGeneratorIndex, parsed.presetGenerators.length);
    }
    return presetGenerators;
}

function getInstrumentZones(parsed, instrumentID) {
    const instrumentGenerators = getInstrumentGenerators(parsed, instrumentID);
    const zones = instrumentGenerators.map(createGeneraterObject);
    // Handle empty zones array
    if (zones.length === 0) {
        return {
            zones: [],
            globalZone: undefined,
        };
    }
    // If the first zone does not have sampleID, it is a global instrument zone.
    let globalZone;
    const firstInstrumentZone = zones[0];
    if (firstInstrumentZone && firstInstrumentZone.sampleID === undefined) {
        globalZone = zones[0];
    }
    return {
        zones: zones.filter((zone) => zone.sampleID !== undefined),
        globalZone,
    };
}

function getPresetZones(generators) {
    let globalZone = {};
    const zones = [];
    let params = {};
    let zoneCount = 0;
    for (const gen of generators) {
        const type = gen.type;
        if (type === undefined) {
            continue;
        }
        // keyRange or velRange must be the first of zone
        if (type === "keyRange" || type === "velRange") {
            if (zoneCount === 1 && zones.length === 0) {
                // treat previous zone as global zone if it is the first zone and not ended with instrument
                globalZone = params;
            }
            params = {};
            zoneCount++;
        }
        // instrument must be the last of zone
        if (type === "instrument") {
            zones.push({ ...params, instrument: gen.value });
        }
        params[type] = gen.value;
    }
    return { zones, globalZone };
}

const parseSamplesFromSoundFont = (data) => {
    const parsed = parse(data);
    const result = [];
    const convertedSampleBuffers = {};
    function addSampleIfNeeded(sampleID) {
        const cached = convertedSampleBuffers[sampleID];
        if (cached) {
            return cached;
        }
        // Bounds check for sampleID
        if (sampleID < 0 || sampleID >= parsed.samples.length) {
            console.warn(`Cannot load sample ${sampleID}: index out of bounds (valid range: 0-${parsed.samples.length - 1})`);
            return new Float32Array(0);
        }
        const sample = parsed.samples[sampleID];
        const audioData = new Float32Array(sample.length);
        for (let i = 0; i < sample.length; i++) {
            audioData[i] = sample[i] / 32767;
        }
        convertedSampleBuffers[sampleID] = audioData;
        return audioData;
    }
    for (let i = 0; i < parsed.presetHeaders.length; i++) {
        const presetHeader = parsed.presetHeaders[i];
        const presetGenerators = getPresetGenerators(parsed, i);
        const presetZones = getPresetZones(presetGenerators);
        for (const presetZone of presetZones.zones) {
            const presetGen = {
                ...removeUndefined(presetZones.globalZone ?? {}),
                ...removeUndefined(presetZone),
            };
            const instrumentID = presetZone.instrument;
            // Bounds check for instrumentID before accessing instruments array
            if (instrumentID === undefined || instrumentID < 0 || instrumentID >= parsed.instruments.length) {
                console.warn(`Skipping preset zone with invalid instrumentID ${instrumentID} (valid range: 0-${parsed.instruments.length - 1})`);
                continue;
            }
            const instrumentZones = getInstrumentZones(parsed, instrumentID);
            for (const zone of instrumentZones.zones) {
                const sampleID = zone.sampleID;
                // Bounds check for sampleID before accessing sampleHeaders and samples
                if (sampleID < 0 || sampleID >= parsed.sampleHeaders.length || sampleID >= parsed.samples.length) {
                    console.warn(`Skipping zone with invalid sampleID ${sampleID} (valid range: 0-${Math.min(parsed.sampleHeaders.length, parsed.samples.length) - 1})`);
                    continue;
                }
                const sampleHeader = parsed.sampleHeaders[sampleID];
                const { velRange: defaultVelRange, ...generatorDefault } = defaultInstrumentZone;
                const gen = {
                    ...generatorDefault,
                    ...removeUndefined(instrumentZones.globalZone ?? {}),
                    ...removeUndefined(zone),
                };
                // inherit preset's velRange
                gen.velRange = gen.velRange ?? presetGen.velRange ?? defaultVelRange;
                // add presetGenerator value
                for (const key of Object.keys(gen)) {
                    if (key in presetGen &&
                        typeof gen[key] === "number" &&
                        typeof presetGen[key] === "number") {
                        gen[key] += presetGen[key];
                    }
                }
                const tune = gen.coarseTune + gen.fineTune / 100;
                const basePitch = tune +
                    sampleHeader.pitchCorrection / 100 -
                    (gen.overridingRootKey ?? sampleHeader.originalPitch);
                const sampleStart = gen.startAddrsCoarseOffset * 32768 + gen.startAddrsOffset;
                const sampleEnd = gen.endAddrsCoarseOffset * 32768 + gen.endAddrsOffset;
                const loopStart = sampleHeader.loopStart +
                    gen.startloopAddrsCoarseOffset * 32768 +
                    gen.startloopAddrsOffset;
                const loopEnd = sampleHeader.loopEnd +
                    gen.endloopAddrsCoarseOffset * 32768 +
                    gen.endloopAddrsOffset;
                const audioData = addSampleIfNeeded(sampleID);
                const amplitudeEnvelope = {
                    attackTime: timeCentToSec(gen.attackVolEnv),
                    holdTime: timeCentToSec(gen.holdVolEnv),
                    decayTime: timeCentToSec(gen.decayVolEnv),
                    sustainLevel: 1 / centibelToLinear(gen.sustainVolEnv),
                    releaseTime: timeCentToSec(gen.releaseVolEnv),
                };
                const loop = (() => {
                    switch (gen.sampleModes) {
                        case 0:
                            // no_loop
                            break;
                        case 1:
                            if (loopEnd > 0) {
                                return {
                                    type: "loop_continuous",
                                    start: loopStart,
                                    end: loopEnd,
                                };
                            }
                        case 3:
                            if (loopEnd > 0) {
                                return {
                                    type: "loop_sustain",
                                    start: loopStart,
                                    end: loopEnd,
                                };
                            }
                            break;
                    }
                    // fallback as no_loop
                    return { type: "no_loop" };
                })();
                const parameter = {
                    sampleID: sampleID,
                    pitch: -basePitch,
                    name: sampleHeader.sampleName,
                    sampleStart,
                    sampleEnd: sampleEnd === 0 ? audioData.length : sampleEnd,
                    loop,
                    sampleRate: sampleHeader.sampleRate,
                    amplitudeEnvelope,
                    scaleTuning: gen.scaleTuning / 100,
                    pan: (gen.pan ?? 0) / 500,
                    exclusiveClass: gen.exclusiveClass,
                    volume: centibelToLinear(-gen.initialAttenuation),
                };
                const range = {
                    instrument: presetHeader.preset,
                    bank: presetHeader.bank,
                    keyRange: [gen.keyRange.lo, gen.keyRange.hi],
                    velRange: [gen.velRange.lo, gen.velRange.hi],
                };
                result.push({ parameter, range });
            }
        }
    }
    return {
        parameters: result,
        samples: convertedSampleBuffers,
    };
};
const getSampleEventsFromSoundFont = (data) => {
    const { samples, parameters } = parseSamplesFromSoundFont(data);
    const loadSampleEvents = Object.entries(samples).map(([key, value]) => ({
        type: "loadSample",
        sampleID: Number(key),
        data: value.buffer,
    }));
    const sampleParameterEvents = parameters.map(({ parameter, range }) => ({ type: "sampleParameter", parameter, range }));
    return [
        ...loadSampleEvents.map((event) => ({ event, transfer: [event.data] })),
        ...sampleParameterEvents.map((event) => ({ event })),
    ];
};
function convertTime(value) {
    return Math.pow(2, value / 1200);
}
function timeCentToSec(value) {
    if (value <= -32768) {
        return 0;
    }
    if (value < -12000) {
        value = -12000;
    }
    if (value > 8000) {
        value = 8000;
    }
    return convertTime(value);
}
function centibelToLinear(value) {
    return Math.pow(10, value / 200);
}
function removeUndefined(obj) {
    const result = {};
    for (let key in obj) {
        if (obj[key] !== undefined) {
            result[key] = obj[key];
        }
    }
    return result;
}

const DrumInstrumentNumber = 128;

export { DrumInstrumentNumber, audioDataToAudioBuffer, getSampleEventsFromSoundFont, renderAudio };
//# sourceMappingURL=index.js.map
