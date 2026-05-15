// 弹窗主逻辑

import { I18n, _t } from './i18n.js';
import { escapeHtml } from './shared.js';
import { getAllBookmarks, analyzeBookmark, checkBrokenLinks } from './bookmark-scanner.js';
import { createCategoryFolder, batchMoveBookmarks } from './category-manager.js';
import { detectDuplicates } from './duplicate-detector.js';
import { backupBookmarks, restoreBookmarks, exportBookmarksToHTML, exportBookmarksToJSON, importBookmarksFromHTML } from './backup-manager.js';
import { logger } from './logger.js';

let categories = [];
let analysisResults = [];
let duplicates = [];
let selectedBookmarks = new Set();
let currentSettings = {};
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
    const moon = toggle.querySelector('.icon-moon');
    const sun = toggle.querySelector('.icon-sun');
    if (moon) moon.style.display = theme === 'dark' ? 'none' : 'block';
    if (sun) sun.style.display = theme === 'dark' ? 'block' : 'none';
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
  setupEventListeners();
  await loadBackupsList();
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
    displayCategories(currentCategorySearch);
  }
  if (duplicates.length > 0) {
    displayDuplicates(currentFilterGroup, currentDuplicateSearch);
  }
  loadBackupsList();
  if (brokenLinksResults.length > 0) {
    displayBrokenLinksPopup();
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
    console.error('加载分类规则失败:', error);
    showMessage(_t('msgLoadCategoriesFailed'), 'error');
  }
}

// 加载设置
async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  const settings = result.settings || {};
  currentSettings = settings;
  
  const autoBackupToggle = document.getElementById('autoBackupToggle');
  autoBackupToggle.checked = settings.autoBackup !== false;
  
  autoBackupToggle.addEventListener('change', async (e) => {
    settings.autoBackup = e.target.checked;
    await chrome.storage.local.set({ settings });
    showMessage(_t('msgSettingsSaved'), 'success');
  });
}

// 设置事件监听
function setupEventListeners() {
  // 扫描按钮
  document.getElementById('scanBtn').addEventListener('click', handleScan);

  // 备份按钮
  document.getElementById('backupBtn').addEventListener('click', handleBackup);

  // 导出备份按钮（popup版）
  document.getElementById('exportBackupBtnPopup')?.addEventListener('click', handleExportBackupPopup);

  // 导入HTML书签（popup版）
  document.getElementById('importFileInputPopup')?.addEventListener('change', handleImportFilePopup);

  // 应用分类按钮
  document.getElementById('applyCategoriesBtn').addEventListener('click', handleApplyCategories);

  // 清理重复按钮
  document.getElementById('removeDuplicatesBtn').addEventListener('click', handleRemoveDuplicates);

  // 深色模式切换
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // 检查更新
  document.getElementById('checkUpdateBtn')?.addEventListener('click', checkForUpdates);

  // 搜索框
  document.getElementById('categoriesSearch')?.addEventListener('input', (e) => {
    currentCategorySearch = e.target.value.trim().toLowerCase();
    displayCategories(currentCategorySearch);
  });
  document.getElementById('duplicatesSearch')?.addEventListener('input', (e) => {
    currentDuplicateSearch = e.target.value.trim().toLowerCase();
    displayDuplicates(currentFilterGroup, currentDuplicateSearch);
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

  // 标签页切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.currentTarget.dataset.tab;
      switchTab(tabName);
    });
  });

  // 备份列表事件委托（替代内联onclick）
  document.getElementById('backupsList').addEventListener('click', (e) => {
    const restoreBtn = e.target.closest('[data-action="restore-backup"]');
    if (restoreBtn) {
      restoreBackup(parseInt(restoreBtn.dataset.index));
      return;
    }

    const deleteBtn = e.target.closest('[data-action="delete-backup"]');
    if (deleteBtn) {
      deleteBackup(parseInt(deleteBtn.dataset.index));
      return;
    }
  });

  // 失效链接检测按钮
  document.getElementById('checkBrokenLinksBtnPopup')?.addEventListener('click', handleCheckBrokenLinksPopup);
  document.getElementById('selectAllBrokenBtnPopup')?.addEventListener('click', () => {
    document.querySelectorAll('.broken-link-checkbox').forEach(cb => cb.checked = true);
  });
  document.getElementById('deselectAllBrokenBtnPopup')?.addEventListener('click', () => {
    document.querySelectorAll('.broken-link-checkbox').forEach(cb => cb.checked = false);
  });
  document.getElementById('deleteBrokenLinksBtnPopup')?.addEventListener('click', handleDeleteBrokenLinksPopup);

  // 失效链接搜索和排序
  const brokenLinksSearchInputPopup = document.getElementById('brokenLinksSearchInputPopup');
  if (brokenLinksSearchInputPopup) {
    brokenLinksSearchInputPopup.addEventListener('input', (e) => {
      brokenLinksSearchTermPopup = e.target.value.trim().toLowerCase();
      displayBrokenLinksPopup();
    });
  }
  const brokenLinksSortSelect = document.getElementById('brokenLinksSortPopup');
  if (brokenLinksSortSelect) {
    brokenLinksSortSelect.addEventListener('change', (e) => {
      const field = e.target.value;
      if (!field) {
        brokenLinksSortPopup = { field: null, direction: 'asc' };
      } else if (brokenLinksSortPopup.field === field) {
        brokenLinksSortPopup.direction = brokenLinksSortPopup.direction === 'asc' ? 'desc' : 'asc';
      } else {
        brokenLinksSortPopup = { field, direction: 'asc' };
      }
      displayBrokenLinksPopup();
    });
  }

  // 滚动辅助按钮
  initScrollAssist('.scrollable-content');
}

// 滚动辅助按钮初始化
function initScrollAssist(scrollSelector) {
  const scrollBtn = document.getElementById('scrollAssistBtn');
  if (!scrollBtn) return;

  const scrollContainer = document.querySelector(scrollSelector) || window;
  const scrollEl = scrollContainer === window ? document.documentElement : scrollContainer;

  function updateScrollBtn() {
    const scrollTop = scrollEl.scrollTop || window.scrollY || 0;
    const scrollHeight = scrollEl.scrollHeight || document.documentElement.scrollHeight;
    const clientHeight = scrollEl.clientHeight || window.innerHeight;

    if (scrollHeight <= clientHeight + 10) {
      scrollBtn.classList.add('hidden');
      return;
    }

    scrollBtn.classList.remove('hidden');
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 50;

    if (nearBottom) {
      scrollBtn.innerHTML = '▲';
      scrollBtn.title = _t('btnScrollToTop');
      scrollBtn.dataset.direction = 'top';
    } else {
      scrollBtn.innerHTML = '▼';
      scrollBtn.title = _t('btnScrollToBottom');
      scrollBtn.dataset.direction = 'bottom';
    }
  }

  scrollBtn.addEventListener('click', () => {
    if (scrollBtn.dataset.direction === 'top') {
      scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
    }
  });

  scrollContainer.addEventListener('scroll', updateScrollBtn, { passive: true });
  window.addEventListener('resize', updateScrollBtn, { passive: true });

  // 延迟初始化，等待内容渲染
  setTimeout(updateScrollBtn, 300);
}

// 处理扫描
async function handleScan() {
  const scanBtn = document.getElementById('scanBtn');
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
      await loadBackupsList();
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
      
      // 更新进度
      const progress = ((i + 1) / total) * 100;
      progressFill.style.width = `${progress}%`;
      progressText.textContent = _t('progressAnalyzingItem', [`${i + 1}`, `${total}`]);
      
      // 每处理10个让出控制权,避免阻塞UI
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
    displayCategories(currentCategorySearch);

    // 显示重复项
    displayDuplicates(currentFilterGroup, currentDuplicateSearch);
    
    progressText.textContent = _t('progressComplete');
    showMessage(_t('msgScanComplete', [`${total}`]), 'success');
    
  } catch (error) {
    console.error('扫描失败:', error);
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
  
  document.getElementById('duplicatesCount').textContent = duplicateCount;
}

// 显示分类建议
function displayCategories(searchTerm = '') {
  const container = document.getElementById('categoriesList');
  const applyBtn = document.getElementById('applyCategoriesBtn');
  const toolbar = document.getElementById('categoriesToolbar');

  // 按分类分组
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
  for (const catName of Object.keys(grouped)) {
    if (grouped[catName].length === 0) {
      delete grouped[catName];
    }
  }

  // 清空之前的选择状态
  selectedBookmarks.clear();

  if (Object.keys(grouped).length === 0) {
    container.innerHTML = `<p class="empty-state">${term ? _t('emptyNoResults') : _t('emptyNoCategories')}</p>`;
    applyBtn.classList.add('hidden');
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
  applyBtn.classList.remove('hidden');

  // 监听复选框变化
  container.querySelectorAll('.bookmark-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedBookmarks.add(e.target.dataset.id);
      } else {
        selectedBookmarks.delete(e.target.dataset.id);
      }
    });

    // 初始化选中状态
    selectedBookmarks.add(checkbox.dataset.id);
  });
}

// 显示重复项（带标签筛选）
let currentFilterGroup = null; // 当前筛选的组索引，null表示显示全部

function displayDuplicates(filterGroupIndex = null, searchTerm = '') {
  const container = document.getElementById('duplicatesList');
  const removeBtn = document.getElementById('removeDuplicatesBtn');
  const toolbar = document.getElementById('duplicatesToolbar');

  if (duplicates.length === 0) {
    container.innerHTML = `<p class="empty-state">${_t('emptyNoDuplicates')}</p>`;
    removeBtn.classList.add('hidden');
    toolbar?.classList.add('hidden');
    currentFilterGroup = null; // 清除筛选状态
    return;
  }

  // 安全检查：如果筛选索引超出范围，自动清除筛选
  if (filterGroupIndex !== null && (filterGroupIndex < 0 || filterGroupIndex >= duplicates.length)) {
    filterGroupIndex = null;
    currentFilterGroup = null;
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
    container.innerHTML = `<p class="empty-state">${_t('emptyNoResults')}</p>`;
    removeBtn.classList.add('hidden');
    toolbar?.classList.remove('hidden');
    return;
  }

  toolbar?.classList.remove('hidden');

  let html = '';

  // 添加重复类型说明
  html += `
    <div class="duplicates-legend">
      <div class="legend-item legend-exact">
        <span class="legend-dot"></span>
        <div class="legend-text">
          <span class="legend-label">${_t('duplicateExact')}</span>
          <span class="legend-desc">${_t('duplicateExactDesc')}</span>
        </div>
      </div>
      <div class="legend-item legend-similar">
        <span class="legend-dot"></span>
        <div class="legend-text">
          <span class="legend-label">${_t('duplicateSimilar')}</span>
          <span class="legend-desc">${_t('duplicateSimilarDesc')}</span>
        </div>
      </div>
      <div class="legend-item legend-normalized">
        <span class="legend-dot"></span>
        <div class="legend-text">
          <span class="legend-label">${_t('duplicateNormalized')}</span>
          <span class="legend-desc">${_t('duplicateNormalizedDesc')}</span>
        </div>
      </div>
    </div>
  `;

  // 添加标签筛选区域（仅在未筛选时显示）
  if (filterGroupIndex === null) {
    html += '<div class="duplicate-filter-tags">';
    filteredDuplicates.forEach((group, index) => {
      const firstItem = group.items[0];
      const fullTitle = firstItem.title;
      const title = escapeHtml(fullTitle.substring(0, 20));
      const count = group.items.length;
      const tooltip = `标题：${fullTitle}\n网址：${firstItem.url}`;
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
    // 显示返回按钮和当前筛选信息
    html += `
      <div class="duplicate-filter-info">
        <button class="btn-back-filter" data-action="clear-filter">${_t('btnBackToAll')}</button>
        <span class="filter-label">${_t('labelViewing')}${escapeHtml(filteredDuplicates[filterGroupIndex].items[0].title.substring(0, 30))}</span>
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
      // Note: path is translated in utils.js via _t('bookmarksBar') / _t('unknownPath')

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
  removeBtn.classList.remove('hidden');

  // 更新当前筛选状态
  currentFilterGroup = filterGroupIndex;

  // 绑定事件监听器（替代内联onclick）
  bindDuplicateEvents();
}

// 绑定重复项相关的事件监听器
function bindDuplicateEvents() {
  const container = document.getElementById('duplicatesList');
  
  // 克隆节点以移除旧的事件监听器（避免重复绑定）
  const newContainer = container.cloneNode(true);
  container.parentNode.replaceChild(newContainer, container);
  
  // 筛选标签点击事件（使用事件委托）
  newContainer.addEventListener('click', (e) => {
    // 筛选标签
    const filterTag = e.target.closest('.filter-tag');
    if (filterTag) {
      const groupIndex = parseInt(filterTag.dataset.groupIndex);
      filterDuplicates(groupIndex);
      return;
    }
    
    // 返回全部按钮
    const backFilter = e.target.closest('[data-action="clear-filter"]');
    if (backFilter) {
      clearDuplicateFilter();
      return;
    }
    
    // 单个删除按钮（使用事件委托）
    const deleteBtn = e.target.closest('[data-action="delete-single"]');
    if (deleteBtn) {
      const bookmarkId = deleteBtn.dataset.bookmarkId;
      const groupIndex = parseInt(deleteBtn.dataset.groupIndex);
      const itemIndex = parseInt(deleteBtn.dataset.itemIndex);
      deleteSingleDuplicate(bookmarkId, groupIndex, itemIndex);
      return;
    }
  });
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
  
  const applyBtn = document.getElementById('applyCategoriesBtn');
  applyBtn.disabled = true;
  applyBtn.textContent = _t('statusApplying');
  
  try {
    // 收集需要移动的书签
    const moves = [];
    document.querySelectorAll('.bookmark-checkbox:checked').forEach(checkbox => {
      moves.push({
        id: checkbox.dataset.id,
        folder: checkbox.dataset.folder
      });
    });
    
    // 按文件夹分组
    const folderGroups = {};
    for (const move of moves) {
      if (!folderGroups[move.folder]) {
        folderGroups[move.folder] = [];
      }
      folderGroups[move.folder].push(move.id);
    }
    
    // 执行移动
    let successCount = 0;
    for (const [folderName, ids] of Object.entries(folderGroups)) {
      // 创建或获取文件夹
      const folder = await createCategoryFolder(folderName);
      
      // 批量移动
      const results = await batchMoveBookmarks(ids, folder.id);
      successCount += results.filter(r => r.success).length;
    }
    
    showMessage(_t('msgApplySuccess', [`${successCount}`]), 'success');
    
    // 重新扫描
    setTimeout(() => {
      handleScan();
    }, 1000);
    
  } catch (error) {
    console.error('应用分类失败:', error);
    showMessage(_t('msgApplyFailed') + error.message, 'error');
  } finally {
    applyBtn.disabled = false;
    applyBtn.textContent = _t('btnApplyCategories');
  }
}

// 筛选重复项（点击标签）
function filterDuplicates(groupIndex) {
  displayDuplicates(groupIndex);
}

// 清除筛选，显示全部
function clearDuplicateFilter() {
  currentFilterGroup = null;
  displayDuplicates(null, currentDuplicateSearch);
}

// 删除单个重复项
async function deleteSingleDuplicate(bookmarkId, groupIndex, itemIndex) {
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
      displayDuplicates(currentFilterGroup);
      return;
    }
    
    group.items.splice(itemIndex, 1);
    
    // 如果该组只剩一个或没有项目，从列表中移除该组
    const groupWasRemoved = group.items.length <= 1;
    if (groupWasRemoved) {
      duplicates.splice(groupIndex, 1);
      
      // 如果当前处于筛选模式，需要调整筛选索引
      if (currentFilterGroup !== null) {
        if (currentFilterGroup === groupIndex) {
          // 删除了当前筛选的组，清除筛选状态
          currentFilterGroup = null;
        } else if (currentFilterGroup > groupIndex) {
          // 删除了当前筛选组之前的组，索引需要前移
          currentFilterGroup--;
        }
      }
    }
    
    // 重新显示（保持当前筛选状态）
    displayDuplicates(currentFilterGroup);
    
  } catch (error) {
    console.error('Delete failed:', error);
    showMessage(_t('msgDeleteFailed') + error.message, 'error');
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
  
  const removeBtn = document.getElementById('removeDuplicatesBtn');
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
        console.error('删除失败:', error);
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
      if (currentFilterGroup !== null) {
        if (currentFilterGroup === groupIndex) {
          currentFilterGroup = null;
        } else if (currentFilterGroup > groupIndex) {
          currentFilterGroup--;
        }
      }
    }
    
    // 立即刷新页面显示
    displayDuplicates(currentFilterGroup);
    
  } catch (error) {
    console.error('清理重复失败:', error);
    showMessage(_t('msgRemoveFailed') + error.message, 'error');
  } finally {
    removeBtn.disabled = false;
    removeBtn.textContent = _t('btnRemoveDuplicates');
  }
}

// 处理备份
async function handleBackup() {
  const backupBtn = document.getElementById('backupBtn');
  backupBtn.disabled = true;
  backupBtn.textContent = '备份中...';
  
  try {
    await backupBookmarks();
    await loadBackupsList();
    showMessage(_t('msgBackupSuccess'), 'success');
  } catch (error) {
    console.error('备份失败:', error);
    showMessage(_t('msgBackupFailed') + error.message, 'error');
  } finally {
    backupBtn.disabled = false;
    backupBtn.textContent = _t('btnBackup');
  }
}

// 导出备份（popup版）
async function handleExportBackupPopup() {
  try {
    const format = document.getElementById('exportFormatSelectPopup')?.value || 'json';
    let blob, filename;

    if (format === 'html') {
      const htmlContent = await exportBookmarksToHTML();
      blob = new Blob([htmlContent], { type: 'text/html' });
      filename = `bookmarks-${new Date().toISOString().slice(0, 10)}.html`;
    } else {
      const result = await chrome.storage.local.get(['bookmarksBackups']);
      const backups = result.bookmarksBackups || [];
      if (backups.length === 0) {
        showMessage(_t('msgNoBackupToExport'), 'warning');
        return;
      }
      const dataStr = JSON.stringify(backups[0], null, 2);
      blob = new Blob([dataStr], { type: 'application/json' });
      filename = `bookmark-backup-${new Date().toISOString().slice(0, 10)}.json`;
    }

    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({ url, filename, saveAs: true });
    showMessage(format === 'html' ? _t('msgExportHTMLSuccess') : _t('msgExportSuccess'), 'success');
  } catch (error) {
    console.error('Export failed:', error);
    const format = document.getElementById('exportFormatSelectPopup')?.value || 'json';
    showMessage((format === 'html' ? _t('msgExportHTMLFailed') : _t('msgExportFailed')) + error.message, 'error');
  }
}

// 导入文件（popup版，自动识别 .json / .html / .htm）
async function handleImportFilePopup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();

  try {
    if (ext === 'json') {
      showMessage(_t('msgParsingBookmarkFile'), 'info');
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data || !backup.timestamp) {
        throw new Error(_t('msgInvalidBackupFormat'));
      }

      const result = await chrome.storage.local.get(['bookmarksBackups']);
      const backups = result.bookmarksBackups || [];
      backups.unshift(backup);
      if (backups.length > 10) backups.pop();
      await chrome.storage.local.set({ bookmarksBackups: backups });

      await loadBackupsList();
      showMessage(_t('msgImportSuccess'), 'success');
    } else if (ext === 'html' || ext === 'htm') {
      showMessage(_t('msgParsingBookmarkFile'), 'info');
      const htmlContent = await file.text();
      const result = await importBookmarksFromHTML(htmlContent, 'merge');
      showMessage(_t('msgImportHTMLSuccess', [`${result.count}`]), 'success');
    } else {
      showMessage(_t('msgUnsupportedFileType') + ` (.${ext})`, 'error');
    }
  } catch (error) {
    console.error('Import failed:', error);
    if (ext === 'json') {
      showMessage(_t('msgImportFailed') + error.message, 'error');
    } else {
      showMessage(_t('msgImportHTMLFailed') + error.message, 'error');
    }
  } finally {
    event.target.value = '';
  }
}

// 加载备份列表
async function loadBackupsList() {
  const container = document.getElementById('backupsList');
  const result = await chrome.storage.local.get(['bookmarksBackups']);
  const backups = result.bookmarksBackups || [];
  
  if (backups.length === 0) {
    container.innerHTML = `<p class="empty-state">${_t('emptyNoBackups')}</p>`;
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

// 恢复备份
async function restoreBackup(index) {
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
    
    // 重新加载备份列表
    await loadBackupsList();
    
  } catch (error) {
    console.error('恢复失败:', error);
    showMessage(_t('msgRestoreFailed') + error.message, 'error');
  }
};

// 删除备份
async function deleteBackup(index) {
  if (!confirm(_t('confirmDeleteBackup'))) {
    return;
  }
  
  try {
    const result = await chrome.storage.local.get(['bookmarksBackups']);
    const backups = result.bookmarksBackups || [];
    
    backups.splice(index, 1);
    await chrome.storage.local.set({ bookmarksBackups: backups });
    
    await loadBackupsList();
    showMessage(_t('msgBackupDeleted'), 'success');
    
  } catch (error) {
    console.error('Delete failed:', error);
    showMessage(_t('msgDeleteFailed') + error.message, 'error');
  }
};

// 切换标签页
function switchTab(tabName) {
  // 更新按钮状态
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // 更新内容显示
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}Tab`).classList.add('active');
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

// ==================== 失效链接检测（Popup） ====================

let brokenLinksResults = [];
let brokenLinksSearchTermPopup = '';
let brokenLinksSortPopup = { field: null, direction: 'asc' };

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

async function handleCheckBrokenLinksPopup() {
  const btn = document.getElementById('checkBrokenLinksBtnPopup');
  const progressContainer = document.getElementById('brokenLinksProgressContainerPopup');
  const progressFill = document.getElementById('brokenLinksProgressFillPopup');
  const progressText = document.getElementById('brokenLinksProgressTextPopup');
  const statsPanel = document.getElementById('brokenLinksStatsPopup');

  btn.disabled = true;
  progressContainer.classList.remove('hidden');
  statsPanel.classList.add('hidden');
  progressFill.style.width = '0%';
  progressText.textContent = _t('progressCheckingLinks');

  try {
    const bookmarks = await getAllBookmarks();
    brokenLinksResults = await checkBrokenLinks(bookmarks, (current, total) => {
      const progress = (current / total) * 100;
      progressFill.style.width = `${progress}%`;
      progressText.textContent = _t('checkingItem', [`${current}`, `${total}`]);
    }, 3);

    statsPanel.classList.remove('hidden');
    document.getElementById('brokenLinksCountPopup').textContent = brokenLinksResults.length;
    brokenLinksSearchTermPopup = '';
    const searchInput = document.getElementById('brokenLinksSearchInputPopup');
    if (searchInput) searchInput.value = '';
    displayBrokenLinksPopup();

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

function displayBrokenLinksPopup() {
  const container = document.getElementById('brokenLinksListPopup');
  const toolbar = document.getElementById('brokenLinksToolbarPopup');
  const deleteBtn = document.getElementById('deleteBrokenLinksBtnPopup');

  // 过滤
  let filtered = brokenLinksResults;
  if (brokenLinksSearchTermPopup) {
    filtered = brokenLinksResults.filter(item => {
      const title = (item.bookmark.title || '').toLowerCase();
      const url = (item.bookmark.url || '').toLowerCase();
      return title.includes(brokenLinksSearchTermPopup) || url.includes(brokenLinksSearchTermPopup);
    });
  }

  // 排序
  if (brokenLinksSortPopup.field) {
    filtered = [...filtered].sort((a, b) => {
      let valA, valB;
      switch (brokenLinksSortPopup.field) {
        case 'title': valA = a.bookmark.title || ''; valB = b.bookmark.title || ''; break;
        case 'url': valA = a.bookmark.url || ''; valB = b.bookmark.url || ''; break;
        case 'status': valA = a.status || ''; valB = b.status || ''; break;
        case 'error': valA = getFriendlyError(a); valB = getFriendlyError(b); break;
        case 'time': valA = a.checkedAt || ''; valB = b.checkedAt || ''; break;
        default: return 0;
      }
      if (typeof valA === 'number') {
        return brokenLinksSortPopup.direction === 'asc' ? valA - valB : valB - valA;
      }
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return brokenLinksSortPopup.direction === 'asc' ? -1 : 1;
      if (valA > valB) return brokenLinksSortPopup.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (brokenLinksResults.length === 0) {
    container.innerHTML = `<p class="empty-state">${_t('emptyClickCheck')}</p>`;
    toolbar?.classList.add('hidden');
    deleteBtn?.classList.add('hidden');
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = `<p class="empty-state">${_t('emptyNoResults')}</p>`;
    toolbar?.classList.add('hidden');
    deleteBtn?.classList.add('hidden');
    return;
  }

  toolbar?.classList.remove('hidden');
  deleteBtn?.classList.remove('hidden');

  let html = '';
  for (const item of filtered) {
    const statusClass = `status-${item.status}`;
    const statusText = {
      'broken': _t('statusBroken'),
      'timeout': _t('statusTimeout'),
      'error': _t('statusError')
    }[item.status] || item.status;
    const friendlyError = getFriendlyError(item);

    html += `
      <div class="broken-link-item">
        <input type="checkbox" class="broken-link-checkbox" data-id="${item.bookmark.id}" checked>
        <div class="broken-link-info">
          <div class="broken-link-title" title="${escapeHtml(item.bookmark.title)}">${escapeHtml(item.bookmark.title)}</div>
          <div class="broken-link-url" title="${escapeHtml(item.bookmark.url)}">${escapeHtml(item.bookmark.url)}</div>
          <div class="broken-link-meta">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <span class="status-code">${item.statusCode || '-'}</span>
            <span class="status-error" title="${escapeHtml(friendlyError)}">${escapeHtml(friendlyError)}</span>
            <span class="status-time">${item.checkedAt}</span>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

async function handleDeleteBrokenLinksPopup() {
  const checkboxes = document.querySelectorAll('.broken-link-checkbox:checked');
  if (checkboxes.length === 0) {
    showMessage(_t('msgNoSelection'), 'warning');
    return;
  }

  if (!confirm(_t('confirmDeleteBroken', [`${checkboxes.length}`]))) {
    return;
  }

  try {
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

    brokenLinksResults = brokenLinksResults.filter(r => !ids.includes(r.bookmark.id));
    displayBrokenLinksPopup();
    document.getElementById('brokenLinksCountPopup').textContent = brokenLinksResults.length;

    showMessage(_t('msgDeletedCount', [`${deleted}`]), 'success');
  } catch (error) {
    console.error('Delete broken links failed:', error);
    showMessage(_t('msgDeleteFailed') + error.message, 'error');
  }
}


