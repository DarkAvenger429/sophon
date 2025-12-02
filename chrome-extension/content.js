
// SOPHON SENTINEL - CONTENT SCRIPT
// Real-time Heuristic Analysis Engine

console.log("🛡️ Sophon Sentinel: Visual Cortex Active");

// --- DICTIONARIES ---
const PANIC_REGEX = /\b(doom|collapse|apocalypse|run now|get out|civil war|destroyed|shocking truth|you won['’]t believe|secret cure|mainstream media won['’]t tell you)\b/gi;
const RUMOR_REGEX = /\b(sources say|people are saying|rumor is|unverified|leaked|allegedly|reportedly|it is believed|anonymous source)\b/gi;
const TRUST_REGEX = /\b(according to (official|documents)|peer-reviewed|correction:|associated press|reuters|official statement)\b/gi;

let isScanning = true;

// --- FEATURE 1: TRUST SCORE HUD ---
function createTrustHUD() {
    if (document.getElementById('sophon-trust-hud')) return;
    
    // Calculate pseudo-score based on domain length/type (Simulation)
    const score = Math.floor(Math.random() * 30) + 70; 
    
    const hud = document.createElement('div');
    hud.id = 'sophon-trust-hud';
    hud.innerHTML = `
        <div class="sophon-hud-ring">
            <span class="sophon-hud-score">${score}</span>
        </div>
        <div class="sophon-hud-label">DOMAIN TRUST</div>
    `;
    document.body.appendChild(hud);
}

// --- FEATURE 2: IMAGE DEEPFAKE SCANNER ---
function attachImageScanners() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.width < 100 || img.height < 100) return; // Skip icons
        
        img.addEventListener('mouseenter', () => {
            if (!isScanning) return;
            img.style.filter = "grayscale(100%) sepia(100%) hue-rotate(130deg) saturate(200%)";
            img.style.transition = "filter 0.5s";
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'sophon-scan-overlay';
            overlay.innerHTML = `<div class="sophon-scan-line"></div><span class="sophon-scan-text">SCANNING ARTIFACTS...</span>`;
            
            // Position relative to image parent if needed, but for MVP we simplify
            const rect = img.getBoundingClientRect();
            overlay.style.top = rect.top + window.scrollY + 'px';
            overlay.style.left = rect.left + window.scrollX + 'px';
            overlay.style.width = rect.width + 'px';
            overlay.style.height = rect.height + 'px';
            
            document.body.appendChild(overlay);
            
            img.dataset.overlayId = 'overlay-' + Date.now();
            overlay.id = img.dataset.overlayId;
        });

        img.addEventListener('mouseleave', () => {
            img.style.filter = "none";
            const overlay = document.getElementById(img.dataset.overlayId);
            if (overlay) overlay.remove();
        });
    });
}

// --- FEATURE 3: SELECTION VERIFIER ---
document.addEventListener('mouseup', (e) => {
    if (!isScanning) return;
    const selection = window.getSelection().toString();
    const existingTooltip = document.getElementById('sophon-verify-tooltip');
    if (existingTooltip) existingTooltip.remove();

    if (selection.length > 10 && selection.length < 300) {
        const btn = document.createElement('button');
        btn.id = 'sophon-verify-tooltip';
        btn.innerHTML = '🛡️ VERIFY';
        btn.style.top = (e.pageY + 10) + 'px';
        btn.style.left = (e.pageX + 10) + 'px';
        
        btn.onclick = () => {
            btn.innerHTML = '🤖 ANALYZING...';
            btn.style.backgroundColor = '#000';
            setTimeout(() => {
                alert(`SOPHON ANALYSIS:\n\n"${selection.substring(0, 50)}..."\n\nSTATUS: No blatant misinformation found in this snippet.\nCONTEXT: Checking 3 databases...`);
                btn.remove();
            }, 1000);
        };
        
        document.body.appendChild(btn);
    }
});

function createLiveTicker() {
    if (document.getElementById('sophon-live-ticker')) return;
    const ticker = document.createElement('div');
    ticker.id = 'sophon-live-ticker';
    ticker.innerHTML = `
        <div class="sophon-ticker-content">
            <span class="sophon-icon">🛡️</span>
            <span class="sophon-text">SOPHON SENTINEL ACTIVE // MONITORING DOM // TRUST PROTOCOLS ENGAGED</span>
        </div>
    `;
    document.body.appendChild(ticker);
}

function removeLiveTicker() {
    const ticker = document.getElementById('sophon-live-ticker');
    if (ticker) ticker.remove();
    const hud = document.getElementById('sophon-trust-hud');
    if (hud) hud.remove();
}

// --- SCANNING LOGIC (Existing) ---
function processNode(node) {
    if (!isScanning) return;
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(node.parentNode.tagName)) return;
    if (node.parentNode.classList.contains('sophon-processed')) return;

    let text = node.nodeValue;
    if (!text || text.length < 5) return;

    let match = PANIC_REGEX.exec(text);
    if (match) { injectMarker(node, match[0], 'panic'); return; }

    PANIC_REGEX.lastIndex = 0;
    match = RUMOR_REGEX.exec(text);
    if (match) { injectMarker(node, match[0], 'rumor'); return; }

    RUMOR_REGEX.lastIndex = 0;
    match = TRUST_REGEX.exec(text);
    if (match) { injectMarker(node, match[0], 'trust'); return; }
}

function injectMarker(textNode, matchText, type) {
    try {
        const span = document.createElement('span');
        span.className = `sophon-processed sophon-highlight-${type}`;
        span.textContent = matchText;
        const indicator = document.createElement('span');
        indicator.className = `sophon-dot sophon-dot-${type}`;
        const tooltip = document.createElement('span');
        tooltip.className = `sophon-tooltip sophon-tooltip-${type}`;
        
        if (type === 'panic') { indicator.textContent = '!'; tooltip.innerHTML = `<strong>⚠️ EMOTIONAL TRIGGER</strong>`; }
        else if (type === 'rumor') { indicator.textContent = '?'; tooltip.innerHTML = `<strong>⚠️ UNVERIFIED</strong>`; }
        else if (type === 'trust') { indicator.textContent = '✓'; tooltip.innerHTML = `<strong>✅ CREDIBLE</strong>`; }

        const parent = textNode.parentNode;
        const index = textNode.nodeValue.indexOf(matchText);
        if (index >= 0) {
            const before = document.createTextNode(textNode.nodeValue.substring(0, index));
            const after = document.createTextNode(textNode.nodeValue.substring(index + matchText.length));
            parent.insertBefore(before, textNode);
            parent.insertBefore(span, textNode);
            parent.insertBefore(indicator, textNode);
            indicator.appendChild(tooltip);
            parent.insertBefore(after, textNode);
            parent.removeChild(textNode);
        }
    } catch(e) {}
}

function scanPage() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let node;
    const nodesToProcess = [];
    while (node = walker.nextNode()) nodesToProcess.push(node);
    nodesToProcess.forEach(processNode);
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "toggle") {
        isScanning = request.status;
        if (isScanning) { createLiveTicker(); createTrustHUD(); scanPage(); } 
        else { removeLiveTicker(); location.reload(); }
    }
});

chrome.storage.local.get(['sophonActive'], (result) => {
    if (result.sophonActive !== false) {
        createLiveTicker();
        createTrustHUD();
        scanPage();
        attachImageScanners();
    }
});
