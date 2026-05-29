// content.js
// GitHub Contribution Graph Realignment Tool
// Author: Temporal Correction Initiative
// Description: A browser extension to modify GitHub contribution graphs to start weeks on Monday.

// --- Contribution Graph Realignment ---------------------------------------------------------------------------------
// #region

function startWeekOnMonday(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.error('[Contribution Graph Realignment] Failed: No <tbody> found in contribution graph table.');
        return;
    }

    if (!validateGraph(tbody)) return;

    const sundayRow = getSundayRow(tbody);
    if (!sundayRow) {
        console.error('[Contribution Graph Realignment] Failed: No Sunday row found in contribution graph.');
        return;
    }

    // Already corrected — Sunday has been moved to the bottom
    if (tbody.rows[0] !== sundayRow) return;

    try {
        realignGraph(tbody, sundayRow);
    } catch (err) {
        console.error('[Contribution Graph Realignment] Failed during DOM manipulation:', err);
    }
}

function validateGraph(tbody) {
    if (tbody.rows.length !== 7) {
        console.error('[Contribution Graph Realignment] Failed: Contribution graph does not have 7 rows. Found:', tbody.rows.length);
        return false;
    }

    const firstRow = tbody.rows[0];

    // Guard before calling getLabelSpan — needs at least a label cell and one data cell
    if (firstRow.cells.length < 2) {
        console.error('[Contribution Graph Realignment] Failed: Sunday row does not have enough cells to shift contribution data.');
        return false;
    }

    if (!getLabelSpan(firstRow)) {
        console.error('[Contribution Graph Realignment] Failed: No label span found in first row.');
        return false;
    }

    return true;
}

function realignGraph(tbody, sundayRow) {
    // 1. Move the Sunday row to the bottom.
    tbody.appendChild(sundayRow);

    // 2. Shift Sunday row's contribution data.
    // By moving the Sunday row from the top to the bottom, the Sundays in each
    // column become "backward" (they represent the date *before* the Monday above them).
    // We delete the first data cell (index 1) so that all subsequent Sundays shift
    // left by one column, ensuring each Sunday follows the Monday at the top of that column.
    sundayRow.deleteCell(1);

    // 3. Fix the visibility of the "Sun" label.
    const span = getLabelSpan(sundayRow);
    if (span && span.hasAttribute('style')) {
        const newStyle = span.getAttribute('style').replace('Circle(0)', 'None');
        span.setAttribute('style', newStyle);
    }
}

function getSundayRow(tbody) {
    for (const row of tbody.rows) {
        const span = getLabelSpan(row);
        if (span && span.textContent.trim() === 'Sun') return row;
    }
    return null;
}

function getLabelSpan(row) {
    return row.cells[0].querySelector('span[aria-hidden="true"]');
}
// #endregion

// --- Initialization and MutationObserver Logic ----------------------------------------------------------------------
// #region

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
// #endregion

// --- Main entry point -----------------------------------------------------------------------------------------------
// #region

// Use browser.storage if available (preferred in modern browsers), otherwise fall back to chrome.storage.
// This ensures compatibility across Chrome, Firefox, and other browsers supporting the WebExtension API.
const storage = typeof browser !== 'undefined' && browser.storage ? browser.storage : chrome.storage;

function main() {
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
// #endregion
