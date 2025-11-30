
// SOPHON SENTINEL - CONTENT SCRIPT
// Real-time Heuristic Analysis Engine

console.log("🛡️ Sophon Sentinel: Visual Cortex Active");

// --- DICTIONARIES ---

// 🔴 PANIC WORDS: Immediate emotional triggers
const PANIC_REGEX = /\b(doom|collapse|apocalypse|run now|get out|civil war|destroyed|shocking truth|you won['’]t believe|secret cure|mainstream media won['’]t tell you)\b/gi;

// 🟡 RUMOR MARKERS: Hearsay and unverified attribution
const RUMOR_REGEX = /\b(sources say|people are saying|rumor is|unverified|leaked|allegedly|reportedly|it is believed|anonymous source)\b/gi;

// 🟢 TRUST MARKERS: Credible attribution
const TRUST_REGEX = /\b(according to (official|documents)|peer-reviewed|correction:|associated press|reuters|official statement)\b/gi;

let isScanning = true;

// --- TICKER UI INJECTION ---
function createLiveTicker() {
    if (document.getElementById('sophon-live-ticker')) return;

    const ticker = document.createElement('div');
    ticker.id = 'sophon-live-ticker';
    ticker.innerHTML = `
        <div class="sophon-ticker-content">
            <span class="sophon-icon">🛡️</span>
            <span class="sophon-text">SOPHON SENTINEL ACTIVE // SCANNING DOM // MONITORING TRUST SIGNALS...</span>
        </div>
    `;
    document.body.appendChild(ticker);
}

function removeLiveTicker() {
    const ticker = document.getElementById('sophon-live-ticker');
    if (ticker) ticker.remove();
}

// --- SCANNING LOGIC ---

function processNode(node) {
    if (!isScanning) return;
    
    // Skip script, style, input, and already processed nodes
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'CODE', 'PRE'].includes(node.parentNode.tagName)) return;
    if (node.parentNode.classList.contains('sophon-processed')) return;

    let text = node.nodeValue;
    if (!text || text.length < 5) return; // Skip tiny fragments

    // 1. PANIC SCAN (Highest Priority)
    let match = PANIC_REGEX.exec(text);
    if (match) {
        injectMarker(node, match[0], 'panic');
        return;
    }

    // 2. RUMOR SCAN
    PANIC_REGEX.lastIndex = 0; // Reset
    match = RUMOR_REGEX.exec(text);
    if (match) {
        injectMarker(node, match[0], 'rumor');
        return;
    }

    // 3. TRUST SCAN
    RUMOR_REGEX.lastIndex = 0; // Reset
    match = TRUST_REGEX.exec(text);
    if (match) {
        injectMarker(node, match[0], 'trust');
        return;
    }
}

function injectMarker(textNode, matchText, type) {
    try {
        const span = document.createElement('span');
        span.className = `sophon-processed sophon-highlight-${type}`;
        span.textContent = matchText;

        // Visual Indicator (Dot/Icon)
        const indicator = document.createElement('span');
        indicator.className = `sophon-dot sophon-dot-${type}`;
        
        // Tooltip
        const tooltip = document.createElement('span');
        tooltip.className = `sophon-tooltip sophon-tooltip-${type}`;
        
        if (type === 'panic') {
            indicator.textContent = '!';
            tooltip.innerHTML = `<strong>⚠️ EMOTIONAL TRIGGER</strong><br/>Detailed analysis suggests this phrasing is designed to bypass critical thinking.`;
        } else if (type === 'rumor') {
            indicator.textContent = '?';
            tooltip.innerHTML = `<strong>⚠️ UNVERIFIED ATTRIBUTION</strong><br/>Hearsay detected. Cross-reference with primary sources.`;
        } else if (type === 'trust') {
            indicator.textContent = '✓';
            tooltip.innerHTML = `<strong>✅ CREDIBILITY SIGNAL</strong><br/>Citation or specific attribution detected.`;
        }

        // Insert into DOM
        const parent = textNode.parentNode;
        const index = textNode.nodeValue.indexOf(matchText);
        
        if (index >= 0) {
            const before = document.createTextNode(textNode.nodeValue.substring(0, index));
            const after = document.createTextNode(textNode.nodeValue.substring(index + matchText.length));
            
            // Re-assemble
            parent.insertBefore(before, textNode);
            parent.insertBefore(span, textNode); // The highlighted text
            parent.insertBefore(indicator, textNode); // The icon next to it
            indicator.appendChild(tooltip); // Tooltip lives inside the indicator
            parent.insertBefore(after, textNode);
            parent.removeChild(textNode);
        }
    } catch(e) {
        // Fail silently to preserve page integrity
    }
}

function scanPage() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node;
    const nodesToProcess = [];
    
    while (node = walker.nextNode()) {
        nodesToProcess.push(node);
    }

    nodesToProcess.forEach(processNode);
}

// --- MESSAGE LISTENER (Context Menu) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
        isScanning = request.status;
        if (isScanning) {
            createLiveTicker();
            scanPage();
        } else {
            removeLiveTicker();
            location.reload();
        }
    }

    if (request.action === "verifySelection") {
        alert(`🛡️ SOPHON ANALYSIS:\n\n"${request.text}"\n\nSTATUS: VERIFYING...\n(In full version, this triggers RAG Check)`);
    }

    if (request.action === "verifyImage") {
        alert(`📸 SOPHON IMAGE SCAN:\n\nURL: ${request.url.substring(0, 30)}...\n\nSTATUS: SCANNING METADATA...\n(In full version, this triggers Deepfake Detection)`);
    }
});

// --- OBSERVER FOR DYNAMIC CONTENT (Infinite Scroll) ---
let timeout = null;
const observer = new MutationObserver((mutations) => {
    if (!isScanning) return;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        scanPage();
    }, 1000); // Debounce scanning
});

// --- INITIALIZATION ---
chrome.storage.local.get(['sophonActive'], (result) => {
    if (result.sophonActive !== false) { // Default to true
        createLiveTicker();
        scanPage();
        observer.observe(document.body, { childList: true, subtree: true });
    }
});
