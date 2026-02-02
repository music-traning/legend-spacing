
// --- UTILITIES & CONSTANTS ---

const NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const ENHARMONICS = {
    "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb",
    "Cb": "B", "E#": "F", "B#": "C", "Fb": "E"
};

const normalizeRoot = (root) => {
    return ENHARMONICS[root] || root;
};

// Standard Tuning Offsets
const ROOT_FRET_6 = { "E": 0, "F": 1, "Gb": 2, "G": 3, "Ab": 4, "A": 5, "Bb": 6, "B": 7, "C": 8, "Db": 9, "D": 10, "Eb": 11 };
const ROOT_FRET_5 = { "A": 0, "Bb": 1, "B": 2, "C": 3, "Db": 4, "D": 5, "Eb": 6, "E": 7, "F": 8, "Gb": 9, "G": 10, "Ab": 11 };
const ROOT_FRET_4 = { "D": 0, "Eb": 1, "E": 2, "F": 3, "Gb": 4, "G": 5, "Ab": 6, "A": 7, "Bb": 8, "B": 9, "C": 10, "Db": 11 };

const getRootFret = (root, string) => {
    const norm = normalizeRoot(root);
    if (string === 6) return ROOT_FRET_6[norm];
    if (string === 5) return ROOT_FRET_5[norm];
    if (string === 4) return ROOT_FRET_4[norm];
    return null;
};

// --- VOICING LIBRARY (The Researcher's Collection) ---

// 1. SHELL (Freddie Green Style - 3 Notes)
const SHELL_6 = {
    maj7: [0, null, 1, 1, null, null],
    7: [0, null, 0, 1, null, null],
    m7: [0, null, 0, 0, null, null],
    m7b5: [0, null, 0, 0, null, null],
    dim7: [0, null, -1, 0, null, null]
};
const SHELL_5 = {
    maj7: [null, 0, -1, 1, null, null],
    7: [null, 0, -1, 0, null, null],
    m7: [null, 0, -2, 0, null, null],
    m7b5: [null, 0, -2, 0, null, null],
    dim7: [null, 0, -2, -1, null, null]
};

// 2. DROP 2 (Standard Bop - Wes, Benson)
const DROP2_6 = {
    maj7: [0, null, 1, 1, 0, null],
    7: [0, null, 0, 1, 0, null],
    m7: [0, null, 0, 0, 0, null],
    m7b5: [0, null, 0, 0, -1, null],
    dim7: [0, null, -1, 0, -1, null],
    alt: [0, null, 0, 1, 1, null]
};
const DROP2_5 = {
    maj7: [null, 0, 2, 1, 2, null],
    7: [null, 0, 2, 0, 2, null],
    m7: [null, 0, 2, 0, 1, null],
    m7b5: [null, 0, 1, 0, 1, null],
    dim7: [null, 0, 1, -1, 1, null],
    alt: [null, 0, 1, 0, 2, null]
};
const DROP2_4 = {
    maj7: [null, null, 0, 2, 2, 2],
    7: [null, null, 0, 2, 1, 2],
    m7: [null, null, 0, 2, 1, 1],
    m7b5: [null, null, 0, 1, 1, 1],
    dim7: [null, null, 0, 1, 0, 1],
    alt: [null, null, 0, 2, 1, 2]
};

// 3. DROP 3 (Joe Pass / Low Warmth)
const DROP3_6 = {
    maj7: [0, null, 1, 1, 0, null],
    7: [0, null, 0, 1, 0, null],
    m7: [0, null, 0, 0, 0, null],
    m7b5: [0, null, 0, 0, -1, null],
    dim7: [0, null, -1, 0, -1, null],
    alt: [0, null, 0, 1, 1, null]
};
const DROP3_5 = {
    maj7: [null, 0, null, 1, 2, 0],
    7: [null, 0, null, 0, 2, 0],
    m7: [null, 0, null, 0, 1, 0],
    m7b5: [null, 0, null, 0, 1, -1],
    dim7: [null, 0, null, -1, 1, -1],
    alt: [null, 0, null, 0, 2, 0]
};

// 4. QUARTAL (So What / Modern)
const QUARTAL_MODERN = {
    m7: [0, null, 0, 0, 1, null],
    7: [0, null, 0, 1, 1, null],
    maj7: [0, null, 1, 1, 2, null],
    alt: [0, null, 2, 3, 4, null],
    m7b5: [0, null, 0, 0, -1, null],
    dim7: [0, null, -1, 0, -1, null]
};

// --- LEGEND STRATEGIES ---
const getStrategy = (legend) => {
    if (["freddie_green", "charlie_christian", "django_reinhardt"].some(l => legend.includes(l))) {
        return "SHELL";
    }
    if (["bill_evans", "jim_hall", "lenny_breau"].some(l => legend.includes(l))) {
        return "PIANO"; // Rootless & Clusters
    }
    if (["joe_pass", "barney_kessel", "kenny_burrell", "herb_ellis", "tal_farlow"].some(l => legend.includes(l))) {
        return "BOP_VIRTUOSO"; // Drop 3 & Drop 2 mixed
    }
    if (["wes_montgomery", "george_benson", "pat_metheny", "grant_green"].some(l => legend.includes(l))) {
        return "BOP_STANDARD"; // Drop 2 primarily
    }
    if (["allan_holdsworth", "bill_frisell", "john_scofield", "kurt_rosenwinkel", "julian_lage", "mike_stern", "kazumi_watanabe", "miles_davis", "chet_baker", "thelonious_monk"].some(l => legend.includes(l))) {
        return "MODERN"; // Quartal, Spacing
    }
    return "BOP_STANDARD";
};

// --- MAIN LOGIC ---
export const getLegendVoicing = (chordName, legend, targetFret = 5) => {
    // 1. Parse & Normalize
    const cleanChord = chordName.split('/')[0];
    const match = cleanChord.match(/^([A-G][b#]?)(.*)$/);
    if (!match) return [null, null, null, null, null, null];

    let rootNote = match[1];
    let typeRaw = match[2];

    // NORMALIZE ROOT (Fixes the F# bug)
    rootNote = normalizeRoot(rootNote);

    // Normalize Type
    // FIX: Check maj7 BEFORE generic 7
    let type = "maj7";
    if (typeRaw.includes("m7b5")) type = "m7b5";
    else if (typeRaw.includes("dim")) type = "dim7";
    else if (typeRaw.includes("m7")) type = "m7";
    else if (typeRaw.includes("maj7")) type = "maj7";
    else if (typeRaw.includes("alt")) type = "alt";
    else if (typeRaw.includes("7")) type = "7";
    else if (typeRaw.includes("m")) type = "m7";
    else if (typeRaw.includes("6")) type = "maj7"; // Treat 6 as maj for now
    else type = "maj7";

    const strategy = getStrategy(legend);
    let candidates = [];

    // --- GENERATE CANDIDATES BASED ON STRATEGY ---

    // A. SHELL (Rhythm)
    if (strategy === "SHELL") {
        [6, 5].forEach(str => {
            const tpl = (str === 6) ? SHELL_6 : SHELL_5;
            const rf = getRootFret(rootNote, str);
            if (rf !== null && rf !== undefined) {
                let shape = applyShape(tpl, type, rf);
                candidates.push({ frets: shape, avg: getAverageFret(shape) });
                // Approach
                if (Math.random() > 0.8) {
                    let s2 = applyShape(tpl, type, rf - 1);
                    candidates.push({ frets: s2, avg: getAverageFret(s2) });
                }
            }
        });
    }

    // B. PIANO / ROOTLESS (Sophisticated)
    else if (strategy === "PIANO") {
        // Try Rootless on 6 and 5 (Anchor)
        [6, 5].forEach(str => {
            const rf = getRootFret(rootNote, str);
            if (rf !== null && rf !== undefined) {
                // 1. Rootless Shape (Type A/B logic requires deep maps, using Drop 2 and stripping root for now implies similar effect)
                // Let's use DROP 2 but remove the Root or Bass note.
                const d2 = (str === 6) ? DROP2_6 : DROP2_5;
                let shape = applyShape(d2, type, rf);
                // Strip Root (Lowest note)
                // Actually Drop 2 on 6 string: [R, x, 7, 3, 5, x]. If we remove R(idx 0), we get [x, x, 7, 3, 5, x]. Nice shell.
                // Replace nulls carefully.
                let rootless = [...shape];
                if (str === 6) rootless[0] = null;
                if (str === 5) rootless[1] = null;

                candidates.push({ frets: rootless, avg: getAverageFret(rootless) });

                // 2. Add lush Drop 2 full
                candidates.push({ frets: shape, avg: getAverageFret(shape) });
            }
        });
    }

    // C. BOP / VIRTUOSO (Drop 3 + Drop 2)
    else if (strategy === "BOP_VIRTUOSO") {
        [6, 5].forEach(str => {
            const rf = getRootFret(rootNote, str);
            if (rf === null || rf === undefined) return;

            // Drop 3 (Low & Wide)
            const d3 = (str === 6) ? DROP3_6 : DROP3_5;
            let s3 = applyShape(d3, type, rf);
            candidates.push({ frets: s3, avg: getAverageFret(s3) });

            // Drop 2 (Punchy)
            const d2 = (str === 6) ? DROP2_6 : DROP2_5;
            let s2 = applyShape(d2, type, rf);
            candidates.push({ frets: s2, avg: getAverageFret(s2) });
        });
        // 4th string chords for top comping
        if (ROOT_FRET_4[rootNote] !== undefined) {
            let s4 = applyShape(DROP2_4, type, ROOT_FRET_4[rootNote]);
            candidates.push({ frets: s4, avg: getAverageFret(s4) });
        }
    }

    // D. MODERN (Quartal & Stretch)
    else if (strategy === "MODERN") {
        [6, 5].forEach(str => {
            const rf = getRootFret(rootNote, str);
            if (rf === null || rf === undefined) return;

            // Quartal
            if (type === "m7" || type === "7") {
                let shape = applyShape(QUARTAL_MODERN, type, rf);
                candidates.push({ frets: shape, avg: getAverageFret(shape) });

                // Side Slip
                if (Math.random() > 0.7) {
                    let shift = applyShape(QUARTAL_MODERN, type, rf + (Math.random() > 0.5 ? 1 : -1));
                    candidates.push({ frets: shift, avg: getAverageFret(shift) });
                }
            } else {
                // Fallback to Spread Triads (Drop 2)
                const d2 = (str === 6) ? DROP2_6 : DROP2_5;
                let s = applyShape(d2, type, rf);
                candidates.push({ frets: s, avg: getAverageFret(s) });
            }
        });
    }

    // E. STANDARD (Fallback)
    else {
        [6, 5].forEach(str => {
            const rf = getRootFret(rootNote, str);
            if (rf !== null && rf !== undefined) {
                const d2 = (str === 6) ? DROP2_6 : DROP2_5;
                let s = applyShape(d2, type, rf);
                candidates.push({ frets: s, avg: getAverageFret(s) });
            }
        });
    }

    // --- SELECTION & OCTAVE SHIFTING ---
    // Filter invalid
    candidates = candidates.filter(c => c.frets.some(f => f !== null && !isNaN(f)));
    if (candidates.length === 0) return [null, null, null, null, null, null];

    // Octave Shift Logic inside applyShape handles generating valid base frets,
    // but here we ensure they are in playble range [1..15] generally.
    // If we have a Target Fret, we pick the one closest.

    // Refine candidates by creating Octave Variations
    let finalCandidates = [];
    candidates.forEach(cand => {
        finalCandidates.push(cand);
        // Up Octave
        let up = cand.frets.map(f => (f === null) ? null : f + 12);
        if (getAverageFret(up) < 17) finalCandidates.push({ frets: up, avg: getAverageFret(up) });
        // Down Octave
        let down = cand.frets.map(f => (f === null) ? null : f - 12);
        if (Math.min(...down.filter(x => x !== null)) >= 0) finalCandidates.push({ frets: down, avg: getAverageFret(down) });
    });

    // Sort by distance to Target Fret (Voice Leading)
    if (targetFret !== null) {
        finalCandidates.sort((a, b) => Math.abs(a.avg - targetFret) - Math.abs(b.avg - targetFret));
    }

    // Final safety check for NaNs
    const safeResult = finalCandidates[0].frets.map(f => (isNaN(f) || f < 0) ? null : f);
    return safeResult;
};

// Helper to map template to actual frets
const applyShape = (templateObj, type, rootFret) => {
    // Fallback to maj7 if type not found (should be rare with normalization)
    const offsets = templateObj[type] || templateObj["maj7"] || templateObj["7"];
    if (!offsets) return [null, null, null, null, null, null];

    return offsets.map(o => (o === null) ? null : rootFret + o);
};

const getAverageFret = (frets) => {
    const active = frets.filter(f => f !== null && !isNaN(f));
    if (active.length === 0) return 0;
    return active.reduce((a, b) => a + b, 0) / active.length;
};
