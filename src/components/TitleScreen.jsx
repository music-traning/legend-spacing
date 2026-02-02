import React from 'react';

const TitleScreen = ({ onStart }) => {
    return (
        <div style={{
            height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-gradient)', textAlign: 'center', position: 'relative', zIndex: 10
        }}>
            <h1 style={{
                fontSize: '5rem', margin: '0', background: 'linear-gradient(to right, #00f2ea, #ff0050)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900'
            }}>LEGEND SPACING</h1>
            <p style={{ fontFamily: 'Space Mono', fontSize: '1.2rem', letterSpacing: '5px', color: '#fff', opacity: 0.8 }}>
                THE ULTIMATE JAZZ VOICING STUDIO
            </p>

            <button onClick={onStart} style={{
                marginTop: '50px', padding: '15px 50px', fontSize: '1.5rem', background: 'transparent',
                border: '2px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '50px',
                cursor: 'pointer', transition: 'all 0.3s', fontWeight: 'bold'
            }}
                onMouseEnter={e => { e.target.style.background = 'var(--primary-color)'; e.target.style.color = '#000' }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--primary-color)' }}
            >
                ENTER STUDIO
            </button>

            <footer style={{ position: 'absolute', bottom: '20px', fontSize: '0.8rem', color: '#888', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span>©2026 buro</span>
                <a href="https://note.com/jazzy_begin" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary-color)', textDecoration: 'none' }}>
                    note.com/jazzy_begin
                </a>
            </footer>
        </div>
    )
};

export default TitleScreen;
