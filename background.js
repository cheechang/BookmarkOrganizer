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
  chrome.runtime.openOptionsPage(() => {
    if (chrome.runtime.lastError) {
      console.error('Failed to open options page:', chrome.runtime.lastError.message);
      // Fallback: create a new tab with options page URL
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    }
  });
});

// 初始化默认设置
async function initializeDefaultSettings() {
  const defaultSettings = {
    autoBackup: true,
    backupInterval: 24, // 小时
    similarityThreshold: 80,
    showPath: true,
    lastBackup: null
  };
  
  await chrome.storage.local.set({ settings: defaultSettings });
  console.log('默认设置已初始化');
}

// 监听消息(用于与popup通信)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCategories') {
    loadMergedCategories().then(data => sendResponse(data))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 保持消息通道开启以进行异步响应
  }
});

// 加载默认分类规则并与用户自定义规则合并
async function loadMergedCategories() {
  // 加载默认规则
  const response = await fetch(chrome.runtime.getURL('rules/categories.json'));
  const defaultData = await response.json();
  const defaultCategories = defaultData.categories || [];

  // 加载用户自定义规则
  const result = await chrome.storage.local.get('customCategories');
  const customCategories = result.customCategories || [];

  // 合并：自定义规则排在前面（优先级更高）
  return {
    categories: [...customCategories, ...defaultCategories]
  };
}
