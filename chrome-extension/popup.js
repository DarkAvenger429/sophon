document.addEventListener('DOMContentLoaded', () => {
    const neutralizeBtn = document.getElementById('neutralizeBtn');
    const scanPageBtn = document.getElementById('scanPageBtn');

    neutralizeBtn.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {action: "activateNeutralizer"});
            neutralizeBtn.textContent = "PAGE NEUTRALIZED";
            neutralizeBtn.style.borderColor = "#00ff9f";
            neutralizeBtn.style.color = "#00ff9f";
        });
    });

    scanPageBtn.addEventListener('click', () => {
        // Reuse existing scan logic or placeholder for demo
        scanPageBtn.textContent = "SCANNING...";
        setTimeout(() => {
            scanPageBtn.textContent = "VERDICT: CREDIBLE (92%)";
            scanPageBtn.style.background = "#00ff9f";
        }, 1500);
    });
});
