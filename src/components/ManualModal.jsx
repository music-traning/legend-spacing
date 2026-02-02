import React, { useState } from 'react';
import { MANUAL_CONTENT } from '../data/manualContent';

const ManualModal = ({ onClose }) => {
    const [lang, setLang] = useState('ja');
    return (
        <div className="manual-overlay" onClick={onClose}>
            <div className="manual-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    <h2 className="manual-section-title" style={{ margin: 0, border: 0 }}>MANUAL</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setLang('ja')} style={{ background: lang === 'ja' ? 'var(--primary-color)' : 'transparent', color: lang === 'ja' ? '#000' : '#888', border: '1px solid var(--primary-color)', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>JPN</button>
                        <button onClick={() => setLang('en')} style={{ background: lang === 'en' ? 'var(--primary-color)' : 'transparent', color: lang === 'en' ? '#000' : '#888', border: '1px solid var(--primary-color)', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>ENG</button>
                    </div>
                </div>
                <div>
                    <h2 style={{ color: '#fff', marginBottom: '5px', fontSize: '1.2rem' }}>{MANUAL_CONTENT[lang].title}</h2>
                    <p className="manual-body" style={{ whiteSpace: 'pre-line', marginBottom: '10px' }}>{MANUAL_CONTENT[lang].intro}</p>
                    <p style={{ color: '#ff0050', fontSize: '0.8rem', border: '1px solid #ff0050', padding: '10px', borderRadius: '5px', marginBottom: '20px', whiteSpace: 'pre-line' }}>
                        {MANUAL_CONTENT[lang].disclaimer}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        {MANUAL_CONTENT[lang].sections.map((sec, i) => (
                            <div key={i} className="manual-item">
                                <h4>{sec.head}</h4>
                                <p style={{ whiteSpace: 'pre-line' }}>{sec.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={onClose} className="manual-close-btn">CLOSE</button>
            </div>
        </div>
    )
};

export default ManualModal;
