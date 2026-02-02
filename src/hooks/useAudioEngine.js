import { useState, useEffect, useRef, useCallback } from 'react';
import { getLegendVoicing } from '../utils/voicingLogic';
import { getWalkingBassLine } from '../utils/bassLogic';
import { transposeChordName } from '../utils/musicUtils';

const LOOKAHEAD = 25.0; // ms
const SCHEDULE_AHEAD_TIME = 0.2; // seconds

export const useAudioEngine = ({ song, bpm, style, transpose, mixer, loopStart, loopEnd, isLooping }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [currentChordData, setCurrentChordData] = useState({
        chord: "C", frets: [null, null, null, null, null, null]
    });

    const audioCtxRef = useRef(null);
    const timerIDRef = useRef(null);
    const rafIDRef = useRef(null);

    // Audio Scheduling State (The "Audio Thread" Truth)
    const nextNoteTimeRef = useRef(0.0);
    const currentNoteIndexRef = useRef(0);
    const lastAvgFretRef = useRef(5);

    // Visual Sync Queue
    // Stores events: { time: number, index: number, chordData: { chord, frets } }
    const visualQueueRef = useRef([]);

    // Keep latest settings accessible to the scheduler without closures
    const settingsRef = useRef({ song, bpm, style, transpose, mixer, loopStart, loopEnd, isLooping });

    useEffect(() => {
        settingsRef.current = { song, bpm, style, transpose, mixer, loopStart, loopEnd, isLooping };
    }, [song, bpm, style, transpose, mixer, loopStart, loopEnd, isLooping]);

    // Initialize AudioContext safely
    const initAudio = () => {
        try {
            if (!audioCtxRef.current) {
                const CtxClass = window.AudioContext || window.webkitAudioContext;
                if (!CtxClass) throw new Error("AudioContext not supported");
                audioCtxRef.current = new CtxClass();
            }
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
        } catch (e) {
            console.error("Failed to initialize AudioContext:", e);
        }
    };

    // --- ANIMATION FRAME LOOP (UI SYNC) ---
    const uiLoop = useCallback(() => {
        if (!audioCtxRef.current) return;
        const currentTime = audioCtxRef.current.currentTime;
        const queue = visualQueueRef.current;

        // Process all events that are due (or overdue)
        // We peek at the head of the queue
        while (queue.length > 0 && queue[0].time <= currentTime + 0.05) { // Small buffer for smoothness
            const event = queue.shift();

            // Only update if it's a new index or data to avoid React render thrashing
            // But we trust the queue is sparse (once per chord)
            setCurrentIdx(event.index);
            setCurrentChordData(event.chordData);
        }

        rafIDRef.current = requestAnimationFrame(uiLoop);
    }, []);

    // Start/Stop UI Loop based on playing state
    useEffect(() => {
        if (isPlaying) {
            rafIDRef.current = requestAnimationFrame(uiLoop);
        } else {
            if (rafIDRef.current) cancelAnimationFrame(rafIDRef.current);
        }
        return () => {
            if (rafIDRef.current) cancelAnimationFrame(rafIDRef.current);
        };
    }, [isPlaying, uiLoop]);


    // --- SCHEDULER ---
    const nextNote = () => {
        const { song, bpm, loopEnd, loopStart, isLooping } = settingsRef.current;
        const secondsPerBeat = 60.0 / bpm;

        const nextItem = song.progression[currentNoteIndexRef.current];
        if (!nextItem) return;

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
        const { song, style, transpose, mixer, loopStart, loopEnd, isLooping, bpm } = settingsRef.current;

        // The index we are scheduling NOW
        const idx = currentNoteIndexRef.current;
        const item = song.progression[idx];
        if (!item) return;

        const chordName = transposeChordName(item.c, transpose);

        // PREPARE NEXT CHORD Info (For Bass Approach)
        let nextIdx = idx + 1;
        if (isLooping && nextIdx > loopEnd) nextIdx = loopStart;
        else if (nextIdx >= song.progression.length) nextIdx = 0;
        const nextItem = song.progression[nextIdx];
        const nextChordName = transposeChordName(nextItem?.c || "C", transpose);

        const ctx = audioCtxRef.current;

        // --- 1. CALCULATE DATA & AUDIO ---
        let finalFrets = [null, null, null, null, null, null];

        // Guitar Audio & Voice Leading
        if (mixer.guitar) {
            finalFrets = getLegendVoicing(chordName, style, lastAvgFretRef.current);
            // Update the Ref for NEXT scheduling step (Voice Leading)
            const active = finalFrets.filter(f => f !== null);
            if (active.length > 0) {
                const avg = active.reduce((a, b) => a + b, 0) / active.length;
                lastAvgFretRef.current = avg;
            }
            playGuitarStrum(ctx, time, finalFrets, style, item.b, bpm);
        } else {
            // Even if guitar is mute, we might want to calculate visual frets?
            // Yes, user wants to see what chords are playing.
            // But if we don't play sound, 'lastAvgFretRef' update is still good for consistency if they unmute.
            finalFrets = getLegendVoicing(chordName, style, lastAvgFretRef.current);
            const active = finalFrets.filter(f => f !== null);
            if (active.length > 0) {
                const avg = active.reduce((a, b) => a + b, 0) / active.length;
                lastAvgFretRef.current = avg;
            }
        }

        // Bass Audio
        if (mixer.bass) {
            const bassLine = getWalkingBassLine(chordName, nextChordName, item.b);
            playBassLine(ctx, time, bassLine, item.b, bpm);
        }

        // Click Audio
        if (mixer.click) {
            playClick(ctx, time, item.b, bpm, mixer.clickOffBeat);
        }

        // --- 2. ENQUEUE VISUALS ---
        // We push this event to the queue so the UI updates exactly when 'time' arrives
        visualQueueRef.current.push({
            time: time,
            index: idx,
            chordData: { chord: chordName, frets: finalFrets }
        });
    };

    const scheduler = () => {
        if (!audioCtxRef.current) return;
        // While there are notes that will play within the scheduleAheadTime...
        // Safety break to prevent infinite loops if something goes wrong
        let iterations = 0;
        while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + SCHEDULE_AHEAD_TIME && iterations < 100) {
            scheduleNote(currentNoteIndexRef.current, nextNoteTimeRef.current);
            nextNote();
            iterations++;
        }
        timerIDRef.current = window.setTimeout(scheduler, LOOKAHEAD);
    };

    // --- CONTROLS ---
    const togglePlay = useCallback(() => {
        initAudio();
        if (isPlaying) {
            // PAUSE
            setIsPlaying(false);
            if (timerIDRef.current) clearTimeout(timerIDRef.current);
            return;
        }

        // PLAY
        setIsPlaying(true);
        // Resume from current visual index
        currentNoteIndexRef.current = currentIdx;

        // Reset timing to now
        if (audioCtxRef.current) {
            nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1;
        }

        // Clear old visuals from queue (stale)
        visualQueueRef.current = [];

        scheduler();
    }, [isPlaying, currentIdx]);

    const seek = (idx) => {
        const { song, style, transpose } = settingsRef.current;
        if (!song.progression[idx]) return;

        // 1. Update State immediately for responsiveness
        setCurrentIdx(idx);

        // 2. Calculate Visuals for the seek point (immediate feedback)
        // Reset Voice Leading to center of board for a fresh seek
        lastAvgFretRef.current = 5;

        const item = song.progression[idx];
        const cName = transposeChordName(item.c, transpose);
        const frets = getLegendVoicing(cName, style, lastAvgFretRef.current);
        setCurrentChordData({ chord: cName, frets });

        // 3. Update Audio Thread State
        currentNoteIndexRef.current = idx;
        visualQueueRef.current = []; // Clear pending

        if (isPlaying && audioCtxRef.current) {
            // Retarget scheduler
            nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1;
            // The scheduler loop is running (via setTimeout), it will pick up the new index/time on next tick
        }
    };

    // CLEANUP
    useEffect(() => {
        return () => {
            if (timerIDRef.current) clearTimeout(timerIDRef.current);
            if (rafIDRef.current) cancelAnimationFrame(rafIDRef.current);
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
    const strumDelay = 0.025;
    const beatLen = 60 / bpm;
    // slightly shorter duration to allow clean cut? or standard.
    const duration = beatLen * beats;

    frets.forEach((f, i) => {
        if (f !== null && f >= 0) {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();

            // Tone Shaping
            if (style.includes("wes") || style.includes("pat") || style.includes("metheny")) {
                osc.type = 'sine';
            } else if (style.includes("jim_hall") || style.includes("evans")) {
                osc.type = 'triangle';
            } else {
                osc.type = 'triangle';
            }

            const freq = baseFreqs[i] * Math.pow(2, f / 12);
            osc.frequency.value = freq;

            const t = time + (i * strumDelay);

            // Envelope
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.15, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t + (duration * 0.95));
            g.gain.linearRampToValueAtTime(0, t + duration);

            osc.connect(g).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + duration + 0.1);

            // Explicit cleanup for garbage collection
            osc.onended = () => {
                try {
                    osc.disconnect();
                    g.disconnect();
                } catch (e) {
                    // Ignore already disconnected errors
                }
            };
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

        osc.onended = () => {
            try {
                osc.disconnect();
                filter.disconnect();
                g.disconnect();
            } catch (e) { }
        };
    });
};

const playClick = (ctx, time, beats, bpm, clickOffBeat) => {
    const beatLen = 60 / bpm;
    for (let i = 0; i < beats; i++) {
        let play = true;
        let isStrong = (i === 0);

        if (clickOffBeat) {
            if (i % 2 === 0) play = false;
            isStrong = true;
        }

        if (play) {
            const t = time + (i * beatLen);
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.value = isStrong ? 1000 : 800;
            osc.type = 'square';
            g.gain.setValueAtTime(0.05, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); // Short click
            osc.connect(g).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.1);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    g.disconnect();
                } catch (e) { }
            };
        }
    }
};
