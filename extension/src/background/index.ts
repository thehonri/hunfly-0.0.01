// Hunfly Background Service Worker
// Manages WebSocket connection and audio routing

console.log('[Hunfly] Background Service Worker initialized');

// Keep-alive mechanism for Manifest V3
chrome.runtime.onInstalled.addListener(() => {
    console.log('[Hunfly] Extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Hunfly] Message received:', message);

    if (message.type === 'START_CAPTURE') {
        console.log('[Hunfly] Starting audio capture for tab:', sender.tab?.id);
        // TODO: Initialize tabCapture and WebSocket
        sendResponse({ status: 'ok' });
    }

    if (message.type === 'STOP_CAPTURE') {
        console.log('[Hunfly] Stopping audio capture');
        sendResponse({ status: 'ok' });
    }

    return true; // Keep message channel open for async response
});
