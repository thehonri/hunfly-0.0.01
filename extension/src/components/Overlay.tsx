// Hunfly Overlay Component - "The Pill"
import React, { useState } from 'react';

export const Overlay: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [talkRatio, setTalkRatio] = useState(35);

    const handleClick = () => {
        setIsExpanded(!isExpanded);
        // Notify background script
        chrome.runtime.sendMessage({ type: isExpanded ? 'STOP_CAPTURE' : 'START_CAPTURE' });
    };

    return (
        <div
            className="hunfly-pill"
            onClick={handleClick}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <div className="hunfly-status" />
            <span>🎯 Hunfly</span>
            {isExpanded && (
                <span style={{ opacity: 0.7 }}>
                    | Você: {talkRatio}%
                </span>
            )}
        </div>
    );
};
