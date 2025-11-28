// SOPHON BACKGROUND SERVICE
// Handles Context Menus and API Relays

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sophon-verify-image",
    title: "🔍 Sophon Scan: Analyze Image Forensics",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sophon-verify-image") {
    // Send message to content script to show loader/result
    chrome.tabs.sendMessage(tab.id, {
      action: "analyzeImage",
      srcUrl: info.srcUrl
    });
  }
});
