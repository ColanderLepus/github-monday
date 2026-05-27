// content.js
// GitHub Contribution Graph Realignment Tool
// Author: Temporal Correction Initiative
// Description: A browser extension to modify GitHub contribution graphs to start weeks on Monday.

function startWeekOnMonday(table) {
    // Prevent repeated modification
    if (table.dataset.weekMondayCorrected) return;

    // Get the tbody and check for 7 rows (one per day)
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.error('[Contribution Graph Realignment] Failed: No <tbody> found in contribution graph table.');
        return;
    }
    if (tbody.rows.length !== 7) {
        console.error('[Contribution Graph Realignment] Failed: Contribution graph does not have 7 rows. Found:', tbody.rows.length);
        return;
    }

    // Guard: Only move the row if the first cell of the first row is labeled 'Sun'
    const firstRow = tbody.rows[0];
    if (firstRow.cells.length === 0) {
        console.error('[Contribution Graph Realignment] Failed: First row has no cells.');
        return;
    }

    const span = firstRow.cells[0].querySelector('span[aria-hidden="true"]');
    if (!span) {
        console.error('[Contribution Graph Realignment] Failed: No label span found in first row.');
        return;
    }
    if (span.textContent.trim() !== 'Sun') {
        // Already Monday or not Sunday, skip correction (not an error)
        return;
    }
    // Check that the Sunday row has at least 2 cells before proceeding
    if (firstRow.cells.length < 2) {
        console.error('[Contribution Graph Realignment] Failed: Sunday row does not have enough cells to shift contribution data.');
        return;
    }

    try {
        // 1. Move the Sunday row (index 0) to the bottom.
        const sundayRow = tbody.rows[0];
        tbody.appendChild(sundayRow);

        // All checks on lastRow.cells are redundant; we validated cell count before moving the row.

        // 2. Shift Sunday row's contribution data
        const lastRow = tbody.rows[tbody.rows.length - 1];
        lastRow.deleteCell(1);

        // 3. Fix the visibility of the "Sun" label
        const span = lastRow.cells[0].querySelector('span[aria-hidden="true"]');
        if (span && span.hasAttribute('style')) {
            const newStyle = span.getAttribute('style').replace('Circle(0)', 'None');
            span.setAttribute('style', newStyle);
        }

        // 4. Mark as corrected
        table.dataset.weekMondayCorrected = 'true';
    } catch (err) {
        console.error('[Contribution Graph Realignment] Failed during DOM manipulation:', err);
    }
}

// --- Initialization and MutationObserver Logic ---

function observeTable() {
    // Try to correct immediately
    const table = document.querySelector('.ContributionCalendar-grid');
    if (table) {
        startWeekOnMonday(table);
    }

    // Observe for future changes
    const observer = new MutationObserver(() => {
        const table = document.querySelector('.ContributionCalendar-grid');
        if (table) {
            startWeekOnMonday(table);
        }
    });

    // Start observing the body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Disconnect observer if .js-yearly-contributions is not present after 5 seconds
    setTimeout(() => {
        if (!document.querySelector('.js-yearly-contributions')) {
            observer.disconnect();
        }
    }, 5000);
}

// Safe URL change detection
function onUrlChange(callback) {
    // Wrap history methods so SPA navigations (pushState/replaceState) also trigger the callback.
    // popstate only fires for back/forward; GitHub uses pushState for in-page link clicks.
    for (const method of ['pushState', 'replaceState']) {
        const original = history[method];
        history[method] = function (...args) {
            original.apply(this, args);
            callback();
        };
    }
    window.addEventListener('popstate', callback);
}

// Main entry point

// Use browser.storage if available (preferred in modern browsers), otherwise fall back to chrome.storage.
// This ensures compatibility across Chrome, Firefox, and other browsers supporting the WebExtension API.
const storage = typeof browser !== 'undefined' && browser.storage ? browser.storage : chrome.storage;

function main() {
    // Check if realignment is enabled before running
    storage.sync.get({ enableRealignment: true }, (items) => {
        if (items.enableRealignment) {
            observeTable();
            onUrlChange(() => {
                observeTable();
            });
        }
    });
}

// Run main when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
