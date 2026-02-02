
import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { JAZZ_STANDARDS } from './data/jazzTracks';
import './style.css';
import TitleScreen from './components/TitleScreen';
import ManualModal from './components/ManualModal';
import SongbookModal from './components/SongbookModal';
import TabDisplay from './components/TabDisplay';
import { useAudioEngine } from './hooks/useAudioEngine';

// --- MAIN APP ---
const App = () => {
  const [view, setView] = useState('title');
  const [showManual, setShowManual] = useState(false);
  const [showSongbook, setShowSongbook] = useState(false);

  const [songKey, setSongKey] = useState("autumn_leaves");
  const [style, setStyle] = useState("jim_hall");
  const [transpose, setTranspose] = useState(0);
  const [bpm, setBpm] = useState(120);

  // Audio Engine State handled by Custom Hook
  const [isLooping, setIsLooping] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [mixer, setMixer] = useState({ guitar: true, bass: true, click: true, clickOffBeat: true });

  const song = JAZZ_STANDARDS[songKey];

  // Initialize loop end when song changes
  useEffect(() => {
    if (song) {
      setLoopStart(0);
      setLoopEnd(song.progression.length - 1);
      setBpm(song.defaultBpm);
    }
  }, [songKey]);

  // Hook
  const {
    isPlaying,
    togglePlay,
    currentIdx,
    seek,
    currentChordData
  } = useAudioEngine({
    song,
    bpm,
    style,
    transpose,
    mixer,
    loopStart,
    loopEnd,
    isLooping
  });

  // Calculate Measure Number for Display
  const calculateMeasure = (index) => {
    let beats = 0;
    for (let i = 0; i < index; i++) beats += song.progression[i].b;
    return Math.floor(beats / 4) + 1;
  };

  // Set Loop Logic
  const setLoopPoint = (type) => {
    if (type === 'start') {
      const newStart = currentIdx;
      setLoopStart(newStart);
      if (newStart > loopEnd) setLoopEnd(song.progression.length - 1);
    } else {
      const newEnd = currentIdx;
      setLoopEnd(newEnd);
      if (newEnd < loopStart) setLoopStart(0);
    }
    setIsLooping(true);
  };

  const toggleMixer = (part) => setMixer(prev => ({ ...prev, [part]: !prev[part] }));

  // LEGEND Options (re-defined locally or imported if widely used, local is fine for dropdown)
  const LEGENDS = {
    jim_hall: "Jim Hall Style", wes_montgomery: "Wes Montgomery Style", george_benson: "George Benson Style",
    toshiki_nunokawa: "Toshiki Nunokawa Style", bill_evans: "Bill Evans Style", joe_pass: "Joe Pass Style",
    kenny_burrell: "Kenny Burrell Style", grant_green: "Grant Green Style", pat_metheny: "Pat Metheny Style",
    charlie_christian: "Charlie Christian Style", django_reinhardt: "Django Reinhardt Style",
    tal_farlow: "Tal Farlow Style", herb_ellis: "Herb Ellis Style", barney_kessel: "Barney Kessel Style",
    john_scofield: "John Scofield Style", bill_frisell: "Bill Frisell Style", mike_stern: "Mike Stern Style",
    allan_holdsworth: "Allan Holdsworth Style", kurt_rosenwinkel: "Kurt Rosenwinkel Style",
    kazumi_watanabe: "Kazumi Watanabe Style", julian_lage: "Julian Lage Style", thelonious_monk: "Thelonious Monk Style",
    miles_davis: "Miles Davis Style", chet_baker: "Chet Baker Style", freddie_green: "Freddie Green Style"
  };

  // Effect to update display on song change (optional, but good for UX)
  // MOVED UP to prevent Conditional Hook Execution Error
  useEffect(() => {
    seek(0);
  }, [songKey, style]);

  if (view === 'title') {
    return (
      <>
        <TitleScreen onStart={() => setView('studio')} />
        <Analytics />
      </>
    );
  }

  return (
    <div className="app-container">
      <Analytics />
      <div className="bg-gradient"></div>

      {showManual && <ManualModal onClose={() => setShowManual(false)} />}

      {showSongbook && <SongbookModal onClose={() => setShowSongbook(false)} onSelect={(key) => { setSongKey(key); setShowSongbook(false); }} />}

      <div className="main-content">
        <header className="app-header">
          <div className="manual-btn-wrapper">
            <button onClick={() => setShowManual(true)} style={{
              background: 'var(--primary-color)', border: 'none',
              color: '#000', borderRadius: '20px', padding: '10px 20px', cursor: 'pointer',
              fontWeight: 'bold', boxShadow: '0 0 15px rgba(0,242,234,0.3)',
              display: 'flex', alignItems: 'center', gap: '5px',
              whiteSpace: 'nowrap'
            }}>
              <span style={{ fontSize: '1.2rem' }}>?</span> MANUAL
            </button>
          </div>

          <h1 onClick={() => setView('title')} style={{ cursor: 'pointer' }}>LEGEND SPACING</h1>
          <p className="subtitle">JAZZ STUDIO & LOOPER</p>
        </header>

        <div className="top-layout">
          <div className="card glass-panel control-panel">
            <h3>Session Settings</h3>
            <div className="control-grid">
              <div className="control-group">
                <label>STYLE</label>
                <select onChange={(e) => setStyle(e.target.value)} value={style}>
                  {Object.keys(LEGENDS).map(k => <option key={k} value={k}>{LEGENDS[k]}</option>)}
                </select>
              </div>
              <div className="control-group">
                <label>KEY ({transpose > 0 ? `+${transpose}` : transpose})</label>
                <input type="range" min="-5" max="6" value={transpose} onChange={(e) => setTranspose(parseInt(e.target.value))} />
              </div>
              <div className="control-group">
                <label>BPM ({bpm})</label>
                <input type="range" min="60" max="300" step="5" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} />
              </div>
            </div>

            <div className="mixer-section">
              <label>MIXER</label>
              <div className="mixer-buttons">
                <button className={mixer.guitar ? 'active' : ''} onClick={() => toggleMixer('guitar')}>Guitar</button>
                <button className={mixer.bass ? 'active' : ''} onClick={() => toggleMixer('bass')}>Bass</button>
                <button className={mixer.click ? 'active' : ''} onClick={() => toggleMixer('click')}>Click</button>
              </div>
              <div className="mixer-toggles">
                <label className="checkbox-label">
                  <input type="checkbox" checked={mixer.clickOffBeat} onChange={() => toggleMixer('clickOffBeat')} />
                  <span>2 & 4 Click</span>
                </label>
              </div>
            </div>
          </div>

          <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h3 style={{ marginBottom: '20px' }}>Current Song</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '30px', color: 'var(--primary-color)' }}>
              {song.title}
            </p>
            <button
              onClick={() => setShowSongbook(true)}
              style={{
                padding: '20px 40px', fontSize: '1.2rem', fontWeight: 'bold',
                background: 'linear-gradient(90deg, var(--secondary-color), var(--accent-color))',
                border: 'none', borderRadius: '50px', color: '#fff', cursor: 'pointer',
                boxShadow: '0 0 20px rgba(255,0,80,0.5)', width: '100%'
              }}
            >
              OPEN SONGBOOK
            </button>
            <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#aaa' }}>
              {Object.keys(JAZZ_STANDARDS).length} Songs Available
            </div>
          </div>
        </div>

        <div className="performance-area">
          <div className="chord-display-large">
            <span className="current-chord-text">{currentChordData.chord}</span>
          </div>

          <TabDisplay
            frets={currentChordData.frets}
            chordName={currentChordData.chord}
            measureNum={calculateMeasure(currentIdx)}
          />

          <div className="transport-bar glass-panel">
            <div className="transport-controls">
              <button
                className={`play-btn ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
              >
                {isPlaying ? "II PAUSE" : "▶ PLAY"}
              </button>

              <div className="loop-controls">
                <button onClick={() => setLoopPoint('start')} >Set A</button>
                <button onClick={() => setLoopPoint('end')} >Set B</button>
                <button onClick={() => setIsLooping(!isLooping)} className={isLooping ? 'loop-active' : ''}>
                  {isLooping ? "LOOP ON" : "LOOP OFF"}
                </button>
              </div>
            </div>

            <div className="seek-container">
              <input
                type="range" min="0" max={song.progression.length - 1}
                value={currentIdx}
                onChange={(e) => seek(Number(e.target.value))}
                className="seek-slider"
              />
              <div className="seek-labels">
                <span>Step {currentIdx + 1}</span>
                <span>{isLooping ? `Loop: ${loopStart + 1} - ${loopEnd + 1}` : 'No Loop'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;