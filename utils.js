// 工具函数库 - 包含分类、去重、备份等核心功能

/**
 * 从URL提取域名
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

/**
 * 获取书签的完整路径(文件夹层级)
 */
async function getBookmarkPath(bookmarkId) {
  try {
    const path = [];
    let currentNode = await chrome.bookmarks.get(bookmarkId);
    
    if (!currentNode || !currentNode[0]) {
      return typeof _t === 'function' ? _t('unknownPath') : 'Unknown Location';
    }
    
    let parentId = currentNode[0].parentId;
    
    // 向上遍历直到根节点
    while (parentId && parentId !== '0') {
      const parent = await chrome.bookmarks.get(parentId);
      if (parent && parent[0]) {
        path.unshift(parent[0].title);
        parentId = parent[0].parentId;
      } else {
        break;
      }
    }
    
    return path.length > 0 ? path.join(' > ') : (typeof _t === 'function' ? _t('bookmarksBar') : 'Bookmarks Bar');
  } catch (error) {
    console.error('获取书签路径失败:', error);
    return typeof _t === 'function' ? _t('unknownPath') : 'Unknown Location';
  }
}

/**
 * 批量获取书签路径(优化性能)
 */
async function getBookmarksPaths(bookmarkIds) {
  const paths = {};
  
  // 先获取所有需要的节点信息,减少API调用次数
  const nodes = await Promise.all(
    bookmarkIds.map(id => chrome.bookmarks.get(id).catch(() => null))
  );
  
  // 收集所有需要查询的父节点ID
  const parentIds = new Set();
  const nodeMap = {};
  
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i] && nodes[i][0]) {
      const node = nodes[i][0];
      nodeMap[node.id] = node;
      if (node.parentId && node.parentId !== '0') {
        parentIds.add(node.parentId);
      }
    }
  }
  
  // 批量获取父节点信息
  const parentIdArray = Array.from(parentIds);
  if (parentIdArray.length > 0) {
    try {
      const parents = await chrome.bookmarks.get(parentIdArray);
      parents.forEach(p => {
        nodeMap[p.id] = p;
        if (p.parentId && p.parentId !== '0') {
          parentIds.add(p.parentId);
        }
      });
      
      // 继续向上查找更高层级的父节点
      let currentParentIds = Array.from(parentIds).filter(id => !nodeMap[id]);
      let depth = 0;
      const maxDepth = 10; // 防止无限循环
      
      while (currentParentIds.length > 0 && depth < maxDepth) {
        const grandparents = await chrome.bookmarks.get(currentParentIds);
        grandparents.forEach(gp => {
          nodeMap[gp.id] = gp;
          if (gp.parentId && gp.parentId !== '0' && !nodeMap[gp.parentId]) {
            parentIds.add(gp.parentId);
          }
        });
        currentParentIds = Array.from(parentIds).filter(id => !nodeMap[id]);
        depth++;
      }
    } catch (e) {
      console.error('批量获取父节点失败:', e);
    }
  }
  
  // 为每个书签构建路径
  for (const id of bookmarkIds) {
    const path = [];
    let currentNode = nodeMap[id];
    
    if (!currentNode) {
      paths[id] = { path: (typeof _t === 'function' ? _t('unknownPath') : 'Unknown Location'), inBookmarksBar: false };
      continue;
    }
    
    let parentId = currentNode.parentId;
    let inBookmarksBar = false;
    
    while (parentId && parentId !== '0' && nodeMap[parentId]) {
      if (parentId === '1') {
        inBookmarksBar = true;
      }
      path.unshift(nodeMap[parentId].title);
      parentId = nodeMap[parentId].parentId;
    }
    
    paths[id] = {
      path: path.length > 0 ? path.join(' > ') : (typeof _t === 'function' ? _t('bookmarksBar') : 'Bookmarks Bar'),
      inBookmarksBar
    };
  }
  
  return paths;
}

/**
 * 计算字符串相似度 (使用简单的字符匹配算法)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  
  // 使用最长公共子序列算法简化版
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const costs = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter[i - 1] !== longer[j - 1]) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }
  
  return (longer.length - costs[longer.length]) / longer.length;
}

/**
 * 分析单个书签,返回推荐的分类
 */
async function analyzeBookmark(bookmark, categories) {
  const title = bookmark.title || '';
  const url = bookmark.url || '';
  const domain = extractDomain(url);
  
  let bestMatch = null;
  let highestScore = 0;
  
  for (const category of categories) {
    const score = calculateCategoryScore(title, url, domain, category);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = category;
    }
  }
  
  return {
    bookmark: bookmark,
    category: bestMatch,
    score: highestScore,
    confidence: getConfidenceLevel(highestScore)
  };
}

/**
 * 计算书签与分类的匹配分数
 */
function calculateCategoryScore(title, url, domain, category) {
  let score = 0;
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();
  
  // 关键词匹配
  if (category.keywords) {
    for (const keyword of category.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (titleLower.includes(keywordLower)) {
        score += 2; // 标题匹配权重更高
      }
      if (urlLower.includes(keywordLower)) {
        score += 1;
      }
    }
  }
  
  // 域名匹配
  if (category.domains && domain) {
    for (const catDomain of category.domains) {
      if (domain === catDomain || domain.endsWith('.' + catDomain)) {
        score += 3; // 域名匹配权重最高
        break;
      }
    }
  }
  
  return score;
}

/**
 * 获取置信度等级
 */
function getConfidenceLevel(score) {
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  if (score >= 1) return 'low';
  return 'none';
}

/**
 * 遍历所有书签
 */
async function getAllBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  const bookmarks = [];
  
  function traverse(nodes) {
    for (const node of nodes) {
      if (node.url) {
        bookmarks.push(node);
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  return bookmarks;
}

/**
 * 检测重复书签
 */
async function detectDuplicates(similarityThreshold = 0.8) {
  const bookmarks = await getAllBookmarks();
  const duplicates = [];
  const processed = new Set();
  
  // 按域名分组
  const domainGroups = {};
  for (const bookmark of bookmarks) {
    const domain = extractDomain(bookmark.url);
    if (!domainGroups[domain]) {
      domainGroups[domain] = [];
    }
    domainGroups[domain].push(bookmark);
  }
  
  // 检测完全重复(URL相同)
  const urlMap = {};
  for (const bookmark of bookmarks) {
    if (!urlMap[bookmark.url]) {
      urlMap[bookmark.url] = [];
    }
    urlMap[bookmark.url].push(bookmark);
  }
  
  for (const url in urlMap) {
    if (urlMap[url].length > 1) {
      duplicates.push({
        type: 'exact',
        items: urlMap[url]
      });
      urlMap[url].forEach(b => processed.add(b.id));
    }
  }
  
  // 检测相似重复(同域名且标题相似)
  for (const domain in domainGroups) {
    const group = domainGroups[domain];
    if (group.length < 2) continue;
    
    for (let i = 0; i < group.length; i++) {
      if (processed.has(group[i].id)) continue;
      
      const similarGroup = [group[i]];
      
      for (let j = i + 1; j < group.length; j++) {
        if (processed.has(group[j].id)) continue;
        
        const similarity = calculateSimilarity(
          group[i].title,
          group[j].title
        );
        
        if (similarity >= similarityThreshold) {
          similarGroup.push(group[j]);
          processed.add(group[j].id);
        }
      }
      
      if (similarGroup.length > 1) {
        duplicates.push({
          type: 'similar',
          items: similarGroup,
          similarity: calculateGroupSimilarity(similarGroup)
        });
      }
    }
  }
  
  // 为所有重复项添加路径信息
  if (duplicates.length > 0) {
    // 收集所有需要查询路径的书签ID
    const allBookmarkIds = [];
    duplicates.forEach(group => {
      group.items.forEach(item => {
        allBookmarkIds.push(item.id);
      });
    });
    
    // 批量获取路径
    const pathsMap = await getBookmarksPaths(allBookmarkIds);
    
    // 将路径信息添加到每个书签
    duplicates.forEach(group => {
      group.items.forEach(item => {
        const info = pathsMap[item.id] || { path: (typeof _t === 'function' ? _t('unknownPath') : 'Unknown Location'), inBookmarksBar: false };
        item.path = info.path;
        item.inBookmarksBar = info.inBookmarksBar;
      });
    });
  }
  
  return duplicates;
}

/**
 * 备份书签
 */
async function backupBookmarks() {
  try {
    const tree = await chrome.bookmarks.getTree();
    const backup = {
      timestamp: Date.now(),
      date: new Date().toLocaleString('zh-CN'),
      data: tree,
      count: countBookmarks(tree)
    };
    
    // 获取现有备份列表
    const result = await chrome.storage.local.get(['bookmarksBackups']);
    const backups = result.bookmarksBackups || [];
    
    // 添加新备份(保留最近10个)
    backups.unshift(backup);
    if (backups.length > 10) {
      backups.pop();
    }
    
    await chrome.storage.local.set({ bookmarksBackups: backups });
    
    // 更新最后备份时间
    const settingsResult = await chrome.storage.local.get('settings');
    const settings = settingsResult.settings || {};
    settings.lastBackup = Date.now();
    await chrome.storage.local.set({ settings });
    
    return backup;
  } catch (error) {
    console.error('备份失败:', error);
    throw error;
  }
}

/**
 * 恢复书签
 */
async function restoreBookmarks(backupData) {
  try {
    // 警告: 这将删除所有现有书签
    await clearAllBookmarks();
    
    // 递归恢复书签树
    await restoreTree(backupData, '0'); // '0' 是根文件夹ID
    
    return true;
  } catch (error) {
    console.error('恢复失败:', error);
    throw error;
  }
}

/**
 * 清空所有书签
 */
async function clearAllBookmarks() {
  const tree = await chrome.bookmarks.getTree();

  async function removeChildren(node) {
    if (node.children) {
      for (const child of node.children) {
        if (child.children && child.children.length > 0) {
          await chrome.bookmarks.removeTree(child.id);
        } else {
          await chrome.bookmarks.remove(child.id);
        }
      }
    }
  }

  // 删除根节点下的所有内容
  for (const root of tree) {
    await removeChildren(root);
  }
}

/**
 * 递归恢复书签树
 */
async function restoreTree(nodes, parentId) {
  for (const node of nodes) {
    let newNode;
    
    if (node.url) {
      // 这是书签
      newNode = await chrome.bookmarks.create({
        parentId: parentId,
        title: node.title,
        url: node.url
      });
    } else {
      // 这是文件夹
      newNode = await chrome.bookmarks.create({
        parentId: parentId,
        title: node.title
      });
    }
    
    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      await restoreTree(node.children, newNode.id);
    }
  }
}

/**
 * 统计书签数量
 */
function countBookmarks(nodes) {
  let count = 0;
  for (const node of nodes) {
    if (node.url) {
      count++;
    }
    if (node.children) {
      count += countBookmarks(node.children);
    }
  }
  return count;
}

/**
 * 创建分类文件夹
 */
async function createCategoryFolder(categoryName) {
  // 检查是否已存在
  const tree = await chrome.bookmarks.getTree();
  const existing = await findFolderByName(tree, categoryName);
  
  if (existing) {
    return existing;
  }
  
  // 创建新文件夹
  const folder = await chrome.bookmarks.create({
    parentId: '0', // 根目录
    title: categoryName
  });
  
  return folder;
}

/**
 * 查找文件夹
 */
async function findFolderByName(nodes, name) {
  for (const node of nodes) {
    if (!node.url && node.title === name) {
      return node;
    }
    if (node.children) {
      const found = await findFolderByName(node.children, name);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 移动书签到文件夹
 */
async function moveBookmarkToFolder(bookmarkId, folderId) {
  await chrome.bookmarks.move(bookmarkId, {
    parentId: folderId
  });
}

/**
 * 批量移动书签
 */
async function batchMoveBookmarks(bookmarkIds, folderId) {
  const results = [];
  for (const id of bookmarkIds) {
    try {
      await moveBookmarkToFolder(id, folderId);
      results.push({ id, success: true });
    } catch (error) {
      results.push({ id, success: false, error: error.message });
    }
  }
  return results;
}

/**
 * 计算相似组内所有项的最小相似度
 */
function calculateGroupSimilarity(items) {
  if (items.length < 2) return 1;
  let minSimilarity = 1;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = calculateSimilarity(items[i].title, items[j].title);
      if (sim < minSimilarity) {
        minSimilarity = sim;
      }
    }
  }
  return minSimilarity;
}

/**
 * HTML转义，防止XSS攻击
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
