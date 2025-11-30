document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleScan');
    const statusDot = document.getElementById('statusDot');

    // Load state
    chrome.storage.local.get(['sophonActive'], (result) => {
        const isActive = result.sophonActive !== false;
        toggle.checked = isActive;
        updateStatus(isActive);
    });

    toggle.addEventListener('change', () => {
        const isActive = toggle.checked;
        chrome.storage.local.set({ sophonActive: isActive });
        updateStatus(isActive);

        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "toggle", status: isActive });
            }
        });
    });

    function updateStatus(active) {
        if (active) {
            statusDot.classList.remove('inactive');
        } else {
            statusDot.classList.add('inactive');
        }
    }
});