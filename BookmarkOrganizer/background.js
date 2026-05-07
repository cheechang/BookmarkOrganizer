// 后台服务脚本 - 处理插件生命周期事件

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Bookmark Organizer 已安装');
    // 初始化默认设置
    initializeDefaultSettings();
    // 首次安装后自动打开完整版页面
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log('Bookmark Organizer 已更新');
  }
});

// 点击图标时打开完整版页面
chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});

// 初始化默认设置
async function initializeDefaultSettings() {
  const defaultSettings = {
    autoBackup: true,
    backupInterval: 24, // 小时
    similarityThreshold: 80,
    lastBackup: null
  };
  
  await chrome.storage.local.set({ settings: defaultSettings });
  console.log('默认设置已初始化');
}

// 监听消息(用于与popup通信)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCategories') {
    fetch(chrome.runtime.getURL('rules/categories.json'))
      .then(response => response.json())
      .then(data => sendResponse(data))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 保持消息通道开启以进行异步响应
  }
});
