
import { BASS_FREQS, getNoteIndex, NOTES } from './musicUtils';

const BASE_ROOT_FREQ = 65.41; // C2

// Helper to get frequency from Note Index (assuming C2 base)
const getFreq = (idx) => {
    // Normalization to 45Hz - 200Hz range roughly
    // C2=65Hz. 
    // Let's just use BASS_FREQS map if possible, but calculating relative is better for walking.
    // If idx is 0 (C), freq is BASS_FREQS["C"].
    // If we go below A1 (55Hz), it might be too low, but E1 (41Hz) is standard bass low E.
    // Let's rely on BASS_FREQS which is one octave. We can double/halve.
    const note = NOTES[idx % 12];
    let f = BASS_FREQS[note];
    if (!f) return 100;
    // Octave logic? Let's just return the base freq for now and let the walker adjust.
    return f;
};

export const getWalkingBassLine = (currentBaseChord, nextBaseChord, durationBeats) => {
    // 1. Analyze Chords
    const getRoot = (c) => {
        const m = c.match(/^([A-G][b#]?)/);
        return m ? m[1] : "C";
    };
    const cRoot = getRoot(currentBaseChord);
    const nRoot = getRoot(nextBaseChord);

    // Intervals
    const isMinor = currentBaseChord.includes("m") && !currentBaseChord.includes("maj");
    const thirdInterval = isMinor ? 3 : 4; // semitones
    const fifthInterval = 7;

    const startIdx = getNoteIndex(cRoot);
    const nextIdx = getNoteIndex(nRoot);

    let line = new Array(Math.floor(durationBeats)).fill(0);

    // BEAT 1: Always Root
    line[0] = { note: cRoot, freq: BASS_FREQS[cRoot] || 100 };

    // BEAT calculation (Simple Walking Strategy)
    if (durationBeats === 1) {
        // Just root
    } else if (durationBeats === 2) {
        // Root, Approach
        line[1] = getApproachNote(startIdx, nextIdx);
    } else if (durationBeats === 3) {
        // Root, 5th, Approach (Waltz?) - Assuming 4/4 usually but if 3/4
        line[1] = getIntervalNote(startIdx, fifthInterval);
        line[2] = getApproachNote(startIdx, nextIdx); // Actually should approach next chord
    } else if (durationBeats >= 4) {
        // Beat 1: Root
        // Beat 2: 3rd or 5th or Octave
        const target2 = (Math.random() > 0.5) ? fifthInterval : thirdInterval;
        line[1] = getIntervalNote(startIdx, target2);

        // Beat 3: 5th or Octave or neighbor
        line[2] = getIntervalNote(startIdx, fifthInterval);
        // Or sometimes back to Root?
        if (Math.random() > 0.7) line[2] = { note: cRoot, freq: BASS_FREQS[cRoot] };

        // Beat 4: Approach to NEXT Root
        line[3] = getApproachNote(startIdx, nextIdx); // Logic needs to look at Next Chord
    }

    // Fix Frequencies to be in good range (E1 - G2ish)
    // BASS_FREQS are roughly C2 (65Hz) to B2 (123Hz). This is good range.
    return line;
};

// Returns { note, freq }
const getIntervalNote = (baseIdx, semitones) => {
    const idx = (baseIdx + semitones) % 12;
    const note = NOTES[idx];
    return { note, freq: BASS_FREQS[note] };
};

// Returns optimal approach note to the Target Index
const getApproachNote = (currentIdx, targetIdx) => {
    // 1. Chromatic from below (target - 1)
    // 2. Chromatic from above (target + 1)
    // 3. Dominant (target + 7)

    // Choose randomly between chromatic above/below
    const diff = (Math.random() > 0.5) ? -1 : 1;
    let idx = (targetIdx + diff);
    // Adjust negative
    if (idx < 0) idx += 12;
    idx = idx % 12;

    const note = NOTES[idx];
    return { note, freq: BASS_FREQS[note] };
};
