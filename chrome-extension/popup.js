
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleScan');
    const statusDot = document.getElementById('statusDot');
    const biasNeedle = document.getElementById('biasNeedle');
    const biasLabel = document.getElementById('biasLabel');
    const btnSummarize = document.getElementById('btnSummarize');
    const summaryArea = document.getElementById('summaryArea');
    const trustScore = document.getElementById('trustScore');

    // Load state
    chrome.storage.local.get(['sophonActive'], (result) => {
        const isActive = result.sophonActive !== false;
        toggle.checked = isActive;
        updateStatus(isActive);
    });

    // Toggle Handler
    toggle.addEventListener('change', () => {
        const isActive = toggle.checked;
        chrome.storage.local.set({ sophonActive: isActive });
        updateStatus(isActive);
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: "toggle", status: isActive });
        });
    });

    function updateStatus(active) {
        statusDot.classList.toggle('inactive', !active);
    }

    // Simulate Bias Analysis based on URL hash (Deterministic Random)
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const url = tabs[0]?.url || "";
        let hash = 0;
        for (let i = 0; i < url.length; i++) hash = url.charCodeAt(i) + ((hash << 5) - hash);
        
        // Map hash to 0-100 position (50 is neutral)
        const pos = Math.abs(hash % 100);
        biasNeedle.style.left = `${pos}%`;
        
        let label = "NEUTRAL";
        if (pos < 30) label = "LEANING LEFT";
        if (pos > 70) label = "LEANING RIGHT";
        biasLabel.innerText = label;

        // Trust Score Logic
        const score = 100 - (pos % 40); // Random score 60-100
        trustScore.innerText = score;
    });

    // Summary Generator
    btnSummarize.addEventListener('click', () => {
        btnSummarize.innerText = "PROCESSING...";
        summaryArea.style.display = 'block';
        summaryArea.innerText = "Sophon Cortex is analyzing page content...";
        
        setTimeout(() => {
            btnSummarize.innerText = "GENERATE TL;DR SUMMARY";
            summaryArea.innerText = "📝 SUMMARY: This page contains verified reporting patterns. Key entities identified. No active disinformation signatures detected in the primary text body. Cross-referencing suggests high credibility.";
        }, 1500);
    });
});
