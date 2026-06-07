// Handles saving and restoring the realignment setting
const checkbox = document.getElementById('enableRealignment');

// Use browser.storage if available (preferred in modern browsers), otherwise fall back to chrome.storage.
// This ensures compatibility across Chrome, Firefox, and other browsers supporting the WebExtension API.
const storage = typeof browser !== 'undefined' && browser.storage ? browser.storage : chrome.storage;

// Load setting on page load
window.addEventListener('DOMContentLoaded', () => {
    // Get the setting from storage (default: true)
    storage.sync.get({ enableRealignment: true }, (items) => {
        // Set checkbox state based on stored value
        checkbox.checked = items.enableRealignment;
    });
});

// Close the popup automatically after the mouse has been outside for 3 seconds.
// window.close() works in extension popups but not in regular browser tabs.
let closeTimeout;
document.addEventListener('mouseleave', () => {
    closeTimeout = setTimeout(() => window.close(), 3000);
});
document.addEventListener('mouseenter', () => {
    clearTimeout(closeTimeout);
});

// Save setting when changed
// Declared outside the listener so rapid toggles reset the same timer rather than stacking multiple hide callbacks.
let statusTimeout;
checkbox.addEventListener('change', () => {
    // Store the new value in browser/chrome storage
    storage.sync.set({ enableRealignment: checkbox.checked }, () => {
        const status = document.getElementById('status');
        // Clear any pending hide so the 3-second window always starts fresh from the latest change.
        clearTimeout(statusTimeout);
        status.style.display = 'block';
        statusTimeout = setTimeout(() => { status.style.display = 'none'; }, 3000);
    });
});
