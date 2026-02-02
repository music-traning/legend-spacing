
export const NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export const BASS_FREQS = {
    "C": 65.41, "Db": 69.30, "D": 73.42, "Eb": 77.78, "E": 82.41, "F": 87.31,
    "Gb": 92.50, "G": 98.00, "Ab": 103.83, "A": 110.00, "Bb": 116.54, "B": 123.47
};

export const transposeChordName = (chord, semi) => {
    if (semi === 0 || !chord) return chord;
    const match = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!match) return chord;
    const root = match[1]; const type = match[2];
    let idx = NOTES.indexOf(root);
    if (idx === -1) { const altMap = { "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb" }; if (altMap[root]) idx = NOTES.indexOf(altMap[root]); }
    if (idx === -1) return chord;
    let newIdx = (idx + semi) % 12; if (newIdx < 0) newIdx += 12;
    return NOTES[newIdx] + type;
};

export const getAverageFret = (frets) => {
    const active = frets.filter(f => f !== null && !isNaN(f));
    if (active.length === 0) return 5;
    return active.reduce((a, b) => a + b, 0) / active.length;
};

// Simple helper to get note index
export const getNoteIndex = (noteName) => {
    let n = noteName;
    const altMap = { "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb" };
    if (altMap[n]) n = altMap[n];
    return NOTES.indexOf(n);
};
