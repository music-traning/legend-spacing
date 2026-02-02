import { useState, useEffect, useRef, useCallback } from 'react';
import { getLegendVoicing } from '../utils/voicingLogic';
import { getWalkingBassLine } from '../utils/bassLogic';
import { transposeChordName } from '../utils/musicUtils';

const LOOKAHEAD = 25.0; // ms
const SCHEDULE_AHEAD_TIME = 0.2; // secons

export const useAudioEngine = ({ song, bpm, style, transpose, mixer, loopStart, loopEnd, isLooping }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [currentChordData, setCurrentChordData] = useState({
        chord: "C", frets: [null, null, null, null, null, null]
    });

    const audioCtxRef = useRef(null);
    const timerIDRef = useRef(null);
    const nextNoteTimeRef = useRef(0.0);
    const currentNoteIndexRef = useRef(0);
    const lastAvgFretRef = useRef(5);

    // Keep latest settings accessible to the scheduler without closures
    const settingsRef = useRef({ song, bpm, style, transpose, mixer, loopStart, loopEnd, isLooping });

    useEffect(() => {
        settingsRef.current = { song, bpm, style, transpose, mixer, loopStart, loopEnd, isLooping };
    }, [song, bpm, style, transpose, mixer, loopStart, loopEnd, isLooping]);

    // Initialize AudioContext
    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    // SCHEDULER
    const nextNote = () => {
        const { song, bpm, loopEnd, loopStart, isLooping } = settingsRef.current;
        const secondsPerBeat = 60.0 / bpm;

        // 1. Advance Index
        // NOTE: We do not update React state here. We schedule the event.
        // Logic to calculate Next Index
        // ... (However, the "currentNoteIndexRef" tracks what is *Being Scheduled*, not what is hearing)

        const nextItem = song.progression[currentNoteIndexRef.current];
        if (!nextItem) return; // Should not happen

        nextNoteTimeRef.current += nextItem.b * secondsPerBeat;

        // Advance logic
        currentNoteIndexRef.current++;
        if (isLooping) {
            if (currentNoteIndexRef.current > loopEnd) {
                currentNoteIndexRef.current = loopStart;
            }
        } else {
            if (currentNoteIndexRef.current >= song.progression.length) {
                currentNoteIndexRef.current = 0;
            }
        }
    };

    const scheduleNote = (beatNumber, time) => {
        const { song, style, transpose, mixer, loopStart, loopEnd, isLooping } = settingsRef.current;

        // The index we are scheduling NOW
        const idx = currentNoteIndexRef.current;
        const item = song.progression[idx];
        const chordName = transposeChordName(item.c, transpose);

        // PREPARE NEXT CHORD Info (For Bass Approach)
        let nextIdx = idx + 1;
        if (isLooping && nextIdx > loopEnd) nextIdx = loopStart;
        else if (nextIdx >= song.progression.length) nextIdx = 0;
        const nextItem = song.progression[nextIdx];
        const nextChordName = transposeChordName(nextItem?.c || "C", transpose);

        // UI SYNC (Schedule React State Update)
        // We calculate the delay from "Now" to "Scheduled Time"
        const ctx = audioCtxRef.current;
        // If time is close to now, do it. 
        // We use requestAnimationFrame or setTimeout to flip the UI at the right moment.
        // Actually, for React, just settimeout is easiest.
        const drawTime = (time - ctx.currentTime) * 1000;
        setTimeout(() => {
            // Recalculate frets for display (clean syncing)
            // But we actually need the frets logic for AUDIO too.
            // Let's do it once? 
            // We'll trust the logic is deterministic.

            // Wait, we need 'lastAvgFret' for voice leading. 
            // In a lookahead, 'lastAvgFret' needs to be updated sequentially in the scheduler loop, 
            // NOT the UI loop, to maintain consistency.
            // So we handle logic HERE in scheduleNote.

            // BUT, modifying ref here is tricky if UI also reads it. 

            setCurrentIdx(idx);
            // We will let the "useEffect" in App.jsx or here handle the voicing calculation for Display?
            // No, better to pass the calculated frets out.
            // But "getLegendVoicing" is pure.
        }, Math.max(0, drawTime));


        // --- AUDIO GENERATION ---

        // 1. GUITAR
        if (mixer.guitar) {
            // Voice Leading State (updated in scheduler sequence)
            const frets = getLegendVoicing(chordName, style, lastAvgFretRef.current);
            // Update the Ref for NEXT scheduling step
            const avg = frets.filter(f => f !== null).reduce((a, b) => a + b, 0) / (frets.filter(f => f !== null).length || 1);
            if (avg > 0) lastAvgFretRef.current = avg;

            // Trigger Display Update with these EXACT frets
            setTimeout(() => {
                setCurrentChordData({ chord: chordName, frets });
            }, Math.max(0, drawTime));

            playGuitarStrum(ctx, time, frets, style, item.b, bpm);
        }

        // 2. BASS
        if (mixer.bass) {
            const bassLine = getWalkingBassLine(chordName, nextChordName, item.b);
            playBassLine(ctx, time, bassLine, item.b, bpm);
        }

        // 3. CLICK
        if (mixer.click) {
            playClick(ctx, time, item.b, bpm, mixer.clickOffBeat);
        }
    };

    const scheduler = () => {
        // While there are notes that will play within the scheduleAheadTime...
        while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + SCHEDULE_AHEAD_TIME) {
            scheduleNote(currentNoteIndexRef.current, nextNoteTimeRef.current);
            nextNote();
        }
        timerIDRef.current = window.setTimeout(scheduler, LOOKAHEAD);
    };

    // --- CONTOLS ---
    const togglePlay = useCallback(() => {
        initAudio();
        if (isPlaying) {
            setIsPlaying(false);
            if (timerIDRef.current) clearTimeout(timerIDRef.current);
            return;
        }

        setIsPlaying(true);
        currentNoteIndexRef.current = currentIdx; // Resume from UI slider pos
        nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1; // Start slightly ahead
        scheduler();
    }, [isPlaying, currentIdx]);

    const seek = (idx) => {
        setCurrentIdx(idx);
        currentNoteIndexRef.current = idx;

        // Update display manually immediately so it feels responsive
        const { song, style, transpose } = settingsRef.current;
        const item = song.progression[idx];
        const cName = transposeChordName(item.c, transpose);
        const frets = getLegendVoicing(cName, style, lastAvgFretRef.current);
        setCurrentChordData({ chord: cName, frets });

        // If playing, the scheduler will pick up from currentNoteIndexRef automatically
        // But nextNoteTime needs to be reset to "Now" to avoid playing catchup?
        if (isPlaying) {
            nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1;
        }
    };

    // CLEANUP
    useEffect(() => {
        return () => {
            if (timerIDRef.current) clearTimeout(timerIDRef.current);
            if (audioCtxRef.current) audioCtxRef.current.close();
        }
    }, []);

    return {
        isPlaying,
        togglePlay,
        currentIdx,
        seek,
        currentChordData
    };
};

// --- AUDIO HELPERS ---

const playGuitarStrum = (ctx, time, frets, style, beats, bpm) => {
    const baseFreqs = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
    const strumDelay = 0.025; // slightly faster strum
    const beatLen = 60 / bpm;
    const duration = beatLen * beats;

    frets.forEach((f, i) => {
        if (f !== null && f >= 0) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();

            // Tone Shaping
            if (style.includes("wes") || style.includes("pat") || style.includes("metheny")) {
                osc.type = 'sine'; // Darker
            } else if (style.includes("jim_hall") || style.includes("evans")) {
                osc.type = 'triangle'; // Warm
            } else {
                osc.type = 'triangle'; // standard jazz
            }

            const freq = baseFreqs[i] * Math.pow(2, f / 12);
            osc.frequency.value = freq;

            const t = time + (i * strumDelay);

            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.15, t + 0.02); // Attack
            g.gain.exponentialRampToValueAtTime(0.001, t + (duration * 0.95)); // Decay almost to silence
            g.gain.linearRampToValueAtTime(0, t + duration); // Ensure absolute 0 to prevent click

            osc.connect(g).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + duration + 0.1); // Stop with safety margin
        }
    });
};

const playBassLine = (ctx, time, bassLine, beats, bpm) => {
    const beatLen = 60 / bpm;
    bassLine.forEach((noteObj, i) => {
        if (!noteObj) return;
        const t = time + (i * beatLen);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = noteObj.freq;

        // Low Pass Filter for Bass Warmth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);

        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.4, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + (beatLen * 0.9));

        osc.connect(filter).connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + beatLen);
    });
};

const playClick = (ctx, time, beats, bpm, clickOffBeat) => {
    const beatLen = 60 / bpm;
    for (let i = 0; i < beats; i++) {
        let play = true;
        let isStrong = (i === 0);

        if (clickOffBeat) {
            // 2 & 4 means beats 1 (index 0) is silent? No, beat 2 (index 1) and 4 (index 3).
            // Indices: 0, 1, 2, 3.
            // 2 & 4 are indices 1 and 3.
            if (i % 2 === 0) play = false;
            isStrong = true; // Make the offbeats strong clicks
        }

        if (play) {
            const t = time + (i * beatLen);
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.value = isStrong ? 1000 : 800;
            osc.type = 'square';
            g.gain.setValueAtTime(0.05, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            osc.connect(g).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        }
    }
};
