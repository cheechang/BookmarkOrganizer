// 完整功能页面逻辑

let categories = [];
let analysisResults = [];
let duplicates = [];
let selectedBookmarks = new Set();
let currentSettings = {};
let customRules = [];
let currentCategorySearch = '';
let currentDuplicateSearch = '';

// ==================== 深色模式 ====================

async function initTheme() {
  const result = await chrome.storage.local.get('theme');
  const theme = result.theme || 'light';
  applyTheme(theme);
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggle.title = theme === 'dark' ? _t('tooltipLightMode') : _t('tooltipDarkMode');
  }
}

async function toggleTheme() {
  const current = document.body.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  await chrome.storage.local.set({ theme: next });
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await I18n.init();
  initLanguageSelector();
  I18n.applyToPage();
  await loadCategories();
  await loadSettings();
  setupNavigation();
  setupEventListeners();
  await loadBackupsListFull();
  await loadCustomRules();
  await initTheme();
});

// 初始化语言选择器
function initLanguageSelector() {
  const selector = document.getElementById('langSelector');
  if (!selector) return;
  
  const locales = I18n.getSupportedLocales();
  selector.innerHTML = '';
  locales.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc.code;
    option.textContent = loc.native;
    if (loc.code === I18n.getLocale()) {
      option.selected = true;
    }
    selector.appendChild(option);
  });
  
  selector.addEventListener('change', (e) => {
    I18n.setLocale(e.target.value);
  });
}

// 语言切换时重新渲染动态内容
window.addEventListener('localeChanged', () => {
  const currentTheme = document.body.getAttribute('data-theme') || 'light';
  applyTheme(currentTheme);
  if (analysisResults.length > 0) {
    displayCategoriesFull(currentCategorySearch);
  }
  if (duplicates.length > 0) {
    displayDuplicatesFull(currentFilterGroupFull, currentDuplicateSearch);
  }
  loadBackupsListFull();
  displayCustomRules();
  if (brokenLinksResults.length > 0) {
    displayBrokenLinks();
  }
});

// 加载分类规则
async function loadCategories() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCategories' });
    if (response && response.categories) {
      categories = response.categories;
    }
  } catch (error) {
    console.error('Load categories failed:', error);
    showMessage(_t('msgLoadCategoriesFailed'), 'error');
  }
}

// 加载设置
async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  const settings = result.settings || {};
  currentSettings = settings;
  
  // 自动备份
  const autoBackupSetting = document.getElementById('autoBackupSetting');
  if (autoBackupSetting) {
    autoBackupSetting.checked = settings.autoBackup !== false;
    autoBackupSetting.addEventListener('change', async (e) => {
      settings.autoBackup = e.target.checked;
      await chrome.storage.local.set({ settings });
      showMessage(_t('msgSettingsSaved'), 'success');
    });
  }
  
  // 相似度阈值
  const thresholdSlider = document.getElementById('similarityThreshold');
  const thresholdValue = document.getElementById('thresholdValue');
  if (thresholdSlider) {
    thresholdSlider.value = settings.similarityThreshold || 80;
    thresholdValue.textContent = thresholdSlider.value;
    
    thresholdSlider.addEventListener('input', async (e) => {
      thresholdValue.textContent = e.target.value;
      settings.similarityThreshold = parseInt(e.target.value);
      await chrome.storage.local.set({ settings });
    });
  }
  
  // 显示书签路径
  const showPathSetting = document.getElementById('showPathSetting');
  if (showPathSetting) {
    showPathSetting.checked = settings.showPath !== false;
    showPathSetting.addEventListener('change', async (e) => {
      settings.showPath = e.target.checked;
      await chrome.storage.local.set({ settings });
      showMessage(_t('msgSettingsSaved'), 'success');
      // 如果当前有重复检测数据，立即刷新显示
      if (duplicates.length > 0) {
        displayDuplicatesFull(currentFilterGroupFull);
      }
    });
  }
}

// 设置导航
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      switchToPage(page);
    });
  });
}

// 切换页面
window.switchToPage = function(pageName) {
  // 更新导航状态
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });
  
  // 更新页面显示
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  const targetPage = document.getElementById(`${pageName}Page`);
  if (targetPage) {
    targetPage.classList.add('active');
  }
};

// 设置事件监听
function setupEventListeners() {
  // 完整扫描按钮
  document.getElementById('fullScanBtn')?.addEventListener('click', handleFullScan);

  // 快速备份按钮
  document.getElementById('quickBackupBtn')?.addEventListener('click', handleQuickBackup);

  // 应用分类按钮
  document.getElementById('applyCategoriesBtnFull')?.addEventListener('click', handleApplyCategories);

  // 清理重复按钮
  document.getElementById('removeDuplicatesBtnFull')?.addEventListener('click', handleRemoveDuplicates);

  // 导出备份按钮
  document.getElementById('exportBackupBtn')?.addEventListener('click', handleExportBackup);

  // 导入备份输入
  document.getElementById('importBackupInput')?.addEventListener('change', handleImportBackup);

  // 创建备份按钮
  document.getElementById('createBackupBtn')?.addEventListener('click', handleCreateBackup);

  // 清除所有数据按钮
  document.getElementById('clearAllDataBtn')?.addEventListener('click', handleClearAllData);

  // 深色模式切换
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // 检查更新
  document.getElementById('checkUpdateBtn')?.addEventListener('click', checkForUpdates);

  // 搜索框
  document.getElementById('categoriesSearch')?.addEventListener('input', (e) => {
    currentCategorySearch = e.target.value.trim().toLowerCase();
    displayCategoriesFull(currentCategorySearch);
  });
  document.getElementById('duplicatesSearch')?.addEventListener('input', (e) => {
    currentDuplicateSearch = e.target.value.trim().toLowerCase();
    displayDuplicatesFull(currentFilterGroupFull, currentDuplicateSearch);
  });

  // 展开/折叠全部
  document.getElementById('expandAllCategories')?.addEventListener('click', () => {
    document.querySelectorAll('.category-group').forEach(g => g.classList.remove('collapsed'));
  });
  document.getElementById('collapseAllCategories')?.addEventListener('click', () => {
    document.querySelectorAll('.category-group').forEach(g => g.classList.add('collapsed'));
  });

  // 分类组折叠切换（事件委托）
  document.getElementById('categoriesList')?.addEventListener('click', (e) => {
    const toggle = e.target.closest('.category-toggle');
    if (toggle) {
      const group = toggle.closest('.category-group');
      group.classList.toggle('collapsed');
    }
  });

  // 自定义规则按钮
  document.getElementById('addRuleBtn')?.addEventListener('click', showAddRuleForm);
  document.getElementById('saveRuleBtn')?.addEventListener('click', saveCustomRule);
  document.getElementById('cancelRuleBtn')?.addEventListener('click', hideRuleForm);

  // 自定义规则列表事件委托（编辑/删除）
  document.getElementById('customRulesList')?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-rule"]');
    if (editBtn) {
      showEditRuleForm(parseInt(editBtn.dataset.index));
      return;
    }
    const deleteBtn = e.target.closest('[data-action="delete-rule"]');
    if (deleteBtn) {
      deleteCustomRule(parseInt(deleteBtn.dataset.index));
      return;
    }
  });

  // 备份列表事件委托（替代内联onclick）
  document.getElementById('backupsListFull')?.addEventListener('click', (e) => {
    const restoreBtn = e.target.closest('[data-action="restore-backup"]');
    if (restoreBtn) {
      restoreBackupFull(parseInt(restoreBtn.dataset.index));
      return;
    }

    const deleteBtn = e.target.closest('[data-action="delete-backup"]');
    if (deleteBtn) {
      deleteBackupFull(parseInt(deleteBtn.dataset.index));
      return;
    }
  });

  // 分类建议和重复检测页面的"去扫描"按钮事件委托
  document.getElementById('categoriesList')?.addEventListener('click', (e) => {
    const switchBtn = e.target.closest('[data-action="switch-to-page"]');
    if (switchBtn) {
      switchToPage(switchBtn.dataset.page);
    }
  });

  document.getElementById('duplicatesList')?.addEventListener('click', (e) => {
    const switchBtn = e.target.closest('[data-action="switch-to-page"]');
    if (switchBtn) {
      switchToPage(switchBtn.dataset.page);
    }
  });

  // 失效链接检测按钮
  document.getElementById('checkBrokenLinksBtn')?.addEventListener('click', handleCheckBrokenLinks);
  document.getElementById('selectAllBrokenBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.broken-link-checkbox').forEach(cb => cb.checked = true);
  });
  document.getElementById('deselectAllBrokenBtn')?.addEventListener('click', () => {
    document.querySelectorAll('.broken-link-checkbox').forEach(cb => cb.checked = false);
  });
  document.getElementById('deleteBrokenLinksBtn')?.addEventListener('click', handleDeleteBrokenLinks);

  // 失效链接搜索
  const brokenLinksSearchInput = document.getElementById('brokenLinksSearchInput');
  if (brokenLinksSearchInput) {
    brokenLinksSearchInput.addEventListener('input', (e) => {
      brokenLinksSearchTerm = e.target.value.trim().toLowerCase();
      displayBrokenLinks();
    });
  }
}

// 处理完整扫描
async function handleFullScan() {
  const scanBtn = document.getElementById('fullScanBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  scanBtn.disabled = true;
  progressContainer.classList.remove('hidden');
  progressFill.style.width = '0%';
  progressText.textContent = _t('progressGettingBookmarks');
  
  try {
    // 自动备份
    const settingsResult = await chrome.storage.local.get('settings');
    if (settingsResult.settings?.autoBackup) {
      progressText.textContent = _t('progressAutoBackup');
      await backupBookmarks();
      await loadBackupsListFull();
    }
    
    // 获取所有书签
    progressText.textContent = _t('progressAnalyzing');
    const bookmarks = await getAllBookmarks();
    
    // 分析每个书签
    analysisResults = [];
    const total = bookmarks.length;
    
    for (let i = 0; i < total; i++) {
      const result = await analyzeBookmark(bookmarks[i], categories);
      analysisResults.push(result);
      
      const progress = ((i + 1) / total) * 100;
      progressFill.style.width = `${progress}%`;
      progressText.textContent = _t('progressAnalyzingItem', [`${i + 1}`, `${total}`]);
      
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // 检测重复
    progressText.textContent = _t('progressDetectingDuplicates');
    const threshold = (currentSettings.similarityThreshold || 80) / 100;
    duplicates = await detectDuplicates(threshold);
    
    // 显示统计信息
    displayStats(bookmarks.length, duplicates.length);
    
    // 显示分类建议
    displayCategoriesFull(currentCategorySearch);

    // 显示重复项
    displayDuplicatesFull(currentFilterGroupFull, currentDuplicateSearch);
    
    progressText.textContent = _t('progressComplete');
    showMessage(_t('msgScanComplete', [`${total}`]), 'success');
    
    // 自动切换到分类建议页面
    setTimeout(() => {
      switchToPage('categories');
    }, 1000);
    
  } catch (error) {
    console.error('Scan failed:', error);
    showMessage(_t('msgScanFailed') + error.message, 'error');
  } finally {
    scanBtn.disabled = false;
    setTimeout(() => {
      progressContainer.classList.add('hidden');
    }, 1500);
  }
}

// 显示统计信息
function displayStats(total, duplicateCount) {
  const statsPanel = document.getElementById('statsPanel');
  statsPanel.classList.remove('hidden');
  
  document.getElementById('totalBookmarks').textContent = total;
  
  const uncategorized = analysisResults.filter(r => !r.category || r.confidence === 'none').length;
  document.getElementById('uncategorizedCount').textContent = uncategorized;
  
  const categorized = total - uncategorized;
  document.getElementById('categorizedCount').textContent = categorized;
  
  document.getElementById('duplicatesCount').textContent = duplicateCount;
}

// 显示分类建议(完整版)
function displayCategoriesFull(searchTerm = '') {
  const container = document.getElementById('categoriesList');
  const applyBtn = document.getElementById('applyCategoriesBtnFull');
  const toolbar = document.getElementById('categoriesToolbar');

  const grouped = {};
  for (const result of analysisResults) {
    if (result.category && result.confidence !== 'none') {
      const catName = result.category.name;
      if (!grouped[catName]) {
        grouped[catName] = [];
      }
      grouped[catName].push(result);
    }
  }

  // 根据搜索词过滤
  const term = searchTerm.toLowerCase();
  for (const catName of Object.keys(grouped)) {
    if (term) {
      grouped[catName] = grouped[catName].filter(item => {
        const title = (item.bookmark.title || '').toLowerCase();
        const url = (item.bookmark.url || '').toLowerCase();
        return title.includes(term) || url.includes(term);
      });
    }
  }
  // 移除空组
  for (const catName of Object.keys(grouped)) {
    if (grouped[catName].length === 0) {
      delete grouped[catName];
    }
  }

  if (Object.keys(grouped).length === 0) {
    container.innerHTML = `
      <div class="empty-state-large">
        <div class="empty-icon">📂</div>
        <h3>${_t('emptyNoCategories')}</h3>
        <p>${term ? _t('emptyNoResults') : _t('emptyNeedMoreRules')}</p>
      </div>
    `;
    applyBtn?.classList.add('hidden');
    toolbar?.classList.add('hidden');
    return;
  }

  toolbar?.classList.remove('hidden');

  let html = '';
  for (const [catName, items] of Object.entries(grouped)) {
    html += `
      <div class="category-group">
        <div class="category-header">
          <div class="category-header-left">
            <button class="category-toggle" aria-label="Toggle">▼</button>
            <span class="category-name">${escapeHtml(catName)}</span>
          </div>
          <span class="category-count">${_t('labelBookmarksCount', [`${items.length}`])}</span>
        </div>
        <div class="category-items">
    `;

    for (const item of items) {
      const bookmark = item.bookmark;
      const confidenceClass = `confidence-${item.confidence}`;
      const confidenceText = {
        'high': _t('confidenceHigh'),
        'medium': _t('confidenceMedium'),
        'low': _t('confidenceLow')
      }[item.confidence];

      html += `
        <div class="bookmark-item">
          <input type="checkbox" class="bookmark-checkbox"
                 data-id="${bookmark.id}"
                 data-folder="${catName}"
                 checked>
          <div class="bookmark-info">
            <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
            <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
            <div class="bookmark-meta">
              <span class="confidence-badge ${confidenceClass}">
                ${_t('labelConfidence')}${confidenceText}
              </span>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div></div>';
  }

  container.innerHTML = html;
  applyBtn?.classList.remove('hidden');

  // 监听复选框
  container.querySelectorAll('.bookmark-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedBookmarks.add(e.target.dataset.id);
      } else {
        selectedBookmarks.delete(e.target.dataset.id);
      }
    });
    selectedBookmarks.add(checkbox.dataset.id);
  });
}

// 显示重复项（带标签筛选）
let currentFilterGroupFull = null;

function displayDuplicatesFull(filterGroupIndex = null, searchTerm = '') {
  const container = document.getElementById('duplicatesList');
  const removeBtn = document.getElementById('removeDuplicatesBtnFull');
  const toolbar = document.getElementById('duplicatesToolbar');

  if (duplicates.length === 0) {
    container.innerHTML = `
      <div class="empty-state-large">
        <div class="empty-icon">✓</div>
        <h3>${_t('emptyNoDuplicatesFull')}</h3>
        <p>${_t('emptyBookmarksClean')}</p>
      </div>
    `;
    removeBtn?.classList.add('hidden');
    toolbar?.classList.add('hidden');
    currentFilterGroupFull = null; // 清除筛选状态
    return;
  }

  // 安全检查：如果筛选索引超出范围，自动清除筛选
  if (filterGroupIndex !== null && (filterGroupIndex < 0 || filterGroupIndex >= duplicates.length)) {
    filterGroupIndex = null;
    currentFilterGroupFull = null;
  }

  // 根据搜索词过滤
  const term = searchTerm.toLowerCase();
  let filteredDuplicates = duplicates;
  if (term) {
    filteredDuplicates = duplicates.map(group => ({
      ...group,
      items: group.items.filter(item => {
        const title = (item.title || '').toLowerCase();
        const url = (item.url || '').toLowerCase();
        return title.includes(term) || url.includes(term);
      })
    })).filter(group => group.items.length > 0);
  }

  if (filteredDuplicates.length === 0) {
    container.innerHTML = `
      <div class="empty-state-large">
        <div class="empty-icon">🔄</div>
        <h3>${_t('emptyNoDuplicatesFull')}</h3>
        <p>${_t('emptyNoResults')}</p>
      </div>
    `;
    removeBtn?.classList.add('hidden');
    toolbar?.classList.remove('hidden');
    return;
  }

  toolbar?.classList.remove('hidden');

  let html = '';

  // 添加标签筛选区域
  if (filterGroupIndex === null) {
    html += '<div class="duplicate-filter-tags">';
    filteredDuplicates.forEach((group, index) => {
      const firstItem = group.items[0];
      const fullTitle = firstItem.title;
      const title = escapeHtml(fullTitle.substring(0, 25));
      const count = group.items.length;
      const tooltip = `标题：${fullTitle}\n网址：${firstItem.url}`;
      // 找到原始索引
      const originalIndex = term ? duplicates.findIndex(g => g.items[0].id === firstItem.id) : index;
      html += `
        <button class="filter-tag" data-group-index="${originalIndex >= 0 ? originalIndex : index}" title="${tooltip.replace(/"/g, '&quot;')}">
          <span class="filter-tag-title">${title}</span>
          <span class="filter-tag-count">(${count})</span>
        </button>
      `;
    });
    html += '</div>';
  } else {
    html += `
      <div class="duplicate-filter-info">
        <button class="btn-back-filter" data-action="clear-filter">${_t('btnBackToAll')}</button>
        <span class="filter-label">${_t('labelViewing')}${escapeHtml(filteredDuplicates[filterGroupIndex].items[0].title.substring(0, 40))}</span>
      </div>
    `;
  }

  // 确定要显示的组列表
  const groupsToShow = filterGroupIndex !== null ?
    [{...filteredDuplicates[filterGroupIndex], originalIndex: filterGroupIndex}] :
    filteredDuplicates.map((group, index) => {
      const originalIndex = term ? duplicates.findIndex(g => g.items[0].id === group.items[0].id) : index;
      return {...group, originalIndex: originalIndex >= 0 ? originalIndex : index};
    });

  groupsToShow.forEach((group, displayIndex) => {
    const actualIndex = group.originalIndex;
    let typeText = _t('duplicateSimilar');
    if (group.type === 'exact') {
      typeText = _t('duplicateExact');
    } else if (group.type === 'normalized') {
      typeText = _t('duplicateNormalized');
    }
    const similarityText = group.similarity ?
      _t('labelSimilarity', [`${(group.similarity * 100).toFixed(0)}`]) : '';

    html += `
      <div class="duplicate-group" data-group-index="${actualIndex}">
        <div class="duplicate-type">${typeText} ${similarityText}</div>
    `;

    group.items.forEach((item, idx) => {
      const showPath = currentSettings.showPath !== false;
      const pathHtml = (showPath && item.path) ?
        `<div class="bookmark-path">📁 ${escapeHtml(item.path)}</div>` : '';

      // 智能默认勾选：优先保留书签栏中的副本；若全组都在书签栏中，则保留第一个
      const nonBarItems = group.items.filter(i => !i.inBookmarksBar);
      const shouldCheck = nonBarItems.length > 0 ? !item.inBookmarksBar : (idx !== 0);

      html += `
        <div class="duplicate-item">
          <input type="checkbox" name="duplicate-${actualIndex}-${idx}"
                 value="${item.id}"
                 class="duplicate-checkbox"
                 data-id="${item.id}"
                 data-group="${actualIndex}"
                 ${shouldCheck ? 'checked' : ''}>
          <div class="bookmark-info">
            <div class="bookmark-title">${escapeHtml(item.title)}</div>
            <div class="bookmark-url">${escapeHtml(item.url)}</div>
            ${pathHtml}
          </div>
          <button class="btn-delete-single"
                  data-action="delete-single"
                  data-bookmark-id="${item.id}"
                  data-group-index="${actualIndex}"
                  data-item-index="${idx}"
                  title="${_t('tooltipDeleteBookmark')}">
            🗑️
          </button>
        </div>
      `;
    });

    html += '</div>';
  });

  container.innerHTML = html;
  removeBtn?.classList.remove('hidden');

  // 更新当前筛选状态
  currentFilterGroupFull = filterGroupIndex;

  // 绑定事件监听器（替代内联onclick）
  bindDuplicateEventsFull();
}

// 绑定重复项相关的事件监听器（完整版）
function bindDuplicateEventsFull() {
  const container = document.getElementById('duplicatesList');
  if (!container) return;
  
  // 移除旧的事件监听器（避免重复绑定）
  const newContainer = container.cloneNode(true);
  container.parentNode.replaceChild(newContainer, container);
  
  // 筛选标签点击事件（使用事件委托）
  newContainer.addEventListener('click', (e) => {
    // 筛选标签
    const filterTag = e.target.closest('.filter-tag');
    if (filterTag) {
      const groupIndex = parseInt(filterTag.dataset.groupIndex);
      filterDuplicatesFull(groupIndex);
      return;
    }
    
    // 返回全部按钮
    const backFilter = e.target.closest('[data-action="clear-filter"]');
    if (backFilter) {
      clearDuplicateFilterFull();
      return;
    }
    
    // 单个删除按钮（使用事件委托）
    const deleteBtn = e.target.closest('[data-action="delete-single"]');
    if (deleteBtn) {
      const bookmarkId = deleteBtn.dataset.bookmarkId;
      const groupIndex = parseInt(deleteBtn.dataset.groupIndex);
      const itemIndex = parseInt(deleteBtn.dataset.itemIndex);
      deleteSingleDuplicateFull(bookmarkId, groupIndex, itemIndex);
      return;
    }
  });
}

// 筛选重复项（点击标签）
function filterDuplicatesFull(groupIndex) {
  displayDuplicatesFull(groupIndex);
}

// 清除筛选，显示全部
function clearDuplicateFilterFull() {
  currentFilterGroupFull = null;
  displayDuplicatesFull(null, currentDuplicateSearch);
}

// 删除单个重复项
async function deleteSingleDuplicateFull(bookmarkId, groupIndex, itemIndex) {
  if (!confirm(_t('confirmDeleteBookmark'))) {
    return;
  }
  
  try {
    await chrome.bookmarks.remove(bookmarkId);
    showMessage(_t('msgDeleteSuccess'), 'success');
    
    // 从数据中移除该项
    const group = duplicates[groupIndex];
    if (!group) {
      console.error('组不存在:', groupIndex);
      displayDuplicatesFull(currentFilterGroupFull);
      return;
    }
    
    group.items.splice(itemIndex, 1);
    
    // 如果该组只剩一个或没有项目，从列表中移除该组
    const groupWasRemoved = group.items.length <= 1;
    if (groupWasRemoved) {
      duplicates.splice(groupIndex, 1);
      
      // 如果当前处于筛选模式，需要调整筛选索引
      if (currentFilterGroupFull !== null) {
        if (currentFilterGroupFull === groupIndex) {
          // 删除了当前筛选的组，清除筛选状态
          currentFilterGroupFull = null;
        } else if (currentFilterGroupFull > groupIndex) {
          // 删除了当前筛选组之前的组，索引需要前移
          currentFilterGroupFull--;
        }
      }
    }
    
    // 重新显示（保持当前筛选状态）
    displayDuplicatesFull(currentFilterGroupFull);
    
  } catch (error) {
    console.error('Delete failed:', error);
    showMessage(_t('msgDeleteFailed') + error.message, 'error');
  }
}

// 应用分类
async function handleApplyCategories() {
  if (selectedBookmarks.size === 0) {
    showMessage(_t('msgNoBookmarksSelected'), 'warning');
    return;
  }
  
  if (!confirm(_t('confirmApplyCategories', [`${selectedBookmarks.size}`]))) {
    return;
  }
  
  const applyBtn = document.getElementById('applyCategoriesBtnFull');
  applyBtn.disabled = true;
  applyBtn.textContent = _t('statusApplying');
  
  try {
    const moves = [];
    document.querySelectorAll('.bookmark-checkbox:checked').forEach(checkbox => {
      moves.push({
        id: checkbox.dataset.id,
        folder: checkbox.dataset.folder
      });
    });
    
    const folderGroups = {};
    for (const move of moves) {
      if (!folderGroups[move.folder]) {
        folderGroups[move.folder] = [];
      }
      folderGroups[move.folder].push(move.id);
    }
    
    let successCount = 0;
    for (const [folderName, ids] of Object.entries(folderGroups)) {
      const folder = await createCategoryFolder(folderName);
      const results = await batchMoveBookmarks(ids, folder.id);
      successCount += results.filter(r => r.success).length;
    }
    
    showMessage(_t('msgApplySuccess', [`${successCount}`]), 'success');
    
    setTimeout(() => {
      handleFullScan();
    }, 1000);
    
  } catch (error) {
    console.error('应用分类失败:', error);
    showMessage(_t('msgApplyFailed') + error.message, 'error');
  } finally {
    applyBtn.disabled = false;
    applyBtn.textContent = _t('btnApplySelectedCategories');
  }
}

// 清理重复项（支持多选）
async function handleRemoveDuplicates() {
  // 获取所有选中的复选框
  const selectedCheckboxes = document.querySelectorAll('.duplicate-checkbox:checked');
  
  if (selectedCheckboxes.length === 0) {
    showMessage(_t('msgNoDuplicatesSelected'), 'warning');
    return;
  }
  
  if (!confirm(_t('confirmRemoveDuplicates', [`${selectedCheckboxes.length}`]))) {
    return;
  }
  
  const removeBtn = document.getElementById('removeDuplicatesBtnFull');
  removeBtn.disabled = true;
  removeBtn.textContent = _t('statusDeleting');
  
  try {
    let deleteCount = 0;
    const deletedIds = new Set();
    
    // 批量删除选中的书签
    for (const checkbox of selectedCheckboxes) {
      try {
        await chrome.bookmarks.remove(checkbox.value);
        deleteCount++;
        deletedIds.add(checkbox.value);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
    
    showMessage(_t('msgRemoveSuccess', [`${deleteCount}`]), 'success');
    
    // 立即从本地数据中移除被删除的项目（关键修复）
    const groupsToRemove = [];
    
    duplicates.forEach((group, groupIndex) => {
      group.items = group.items.filter(item => !deletedIds.has(item.id));
      if (group.items.length <= 1) {
        groupsToRemove.push(groupIndex);
      }
    });
    
    // 从后往前删除空组，避免索引前移问题
    for (let i = groupsToRemove.length - 1; i >= 0; i--) {
      const groupIndex = groupsToRemove[i];
      duplicates.splice(groupIndex, 1);
      
      // 如果当前处于筛选模式，同步调整筛选索引
      if (currentFilterGroupFull !== null) {
        if (currentFilterGroupFull === groupIndex) {
          currentFilterGroupFull = null;
        } else if (currentFilterGroupFull > groupIndex) {
          currentFilterGroupFull--;
        }
      }
    }
    
    // 立即刷新页面显示
    displayDuplicatesFull(currentFilterGroupFull);
    
  } catch (error) {
    console.error('清理重复失败:', error);
    showMessage(_t('msgRemoveFailed') + error.message, 'error');
  } finally {
    removeBtn.disabled = false;
    removeBtn.textContent = _t('btnRemoveDuplicates');
  }
}

// 快速备份
async function handleQuickBackup() {
  const btn = document.getElementById('quickBackupBtn');
  btn.disabled = true;
  btn.textContent = _t('statusBackingUp');
  
  try {
    await backupBookmarks();
    await loadBackupsListFull();
    showMessage(_t('msgBackupSuccess'), 'success');
  } catch (error) {
    console.error('备份失败:', error);
    showMessage(_t('msgBackupFailed') + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = _t('btnBackupNow');
  }
}

// 创建备份
async function handleCreateBackup() {
  await handleQuickBackup();
}

// 导出备份到文件
async function handleExportBackup() {
  try {
    const result = await chrome.storage.local.get(['bookmarksBackups']);
    const backups = result.bookmarksBackups || [];
    
    if (backups.length === 0) {
      showMessage(_t('msgNoBackupToExport'), 'warning');
      return;
    }
    
    // 导出最新的备份
    const latestBackup = backups[0];
    const dataStr = JSON.stringify(latestBackup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const filename = `bookmark-backup-${new Date().toISOString().slice(0, 10)}.json`;
    
    await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true // 让用户选择保存位置
    });
    
    showMessage(_t('msgExportSuccess'), 'success');
    
  } catch (error) {
    console.error('导出失败:', error);
    showMessage(_t('msgExportFailed') + error.message, 'error');
  }
}

// 从文件导入备份
async function handleImportBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const backup = JSON.parse(text);
    
    if (!backup.data || !backup.timestamp) {
      throw new Error(_t('msgInvalidBackupFormat'));
    }
    
    if (!confirm(_t('confirmImportBackup'))) {
      return;
    }
    
    await restoreBookmarks(backup.data);
    
    // 添加到备份列表
    const result = await chrome.storage.local.get(['bookmarksBackups']);
    const backups = result.bookmarksBackups || [];
    backups.unshift(backup);
    if (backups.length > 10) backups.pop();
    await chrome.storage.local.set({ bookmarksBackups: backups });
    
    await loadBackupsListFull();
    showMessage(_t('msgImportSuccess'), 'success');
    
  } catch (error) {
    console.error('导入失败:', error);
    showMessage(_t('msgImportFailed') + error.message, 'error');
  } finally {
    event.target.value = ''; // 清空文件输入
  }
}

// 加载备份列表(完整版)
async function loadBackupsListFull() {
  const container = document.getElementById('backupsListFull');
  const result = await chrome.storage.local.get(['bookmarksBackups']);
  const backups = result.bookmarksBackups || [];
  
  if (backups.length === 0) {
    container.innerHTML = `
      <div class="empty-state-large">
        <div class="empty-icon">💾</div>
        <h3>暂无备份记录</h3>
        <p>点击"创建新备份"或"导出备份到文件"</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  backups.forEach((backup, index) => {
    const date = new Date(backup.timestamp).toLocaleString(I18n.getLocale() === 'zh_CN' ? 'zh-CN' : I18n.getLocale());
    html += `
      <div class="backup-item">
        <div class="backup-info">
          <div class="backup-date">${backup.date || date}</div>
          <div class="backup-details">${_t('labelBookmarksCountShort', [`${backup.count || 0}`])}</div>
        </div>
        <div class="backup-actions">
          <button class="btn-small btn-restore" data-action="restore-backup" data-index="${index}">
            ${_t('btnRestore')}
          </button>
          <button class="btn-small btn-delete" data-action="delete-backup" data-index="${index}">
            ${_t('btnDelete')}
          </button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// 恢复备份(完整版)
async function restoreBackupFull(index) {
  if (!confirm(_t('confirmRestoreBackup'))) {
    return;
  }
  
  try {
    const result = await chrome.storage.local.get(['bookmarksBackups']);
    const backups = result.bookmarksBackups || [];
    const backup = backups[index];
    
    if (!backup) {
      throw new Error(_t('backupNotExist'));
    }
    
    await restoreBookmarks(backup.data);
    showMessage(_t('msgRestoreSuccess'), 'success');
    await loadBackupsListFull();
    
  } catch (error) {
    console.error('恢复失败:', error);
    showMessage(_t('msgRestoreFailed') + error.message, 'error');
  }
};

// 删除备份(完整版)
async function deleteBackupFull(index) {
  if (!confirm(_t('confirmDeleteBackup'))) {
    return;
  }
  
  try {
    const result = await chrome.storage.local.get(['bookmarksBackups']);
    const backups = result.bookmarksBackups || [];
    
    backups.splice(index, 1);
    await chrome.storage.local.set({ bookmarksBackups: backups });
    
    await loadBackupsListFull();
    showMessage(_t('msgBackupDeleted'), 'success');
    
  } catch (error) {
    console.error('Delete failed:', error);
    showMessage(_t('msgDeleteFailed') + error.message, 'error');
  }
};

// 清除所有数据
async function handleClearAllData() {
  if (!confirm(_t('confirmClearData'))) {
    return;
  }
  
  try {
    await chrome.storage.local.clear();
    showMessage(_t('msgDataCleared'), 'success');
    location.reload();
  } catch (error) {
    console.error('Clear failed:', error);
    showMessage(_t('msgClearFailed') + error.message, 'error');
  }
}

// ==================== 自定义分类规则 ====================

async function loadCustomRules() {
  try {
    const result = await chrome.storage.local.get('customCategories');
    customRules = result.customCategories || [];
    displayCustomRules();
  } catch (error) {
    console.error('Load custom rules failed:', error);
  }
}

function displayCustomRules() {
  const container = document.getElementById('customRulesList');
  if (!container) return;

  if (customRules.length === 0) {
    container.innerHTML = `
      <div class="empty-state-large" style="padding: 30px 10px;">
        <div class="empty-icon" style="font-size: 36px;">📝</div>
        <p>${_t('emptyNoCustomRules')}</p>
      </div>
    `;
    return;
  }

  let html = '';
  customRules.forEach((rule, index) => {
    const keywordsTags = (rule.keywords || []).map(k =>
      `<span class="rule-tag">${escapeHtml(k)}</span>`
    ).join('');
    const domainsTags = (rule.domains || []).map(d =>
      `<span class="rule-tag domain">${escapeHtml(d)}</span>`
    ).join('');

    html += `
      <div class="custom-rule-item">
        <div class="rule-info">
          <div class="rule-name">${escapeHtml(rule.name)}</div>
          <div class="rule-tags">
            ${keywordsTags}
            ${domainsTags}
          </div>
        </div>
        <div class="rule-actions">
          <button class="btn-small btn-edit" data-action="edit-rule" data-index="${index}">
            ${_t('btnEdit')}
          </button>
          <button class="btn-small btn-delete-rule" data-action="delete-rule" data-index="${index}">
            ${_t('btnDelete')}
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function showAddRuleForm() {
  document.getElementById('editingRuleIndex').value = '';
  document.getElementById('ruleNameInput').value = '';
  document.getElementById('ruleKeywordsInput').value = '';
  document.getElementById('ruleDomainsInput').value = '';
  document.getElementById('customRuleForm').classList.remove('hidden');
  document.getElementById('addRuleBtn').classList.add('hidden');
  document.getElementById('ruleNameInput').focus();
}

function showEditRuleForm(index) {
  const rule = customRules[index];
  if (!rule) return;

  document.getElementById('editingRuleIndex').value = index;
  document.getElementById('ruleNameInput').value = rule.name || '';
  document.getElementById('ruleKeywordsInput').value = (rule.keywords || []).join(', ');
  document.getElementById('ruleDomainsInput').value = (rule.domains || []).join(', ');
  document.getElementById('customRuleForm').classList.remove('hidden');
  document.getElementById('addRuleBtn').classList.add('hidden');
  document.getElementById('ruleNameInput').focus();
}

function hideRuleForm() {
  document.getElementById('customRuleForm').classList.add('hidden');
  document.getElementById('addRuleBtn').classList.remove('hidden');
}

async function saveCustomRule() {
  const name = document.getElementById('ruleNameInput').value.trim();
  const keywordsStr = document.getElementById('ruleKeywordsInput').value.trim();
  const domainsStr = document.getElementById('ruleDomainsInput').value.trim();
  const editingIndex = document.getElementById('editingRuleIndex').value;

  // 验证
  if (!name) {
    showMessage(_t('msgRuleNameRequired'), 'error');
    return;
  }
  if (!keywordsStr && !domainsStr) {
    showMessage(_t('msgRuleKeywordsOrDomainsRequired'), 'error');
    return;
  }

  const keywords = keywordsStr
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const domains = domainsStr
    .split(/[,，]/)
    .map(s => s.trim().replace(/^https?:\/\//, '').replace(/^www\./, ''))
    .filter(s => s.length > 0);

  const rule = {
    name,
    keywords,
    domains
  };

  if (editingIndex !== '') {
    customRules[parseInt(editingIndex)] = rule;
  } else {
    customRules.push(rule);
  }

  await chrome.storage.local.set({ customCategories: customRules });

  // 刷新分类规则（因为自定义规则已合并到分类引擎中）
  await loadCategories();

  displayCustomRules();
  hideRuleForm();
  showMessage(_t('msgRuleSaved'), 'success');
}

async function deleteCustomRule(index) {
  if (!confirm(_t('confirmDeleteRule'))) {
    return;
  }

  customRules.splice(index, 1);
  await chrome.storage.local.set({ customCategories: customRules });

  // 刷新分类规则
  await loadCategories();

  displayCustomRules();
  showMessage(_t('msgRuleDeleted'), 'success');
}

// 显示消息
function showMessage(text, type = 'info') {
  const messageBox = document.getElementById('messageBox');
  messageBox.textContent = text;
  messageBox.className = `message-box ${type}`;
  messageBox.classList.remove('hidden');

  setTimeout(() => {
    messageBox.classList.add('hidden');
  }, 3000);
}

// ==================== 更新检测 ====================

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const a = parts1[i] || 0;
    const b = parts2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

function decodeBase64Content(content) {
  const cleaned = content.replace(/\n/g, '');
  try {
    return atob(cleaned);
  } catch (e) {
    throw new Error('Failed to decode content');
  }
}

function extractChangelogForVersion(changelogText, version) {
  const lines = changelogText.split('\n');
  let capturing = false;
  const result = [];

  for (const line of lines) {
    if (line.startsWith(`## [${version}]`)) {
      capturing = true;
      continue;
    }
    if (capturing && line.startsWith('## [')) {
      break;
    }
    if (capturing) {
      result.push(line);
    }
  }

  while (result.length > 0 && result[0].trim() === '') {
    result.shift();
  }
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop();
  }

  return result.join('\n');
}

function markdownToHtml(text) {
  if (!text) return '';
  let html = text
    .replace(/^### (.*$)/gim, '<h5>$1</h5>')
    .replace(/^## (.*$)/gim, '<h4>$1</h4>')
    .replace(/^# (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/<br><br>/g, '<br>');
  return html;
}

async function checkForUpdates() {
  const btn = document.getElementById('checkUpdateBtn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = _t('msgCheckingUpdate');

  try {
    const manifestUrl = 'https://api.github.com/repos/cheechang/BookmarkOrganizer/contents/manifest.json';
    const manifestResp = await fetch(manifestUrl);
    if (!manifestResp.ok) {
      throw new Error(`HTTP ${manifestResp.status}`);
    }
    const manifestData = await manifestResp.json();
    const manifestContent = decodeBase64Content(manifestData.content);
    const remoteManifest = JSON.parse(manifestContent);
    const latestVersion = remoteManifest.version;

    const currentVersion = chrome.runtime.getManifest().version;
    const comparison = compareVersions(latestVersion, currentVersion);

    if (comparison > 0) {
      let changelogHtml = '';
      try {
        const changelogUrl = 'https://api.github.com/repos/cheechang/BookmarkOrganizer/contents/CHANGELOG.md';
        const changelogResp = await fetch(changelogUrl);
        if (changelogResp.ok) {
          const changelogData = await changelogResp.json();
          const changelogContent = decodeBase64Content(changelogData.content);
          const changelogText = extractChangelogForVersion(changelogContent, latestVersion);
          changelogHtml = markdownToHtml(changelogText);
        }
      } catch (changelogErr) {
        console.error('Failed to load changelog:', changelogErr);
      }

      showUpdateModal(currentVersion, latestVersion, changelogHtml);
    } else {
      showMessage(_t('msgUpToDate'), 'success');
    }
  } catch (error) {
    console.error('Update check failed:', error);
    showMessage(_t('msgCheckUpdateFailed', [error.message]), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function showUpdateModal(currentVersion, latestVersion, changelogHtml) {
  const backdrop = document.getElementById('updateModalBackdrop');
  const currentVerEl = document.getElementById('updateCurrentVersion');
  const latestVerEl = document.getElementById('updateLatestVersion');
  const changelogEl = document.getElementById('updateChangelogContent');

  currentVerEl.textContent = _t('updateCurrentVersion', [currentVersion]);
  latestVerEl.textContent = _t('updateLatestVersion', [latestVersion]);
  changelogEl.innerHTML = changelogHtml || '<p style="color:#a0aec0;font-style:italic;">No changelog available.</p>';

  backdrop.classList.remove('hidden');
  backdrop.dataset.latestVersion = latestVersion;
}

function closeUpdateModal() {
  document.getElementById('updateModalBackdrop').classList.add('hidden');
}

// Modal event listeners
document.getElementById('closeUpdateModal')?.addEventListener('click', closeUpdateModal);
document.getElementById('cancelUpdateBtn')?.addEventListener('click', closeUpdateModal);
document.getElementById('goDownloadBtn')?.addEventListener('click', () => {
  const version = document.getElementById('updateModalBackdrop').dataset.latestVersion;
  if (version) {
    chrome.tabs.create({
      url: `https://github.com/cheechang/BookmarkOrganizer/releases/tag/v${version}`
    });
  }
  closeUpdateModal();
});
document.getElementById('updateModalBackdrop')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    closeUpdateModal();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.getElementById('updateModalBackdrop').classList.contains('hidden')) {
    closeUpdateModal();
  }
});

// ==================== 失效链接检测 ====================

let brokenLinksResults = [];
let brokenLinksSort = { field: null, direction: 'asc' };
let brokenLinksSearchTerm = '';

function getFriendlyError(item) {
  if (item.statusCode === 404) return _t('errorHttp404');
  if (item.statusCode === 410) return _t('errorHttp410');
  if (item.statusCode && item.statusCode >= 500) return _t('errorServerError');
  if (item.status === 'timeout') return _t('errorTimeout');
  const err = (item.error || '').toLowerCase();
  if (err.includes('network') || err.includes('dns') || err.includes('connection refused') || err.includes('failed to fetch')) {
    return _t('errorNetwork');
  }
  return _t('errorUnknown');
}

async function handleCheckBrokenLinks() {
  const btn = document.getElementById('checkBrokenLinksBtn');
  const progressContainer = document.getElementById('brokenLinksProgressContainer');
  const progressFill = document.getElementById('brokenLinksProgressFill');
  const progressText = document.getElementById('brokenLinksProgressText');
  const statsPanel = document.getElementById('brokenLinksStatsPanel');

  btn.disabled = true;
  progressContainer.classList.remove('hidden');
  statsPanel.classList.add('hidden');
  progressFill.style.width = '0%';
  progressText.textContent = _t('progressCheckingLinks');

  try {
    // 自动备份
    const settingsResult = await chrome.storage.local.get('settings');
    if (settingsResult.settings?.autoBackup) {
      progressText.textContent = _t('progressAutoBackup');
      await backupBookmarks();
      await loadBackupsListFull();
    }

    // 获取所有书签
    const bookmarks = await getAllBookmarks();
    progressText.textContent = _t('progressCheckingLinks');

    // 检测失效链接
    brokenLinksResults = await checkBrokenLinks(bookmarks, (current, total) => {
      const progress = (current / total) * 100;
      progressFill.style.width = `${progress}%`;
      progressText.textContent = _t('checkingItem', [`${current}`, `${total}`]);
    }, 3);

    // 显示统计
    statsPanel.classList.remove('hidden');
    document.getElementById('brokenLinksCount').textContent = brokenLinksResults.length;

    // 显示结果
    brokenLinksSearchTerm = '';
    const searchInput = document.getElementById('brokenLinksSearchInput');
    if (searchInput) searchInput.value = '';
    displayBrokenLinks();

    if (brokenLinksResults.length > 0) {
      showMessage(_t('msgCheckComplete', [`${brokenLinksResults.length}`]), 'warning');
    } else {
      showMessage(_t('msgCheckComplete', ['0']), 'success');
    }
  } catch (error) {
    console.error('Broken links check failed:', error);
    showMessage(_t('msgCheckFailed') + error.message, 'error');
  } finally {
    btn.disabled = false;
    setTimeout(() => {
      progressContainer.classList.add('hidden');
    }, 1500);
  }
}

function displayBrokenLinks() {
  const container = document.getElementById('brokenLinksList');
  const toolbar = document.getElementById('brokenLinksToolbar');
  const deleteBtn = document.getElementById('deleteBrokenLinksBtn');

  // 过滤
  let filtered = brokenLinksResults;
  if (brokenLinksSearchTerm) {
    filtered = brokenLinksResults.filter(item => {
      const title = (item.bookmark.title || '').toLowerCase();
      const url = (item.bookmark.url || '').toLowerCase();
      return title.includes(brokenLinksSearchTerm) || url.includes(brokenLinksSearchTerm);
    });
  }

  // 排序
  if (brokenLinksSort.field) {
    filtered = [...filtered].sort((a, b) => {
      let valA, valB;
      switch (brokenLinksSort.field) {
        case 'title': valA = a.bookmark.title || ''; valB = b.bookmark.title || ''; break;
        case 'url': valA = a.bookmark.url || ''; valB = b.bookmark.url || ''; break;
        case 'status': valA = a.status || ''; valB = b.status || ''; break;
        case 'code': valA = a.statusCode || 0; valB = b.statusCode || 0; break;
        case 'error': valA = getFriendlyError(a); valB = getFriendlyError(b); break;
        case 'time': valA = a.checkedAt || ''; valB = b.checkedAt || ''; break;
        default: return 0;
      }
      if (typeof valA === 'number') {
        return brokenLinksSort.direction === 'asc' ? valA - valB : valB - valA;
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return brokenLinksSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return brokenLinksSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (brokenLinksResults.length === 0) {
    container.innerHTML = `
      <div class="empty-state-large">
        <div class="empty-icon">✓</div>
        <h3>${_t('emptyNoBrokenLinks')}</h3>
        <p>${_t('emptyClickCheck')}</p>
      </div>
    `;
    toolbar?.classList.add('hidden');
    deleteBtn?.classList.add('hidden');
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-large">
        <div class="empty-icon">🔍</div>
        <h3>${_t('emptyNoResults')}</h3>
      </div>
    `;
    toolbar?.classList.add('hidden');
    deleteBtn?.classList.add('hidden');
    return;
  }

  toolbar?.classList.remove('hidden');
  deleteBtn?.classList.remove('hidden');

  function sortIndicator(field) {
    if (brokenLinksSort.field !== field) return '';
    return brokenLinksSort.direction === 'asc' ? ' ▲' : ' ▼';
  }

  let html = '<div class="broken-links-table">';
  html += `
    <div class="broken-links-header">
      <div class="bl-col-check"></div>
      <div class="bl-col-title bl-sortable" data-sort="title">${_t('labelTitle')}${sortIndicator('title')}</div>
      <div class="bl-col-url bl-sortable" data-sort="url">${_t('labelUrl')}${sortIndicator('url')}</div>
      <div class="bl-col-status bl-sortable" data-sort="status">${_t('labelStatus')}${sortIndicator('status')}</div>
      <div class="bl-col-code bl-sortable" data-sort="code">${_t('labelCode')}${sortIndicator('code')}</div>
      <div class="bl-col-error bl-sortable" data-sort="error">${_t('labelError')}${sortIndicator('error')}</div>
      <div class="bl-col-time bl-sortable" data-sort="time">${_t('labelCheckedAt')}${sortIndicator('time')}</div>
    </div>
  `;

  for (const item of filtered) {
    const statusClass = `status-${item.status}`;
    const statusText = {
      'broken': _t('statusBroken'),
      'timeout': _t('statusTimeout'),
      'error': _t('statusError')
    }[item.status] || item.status;
    const friendlyError = getFriendlyError(item);

    html += `
      <div class="broken-links-row">
        <div class="bl-col-check">
          <input type="checkbox" class="broken-link-checkbox" data-id="${item.bookmark.id}" checked>
        </div>
        <div class="bl-col-title" title="${escapeHtml(item.bookmark.title)}">${escapeHtml(item.bookmark.title)}</div>
        <div class="bl-col-url" title="${escapeHtml(item.bookmark.url)}">${escapeHtml(item.bookmark.url)}</div>
        <div class="bl-col-status"><span class="status-badge ${statusClass}">${statusText}</span></div>
        <div class="bl-col-code">${item.statusCode || '-'}</div>
        <div class="bl-col-error" title="${escapeHtml(friendlyError)}">${escapeHtml(friendlyError)}</div>
        <div class="bl-col-time">${item.checkedAt}</div>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;

  // 绑定排序点击事件
  container.querySelectorAll('.bl-sortable').forEach(el => {
    el.addEventListener('click', () => {
      const field = el.dataset.sort;
      if (brokenLinksSort.field === field) {
        brokenLinksSort.direction = brokenLinksSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        brokenLinksSort.field = field;
        brokenLinksSort.direction = 'asc';
      }
      displayBrokenLinks();
    });
  });
}

async function handleDeleteBrokenLinks() {
  const checkboxes = document.querySelectorAll('.broken-link-checkbox:checked');
  if (checkboxes.length === 0) {
    showMessage(_t('msgNoSelection'), 'warning');
    return;
  }

  if (!confirm(_t('confirmDeleteBroken', [`${checkboxes.length}`]))) {
    return;
  }

  try {
    // 先备份
    const settingsResult = await chrome.storage.local.get('settings');
    if (settingsResult.settings?.autoBackup) {
      await backupBookmarks();
    }

    const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
    let deleted = 0;
    for (const id of ids) {
      try {
        await chrome.bookmarks.remove(id);
        deleted++;
      } catch (e) {
        console.error('Failed to delete bookmark:', id, e);
      }
    }

    // 从结果中移除已删除的
    brokenLinksResults = brokenLinksResults.filter(r => !ids.includes(r.bookmark.id));
    displayBrokenLinks();

    // 更新统计
    document.getElementById('brokenLinksCount').textContent = brokenLinksResults.length;

    showMessage(_t('msgDeletedCount', [`${deleted}`]), 'success');
  } catch (error) {
    console.error('Delete broken links failed:', error);
    showMessage(_t('msgDeleteFailed') + error.message, 'error');
  }
}


