
// Sophon Background Service

// Initialize Context Menus
chrome.runtime.onInstalled.addListener(() => {
    console.log("Sophon Sentinel Installed.");

    chrome.contextMenus.create({
        id: "sophon-verify-selection",
        title: "🛡️ Sophon Verify: Selection",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: "sophon-scan-image",
        title: "📸 Sophon Scan: Image Forensics",
        contexts: ["image"]
    });
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "sophon-verify-selection" && info.selectionText) {
        // Send message to content script to display analysis (simulated for now)
        chrome.tabs.sendMessage(tab.id, { 
            action: "verifySelection", 
            text: info.selectionText 
        });
    }

    if (info.menuItemId === "sophon-scan-image" && info.srcUrl) {
        chrome.tabs.sendMessage(tab.id, { 
            action: "verifyImage", 
            url: info.srcUrl 
        });
    }
});
