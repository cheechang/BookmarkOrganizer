// 弹窗主逻辑

let categories = [];
let analysisResults = [];
let duplicates = [];
let selectedBookmarks = new Set();

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadSettings();
  setupEventListeners();
  await loadBackupsList();
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
    showMessage('加载分类规则失败', 'error');
  }
}

// 加载设置
async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  const settings = result.settings || {};
  
  const autoBackupToggle = document.getElementById('autoBackupToggle');
  autoBackupToggle.checked = settings.autoBackup !== false;
  
  autoBackupToggle.addEventListener('change', async (e) => {
    settings.autoBackup = e.target.checked;
    await chrome.storage.local.set({ settings });
    showMessage('设置已保存', 'success');
  });
}

// 设置事件监听
function setupEventListeners() {
  // 扫描按钮
  document.getElementById('scanBtn').addEventListener('click', handleScan);

  // 备份按钮
  document.getElementById('backupBtn').addEventListener('click', handleBackup);

  // 应用分类按钮
  document.getElementById('applyCategoriesBtn').addEventListener('click', handleApplyCategories);

  // 清理重复按钮
  document.getElementById('removeDuplicatesBtn').addEventListener('click', handleRemoveDuplicates);

  // 标签页切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
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
  progressText.textContent = '正在获取书签...';
  
  try {
    // 自动备份
    const settingsResult = await chrome.storage.local.get('settings');
    if (settingsResult.settings?.autoBackup) {
      progressText.textContent = '正在自动备份...';
      await backupBookmarks();
      await loadBackupsList();
    }
    
    // 获取所有书签
    progressText.textContent = '正在分析书签...';
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
      progressText.textContent = `正在分析 ${i + 1}/${total}`;
      
      // 每处理10个让出控制权,避免阻塞UI
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // 检测重复
    progressText.textContent = '正在检测重复...';
    duplicates = await detectDuplicates();
    
    // 显示统计信息
    displayStats(bookmarks.length, duplicates.length);
    
    // 显示分类建议
    displayCategories();
    
    // 显示重复项
    displayDuplicates();
    
    progressText.textContent = '分析完成!';
    showMessage(`分析完成! 共 ${total} 个书签`, 'success');
    
  } catch (error) {
    console.error('扫描失败:', error);
    showMessage('扫描失败: ' + error.message, 'error');
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
function displayCategories() {
  const container = document.getElementById('categoriesList');
  const applyBtn = document.getElementById('applyCategoriesBtn');
  
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
  
  if (Object.keys(grouped).length === 0) {
    container.innerHTML = '<p class="empty-state">未找到可分类的书签</p>';
    applyBtn.classList.add('hidden');
    return;
  }
  
  let html = '';
  for (const [catName, items] of Object.entries(grouped)) {
    html += `
      <div class="category-group">
        <div class="category-header">
          <span class="category-name">${escapeHtml(catName)}</span>
          <span class="category-count">${items.length} 个书签</span>
        </div>
    `;
    
    for (const item of items) {
      const bookmark = item.bookmark;
      const confidenceClass = `confidence-${item.confidence}`;
      const confidenceText = {
        'high': '高',
        'medium': '中',
        'low': '低'
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
                置信度: ${confidenceText}
              </span>
            </div>
          </div>
        </div>
      `;
    }
    
    html += '</div>';
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

function displayDuplicates(filterGroupIndex = null) {
  const container = document.getElementById('duplicatesList');
  const removeBtn = document.getElementById('removeDuplicatesBtn');
  
  if (duplicates.length === 0) {
    container.innerHTML = '<p class="empty-state">未发现重复书签 ✓</p>';
    removeBtn.classList.add('hidden');
    currentFilterGroup = null; // 清除筛选状态
    return;
  }
  
  // 安全检查：如果筛选索引超出范围，自动清除筛选
  if (filterGroupIndex !== null && (filterGroupIndex < 0 || filterGroupIndex >= duplicates.length)) {
    filterGroupIndex = null;
    currentFilterGroup = null;
  }
  
  let html = '';
  
  // 添加标签筛选区域（仅在未筛选时显示）
  if (filterGroupIndex === null) {
    html += '<div class="duplicate-filter-tags">';
    duplicates.forEach((group, index) => {
      const firstItem = group.items[0];
      const fullTitle = firstItem.title;
      const title = escapeHtml(fullTitle.substring(0, 20));
      const count = group.items.length;
      const tooltip = `标题：${fullTitle}\n网址：${firstItem.url}`;
      html += `
        <button class="filter-tag" data-group-index="${index}" title="${tooltip.replace(/"/g, '&quot;')}">
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
        <button class="btn-back-filter" data-action="clear-filter">← 返回全部</button>
        <span class="filter-label">正在查看: ${escapeHtml(duplicates[filterGroupIndex].items[0].title.substring(0, 30))}</span>
      </div>
    `;
  }
  
  // 确定要显示的组列表
  const groupsToShow = filterGroupIndex !== null ? 
    [{...duplicates[filterGroupIndex], originalIndex: filterGroupIndex}] :
    duplicates.map((group, index) => ({...group, originalIndex: index}));
  
  groupsToShow.forEach((group, displayIndex) => {
    const actualIndex = group.originalIndex;
    const typeText = group.type === 'exact' ? '完全重复' : '相似重复';
    const similarityText = group.similarity ? 
      `(相似度: ${(group.similarity * 100).toFixed(0)}%)` : '';
    
    html += `
      <div class="duplicate-group" data-group-index="${actualIndex}">
        <div class="duplicate-type">${typeText} ${similarityText}</div>
    `;
    
    group.items.forEach((item, idx) => {
      const pathHtml = item.path ? 
        `<div class="bookmark-path">📁 ${escapeHtml(item.path)}</div>` : '';
      
      html += `
        <div class="duplicate-item">
          <input type="checkbox" name="duplicate-${actualIndex}-${idx}" 
                 value="${item.id}" 
                 class="duplicate-checkbox"
                 data-id="${item.id}"
                 data-group="${actualIndex}"
                 ${idx === 0 && filterGroupIndex === null ? 'checked' : ''}>
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
                  title="删除此书签">
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
    showMessage('请至少选择一个书签', 'warning');
    return;
  }
  
  if (!confirm(`确定要将 ${selectedBookmarks.size} 个书签移动到对应分类文件夹吗?`)) {
    return;
  }
  
  const applyBtn = document.getElementById('applyCategoriesBtn');
  applyBtn.disabled = true;
  applyBtn.textContent = '应用中...';
  
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
    
    showMessage(`成功移动 ${successCount} 个书签`, 'success');
    
    // 重新扫描
    setTimeout(() => {
      handleScan();
    }, 1000);
    
  } catch (error) {
    console.error('应用分类失败:', error);
    showMessage('应用分类失败: ' + error.message, 'error');
  } finally {
    applyBtn.disabled = false;
    applyBtn.textContent = '✓ 应用分类';
  }
}

// 筛选重复项（点击标签）
function filterDuplicates(groupIndex) {
  displayDuplicates(groupIndex);
}

// 清除筛选，显示全部
function clearDuplicateFilter() {
  currentFilterGroup = null;
  displayDuplicates(null);
}

// 删除单个重复项
async function deleteSingleDuplicate(bookmarkId, groupIndex, itemIndex) {
  if (!confirm('确定要删除这个书签吗？')) {
    return;
  }
  
  try {
    await chrome.bookmarks.remove(bookmarkId);
    showMessage('已删除', 'success');
    
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
    console.error('删除失败:', error);
    showMessage('删除失败: ' + error.message, 'error');
  }
}

// 清理重复项（支持多选）
async function handleRemoveDuplicates() {
  // 获取所有选中的复选框
  const selectedCheckboxes = document.querySelectorAll('.duplicate-checkbox:checked');
  
  if (selectedCheckboxes.length === 0) {
    showMessage('请至少选择一个要删除的书签', 'warning');
    return;
  }
  
  if (!confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个重复书签吗?此操作不可撤销!`)) {
    return;
  }
  
  const removeBtn = document.getElementById('removeDuplicatesBtn');
  removeBtn.disabled = true;
  removeBtn.textContent = '删除中...';
  
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
    
    showMessage(`成功删除 ${deleteCount} 个重复书签`, 'success');
    
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
    showMessage('清理失败: ' + error.message, 'error');
  } finally {
    removeBtn.disabled = false;
    removeBtn.textContent = '🗑 清理选中的重复项';
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
    showMessage('备份成功!', 'success');
  } catch (error) {
    console.error('备份失败:', error);
    showMessage('备份失败: ' + error.message, 'error');
  } finally {
    backupBtn.disabled = false;
    backupBtn.textContent = '💾 立即备份';
  }
}

// 加载备份列表
async function loadBackupsList() {
  const container = document.getElementById('backupsList');
  const result = await chrome.storage.local.get(['bookmarksBackups']);
  const backups = result.bookmarksBackups || [];
  
  if (backups.length === 0) {
    container.innerHTML = '<p class="empty-state">暂无备份记录</p>';
    return;
  }
  
  let html = '';
  backups.forEach((backup, index) => {
    const date = new Date(backup.timestamp).toLocaleString('zh-CN');
    html += `
      <div class="backup-item">
        <div class="backup-info">
          <div class="backup-date">${backup.date || date}</div>
          <div class="backup-details">${backup.count || 0} 个书签</div>
        </div>
        <div class="backup-actions">
          <button class="btn-small btn-restore" data-action="restore-backup" data-index="${index}">
            恢复
          </button>
          <button class="btn-small btn-delete" data-action="delete-backup" data-index="${index}">
            删除
          </button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// 恢复备份
async function restoreBackup(index) {
  if (!confirm('恢复备份将覆盖当前所有书签,确定继续吗?')) {
    return;
  }
  
  try {
    const result = await chrome.storage.local.get(['bookmarksBackups']);
    const backups = result.bookmarksBackups || [];
    const backup = backups[index];
    
    if (!backup) {
      throw new Error('备份不存在');
    }
    
    await restoreBookmarks(backup.data);
    showMessage('恢复成功!', 'success');
    
    // 重新加载备份列表
    await loadBackupsList();
    
  } catch (error) {
    console.error('恢复失败:', error);
    showMessage('恢复失败: ' + error.message, 'error');
  }
};

// 删除备份
async function deleteBackup(index) {
  if (!confirm('确定要删除这个备份吗?')) {
    return;
  }
  
  try {
    const result = await chrome.storage.local.get(['bookmarksBackups']);
    const backups = result.bookmarksBackups || [];
    
    backups.splice(index, 1);
    await chrome.storage.local.set({ bookmarksBackups: backups });
    
    await loadBackupsList();
    showMessage('备份已删除', 'success');
    
  } catch (error) {
    console.error('删除失败:', error);
    showMessage('删除失败: ' + error.message, 'error');
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


