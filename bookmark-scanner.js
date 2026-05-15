// bookmark-scanner.js - Bookmark scanning, path resolution, and broken link detection

import { _t } from './i18n.js';
import { extractDomain, normalizeUrl, calculateSimilarity } from './shared.js';
import { logger } from './logger.js';

/**
 * Get full path (folder hierarchy) of a bookmark
 */
export async function getBookmarkPath(bookmarkId) {
  try {
    const path = [];
    let currentNode = await chrome.bookmarks.get(bookmarkId);

    if (!currentNode || !currentNode[0]) {
      return _t('unknownPath');
    }

    let parentId = currentNode[0].parentId;

    while (parentId && parentId !== '0') {
      const parent = await chrome.bookmarks.get(parentId);
      if (parent && parent[0]) {
        path.unshift(parent[0].title);
        parentId = parent[0].parentId;
      } else {
        break;
      }
    }

    return path.length > 0 ? path.join(' > ') : _t('bookmarksBar');
  } catch (error) {
    logger.error('Scanner', 'Failed to get bookmark path', { bookmarkId, error: error.message });
    return _t('unknownPath');
  }
}

/**
 * Batch get bookmark paths (performance optimized)
 */
export async function getBookmarksPaths(bookmarkIds) {
  const paths = {};

  const nodes = await Promise.all(
    bookmarkIds.map(id => chrome.bookmarks.get(id).catch(() => null))
  );

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

      let currentParentIds = Array.from(parentIds).filter(id => !nodeMap[id]);
      let depth = 0;
      const maxDepth = 10;

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
      logger.error('Scanner', 'Failed to batch get parent nodes', { error: e.message });
    }
  }

  for (const id of bookmarkIds) {
    const path = [];
    let currentNode = nodeMap[id];

    if (!currentNode) {
      paths[id] = { path: _t('unknownPath'), inBookmarksBar: false };
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
      path: path.length > 0 ? path.join(' > ') : _t('bookmarksBar'),
      inBookmarksBar
    };
  }

  return paths;
}

/**
 * Traverse all bookmarks
 */
export async function getAllBookmarks() {
  try {
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
    logger.debug('Scanner', 'Retrieved all bookmarks', { count: bookmarks.length });
    return bookmarks;
  } catch (error) {
    logger.error('Scanner', 'Failed to get all bookmarks', { error: error.message });
    throw error;
  }
}

/**
 * Analyze a single bookmark and return recommended category
 */
export async function analyzeBookmark(bookmark, categories) {
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
 * Calculate bookmark-to-category match score
 */
export function calculateCategoryScore(title, url, domain, category) {
  let score = 0;
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();

  if (category.keywords) {
    for (const keyword of category.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (titleLower.includes(keywordLower)) {
        score += 2;
      }
      if (urlLower.includes(keywordLower)) {
        score += 1;
      }
    }
  }

  if (category.domains && domain) {
    for (const catDomain of category.domains) {
      if (domain === catDomain || domain.endsWith('.' + catDomain)) {
        score += 3;
        break;
      }
    }
  }

  return score;
}

/**
 * Get confidence level based on score
 */
export function getConfidenceLevel(score) {
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  if (score >= 1) return 'low';
  return 'none';
}

/**
 * Check if a single link is broken
 */
export async function checkSingleLink(bookmark, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  async function tryFetch(method) {
    return fetch(bookmark.url, {
      method,
      signal: controller.signal,
      redirect: 'follow',
      credentials: 'omit'
    });
  }

  try {
    let response;
    try {
      response = await tryFetch('HEAD');
    } catch (headErr) {
      response = await tryFetch('GET');
    }

    clearTimeout(timeoutId);

    if (response.status === 404 || response.status === 410) {
      return {
        bookmark,
        status: 'broken',
        statusCode: response.status,
        error: `HTTP ${response.status}`,
        checkedAt: new Date().toLocaleString()
      };
    }
    if (response.status >= 500) {
      return {
        bookmark,
        status: 'error',
        statusCode: response.status,
        error: `Server Error ${response.status}`,
        checkedAt: new Date().toLocaleString()
      };
    }
    return null;
  } catch (error) {
    clearTimeout(timeoutId);

    let status = 'error';
    let errorMsg = error.message || String(error);

    if (error.name === 'AbortError') {
      status = 'timeout';
      errorMsg = 'Connection timeout';
    } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
      status = 'broken';
      errorMsg = 'Network error / DNS failed / Connection refused';
    }

    return {
      bookmark,
      status,
      statusCode: null,
      error: errorMsg,
      checkedAt: new Date().toLocaleString()
    };
  }
}

/**
 * Batch check broken links with concurrency control
 * @param {Array} bookmarks - Bookmark list
 * @param {Function} onProgress - Progress callback (current, total)
 * @param {number} concurrency - Number of concurrent requests
 */
export async function checkBrokenLinks(bookmarks, onProgress, concurrency = 3) {
  const validBookmarks = bookmarks.filter(b => {
    try {
      const url = new URL(b.url);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  });

  const results = [];
  const total = validBookmarks.length;
  let index = 0;

  async function worker() {
    while (index < total) {
      const currentIndex = index++;
      const bookmark = validBookmarks[currentIndex];
      const result = await checkSingleLink(bookmark);
      if (result) {
        results.push(result);
      }
      if (onProgress) {
        onProgress(currentIndex + 1, total);
      }
      await new Promise(r => setTimeout(r, 150));
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(concurrency, total || 1); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  logger.info('Scanner', 'Broken link check complete', { total, broken: results.length });
  return results;
}
