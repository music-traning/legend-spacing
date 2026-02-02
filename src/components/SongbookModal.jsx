import React, { useState } from 'react';
import { JAZZ_STANDARDS } from '../data/jazzTracks';

const SongbookModal = ({ onClose, onSelect }) => {
    const [search, setSearch] = useState("");

    // Flatten Songs
    const allSongs = Object.keys(JAZZ_STANDARDS).map(k => ({ key: k, ...JAZZ_STANDARDS[k] }));

    const filteredSongs = allSongs.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="manual-overlay" onClick={onClose}>
            <div className="manual-content" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 className="manual-section-title">SONG BOOK</h2>
                    <input
                        type="text"
                        placeholder="Search songs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '15px', fontSize: '1.2rem',
                            background: '#222', border: '1px solid var(--primary-color)', color: '#fff', borderRadius: '8px'
                        }}
                        autoFocus
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredSongs.length === 0 && <p style={{ color: '#888', padding: '20px' }}>No songs found.</p>}
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {filteredSongs.map(s => (
                            <li key={s.key} onClick={() => onSelect(s.key)}
                                style={{
                                    padding: '15px', borderBottom: '1px solid #333', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#222'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{s.title}</span>
                                <span style={{
                                    fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px',
                                    background: s.level === 'Beginner' ? '#2ecc71' : s.level === 'Intermediate' ? '#f1c40f' : '#e74c3c',
                                    color: '#000', fontWeight: 'bold'
                                }}>{s.level}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <button onClick={onClose} className="manual-close-btn" style={{ marginTop: '20px' }}>CLOSE</button>
            </div>
        </div>
    );
};

export default SongbookModal;
