import React from 'react';

const TabDisplay = ({ frets, chordName, measureNum }) => {
    const strings = [1, 2, 3, 4, 5, 6];
    return (
        <div className="tab-display glass-panel">
            <div className="tab-header">
                <span>MEASURE: <span className="highlight-text">{measureNum}</span></span>
                <span>CHORD: <span className="highlight-text big">{chordName}</span></span>
            </div>
            <div className="fretboard">
                {strings.map((sNum) => (
                    <div key={sNum} className="string-line">
                        <span className="string-num">{sNum}</span>
                        <div className="string-wire"></div>
                        {frets && frets[6 - sNum] !== null && (
                            <div
                                className="fret-marker"
                                style={{ left: `${(frets[6 - sNum] / 20) * 85 + 20}px` }}
                            >
                                {frets[6 - sNum]}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TabDisplay;
