// content.js
// GitHub Contribution Graph Realignment Tool
// Author: Temporal Correction Initiative
// Description: A browser extension to modify GitHub contribution graphs to start weeks on Monday.

function startWeekOnMonday(table) {
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

        // 2. Shift Sunday row's contribution data
        // By moving the Sunday row from the top to the bottom, the Sundays in each 
        // column become "backward" (they represent the date *before* the Monday above them).
        // We delete the first cell (index 1, as index 0 is the label) so that 
        // all subsequent Sundays shift left by one column.
        // This ensures that the Sunday at the bottom of a column is the one 
        // that *follows* the Monday at the top of that same column.
        const lastRow = tbody.rows[tbody.rows.length - 1];
        lastRow.deleteCell(1);

        // 3. Fix the visibility of the "Sun" label
        const span = lastRow.cells[0].querySelector('span[aria-hidden="true"]');
        if (span && span.hasAttribute('style')) {
            const newStyle = span.getAttribute('style').replace('Circle(0)', 'None');
            span.setAttribute('style', newStyle);
        }

    } catch (err) {
        console.error('[Contribution Graph Realignment] Failed during DOM manipulation:', err);
    }
}

// --- Initialization and MutationObserver Logic ---

function tryCorrect() {
    const table = document.querySelector('.ContributionCalendar-grid');
    if (table) startWeekOnMonday(table);
}

function startObserver() {
    // Watch for the contribution graph being added/replaced anywhere in the page.
    // The observer is created once and kept alive — disconnecting it prematurely
    // breaks realignment when navigating from a non-profile page to a profile page.
    const observer = new MutationObserver(tryCorrect);
    // Observe documentElement, not body — Turbo replaces the entire <body> element on
    // navigation, which would leave an observer on document.body watching a detached node.
    observer.observe(document.documentElement, { childList: true, subtree: true });
}

// Main entry point

// Use browser.storage if available (preferred in modern browsers), otherwise fall back to chrome.storage.
// This ensures compatibility across Chrome, Firefox, and other browsers supporting the WebExtension API.
const storage = typeof browser !== 'undefined' && browser.storage ? browser.storage : chrome.storage;

function main() {
    // Check if realignment is enabled before running
    storage.sync.get({ enableRealignment: true }, (items) => {
        if (items.enableRealignment) {
            tryCorrect();
            startObserver();
            // GitHub uses Turbo for SPA navigation. DOM events cross the MV3 isolated world
            // boundary, so this fires reliably for in-page link clicks without needing to
            // patch history.pushState (which would only affect the content script's own world).
            document.addEventListener('turbo:load', tryCorrect);
        }
    });
}

// Run main when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
