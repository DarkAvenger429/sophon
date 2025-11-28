
// SOPHON SENTINEL - ENTERPRISE CONTENT SCRIPT v4.0
// "GOD MODE" VISUAL LAYER

console.log("🛡️ SOPHON SENTINEL: INJECTING FORENSIC LAYER...");

// --- CONFIG & STYLES ---
const STYLES = `
    .sophon-highlight-danger {
        background-color: rgba(255, 0, 60, 0.15);
        border-bottom: 2px solid #ff003c;
        color: inherit;
        cursor: help;
        transition: all 0.2s;
    }
    .sophon-highlight-danger:hover {
        background-color: #ff003c;
        color: white;
    }
    
    .sophon-hud-card {
        position: absolute;
        z-index: 2147483647;
        background: rgba(5, 5, 5, 0.95);
        border: 1px solid #00f0ff;
        border-left: 4px solid #00f0ff;
        padding: 15px;
        border-radius: 4px;
        box-shadow: 0 10px 30px rgba(0, 240, 255, 0.2);
        backdrop-filter: blur(10px);
        font-family: 'Courier New', monospace;
        color: white;
        width: 250px;
        pointer-events: none;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.2s, transform 0.2s;
    }
    .sophon-hud-visible {
        opacity: 1;
        transform: translateY(0);
    }
    .sophon-hud-title {
        font-size: 12px;
        font-weight: bold;
        color: #00f0ff;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 4px;
    }
    .sophon-stat-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 10px;
        color: #ccc;
    }
    .sophon-bar-bg {
        width: 100%;
        height: 4px;
        background: #333;
        margin-top: 2px;
        border-radius: 2px;
    }
    .sophon-bar-fill {
        height: 100%;
        background: #00ff9f;
        border-radius: 2px;
    }
    
    #sophon-floating-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #000;
        border: 2px solid #00ff9f;
        border-radius: 50%;
        z-index: 2147483647;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 20px rgba(0, 255, 159, 0.3);
        transition: transform 0.3s;
    }
    #sophon-floating-widget:hover {
        transform: scale(1.1);
    }
    .sophon-logo {
        font-weight: bold;
        color: #00ff9f;
        font-family: monospace;
        font-size: 24px;
    }
    .sophon-pulse {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: 50%;
        border: 1px solid #00ff9f;
        animation: s-pulse 2s infinite;
    }
    @keyframes s-pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
    }
`;

// Inject Styles
const styleSheet = document.createElement("style");
styleSheet.innerText = STYLES;
document.head.appendChild(styleSheet);

// --- 1. SENTIMENT X-RAY (Text Highlighting) ---
// Words that trigger emotional response or indicate bias
const TRIGGER_WORDS = [
    "shocking", "exposed", "secret", "deep state", "hoax", "miracle", "destroy", 
    "slammed", "urgent", "banned", "censored", "mainstream media", "truth", 
    "plotting", "nightmare", "invasion", "collapse", "panic"
];

function runXRayScan() {
    // Only scan paragraphs to avoid breaking navigation
    const elements = document.querySelectorAll('p, li, span');
    
    elements.forEach(el => {
        if (el.getAttribute('data-sophon-scanned')) return;
        if (el.children.length > 0) return; // Skip complex nodes
        
        let html = el.innerHTML;
        let hasChange = false;
        
        TRIGGER_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(html)) {
                html = html.replace(regex, (match) => `<span class="sophon-highlight-danger" title="Emotional Trigger detected">${match}</span>`);
                hasChange = true;
            }
        });
        
        if (hasChange) {
            el.innerHTML = html;
            el.setAttribute('data-sophon-scanned', 'true');
        }
    });
}

// --- 2. INTEL HUD (Hover Cards) ---
let activeHud = null;

function createHud(x, y, data) {
    if (activeHud) activeHud.remove();
    
    const hud = document.createElement('div');
    hud.className = 'sophon-hud-card';
    hud.style.left = `${x + 20}px`;
    hud.style.top = `${y + 20}px`;
    
    const trustColor = data.trust > 80 ? '#00ff9f' : data.trust > 50 ? '#fcee0a' : '#ff003c';
    
    hud.innerHTML = `
        <div class="sophon-hud-title">SOPHON INTEL</div>
        <div class="sophon-stat-row">
            <span>TRUST SCORE</span>
            <span style="color:${trustColor}">${data.trust}/100</span>
        </div>
        <div class="sophon-bar-bg"><div class="sophon-bar-fill" style="width:${data.trust}%; background:${trustColor}"></div></div>
        
        <div class="sophon-stat-row" style="margin-top:10px;">
            <span>SENTIMENT</span>
            <span>${data.sentiment}</span>
        </div>
        
        <div class="sophon-stat-row">
            <span>BIAS</span>
            <span>${data.bias}</span>
        </div>
    `;
    
    document.body.appendChild(hud);
    
    // Animate in
    requestAnimationFrame(() => hud.classList.add('sophon-hud-visible'));
    
    return hud;
}

function attachHudListeners() {
    const headlines = document.querySelectorAll('h1, h2, h3, a');
    headlines.forEach(el => {
        if (el.getAttribute('data-sophon-hud')) return;
        
        el.addEventListener('mouseenter', (e) => {
            if (el.innerText.length < 15) return;
            
            // Mock Data Generation based on heuristics
            const text = el.innerText.toLowerCase();
            const isClickbait = /shocking|you won't believe|secret/.test(text);
            
            const data = {
                trust: isClickbait ? Math.floor(Math.random() * 40) : 85 + Math.floor(Math.random() * 15),
                sentiment: isClickbait ? 'HIGH AROUSAL (FEAR)' : 'NEUTRAL',
                bias: 'ANALYZING...'
            };
            
            activeHud = createHud(e.pageX, e.pageY, data);
        });
        
        el.addEventListener('mouseleave', () => {
            if (activeHud) {
                activeHud.remove();
                activeHud = null;
            }
        });
        
        el.setAttribute('data-sophon-hud', 'true');
    });
}

// --- 3. THE SENTINEL WIDGET (Floating Control) ---
function injectWidget() {
    if (document.getElementById('sophon-floating-widget')) return;
    
    const widget = document.createElement('div');
    widget.id = 'sophon-floating-widget';
    widget.innerHTML = `
        <div class="sophon-pulse"></div>
        <div class="sophon-logo">S</div>
    `;
    
    widget.addEventListener('click', () => {
        const confirmScan = confirm("SOPHON SENTINEL\n\nPage Status: MONITORING\n\nDo you want to run a Deep Scan on this page content?");
        if (confirmScan) {
            // In a real app, this sends a message to background.js
            alert("SCAN INITIATED... \n\nSending page content to Gemini 2.5 Flash...");
        }
    });
    
    document.body.appendChild(widget);
}

// --- EXECUTION LOOP ---
function init() {
    runXRayScan();
    attachHudListeners();
    injectWidget();
}

// Run initially
init();

// Watch for scrolling/dynamic content
let timeout;
window.addEventListener('scroll', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        runXRayScan();
        attachHudListeners();
    }, 500);
});

console.log("🛡️ SOPHON VISUAL LAYER ACTIVE");
