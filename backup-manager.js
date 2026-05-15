// backup-manager.js - Backup, restore, and import/export functionality

import { escapeHtml } from './shared.js';
import { logger } from './logger.js';

/**
 * Backup bookmarks
 */
export async function backupBookmarks() {
  try {
    const tree = await chrome.bookmarks.getTree();
    const backup = {
      timestamp: Date.now(),
      date: new Date().toLocaleString('zh-CN'),
      data: tree,
      count: countBookmarks(tree)
    };

    const result = await chrome.storage.local.get(['bookmarksBackups']);
    const backups = result.bookmarksBackups || [];

    backups.unshift(backup);
    if (backups.length > 10) {
      backups.pop();
    }

    await chrome.storage.local.set({ bookmarksBackups: backups });

    const settingsResult = await chrome.storage.local.get('settings');
    const settings = settingsResult.settings || {};
    settings.lastBackup = Date.now();
    await chrome.storage.local.set({ settings });

    logger.info('Backup', 'Bookmark backup created', { count: backup.count, backupsStored: backups.length });
    return backup;
  } catch (error) {
    logger.error('Backup', 'Failed to create backup', { error: error.message });
    throw error;
  }
}

/**
 * Restore bookmarks from backup data
 */
export async function restoreBookmarks(backupData) {
  try {
    await clearAllBookmarks();
    await restoreTree(backupData, '0');
    logger.info('Backup', 'Bookmarks restored from backup');
    return true;
  } catch (error) {
    logger.error('Backup', 'Failed to restore bookmarks', { error: error.message });
    throw error;
  }
}

/**
 * Clear all bookmarks
 */
export async function clearAllBookmarks() {
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

  for (const root of tree) {
    await removeChildren(root);
  }
}

/**
 * Recursively restore bookmark tree
 */
export async function restoreTree(nodes, parentId) {
  for (const node of nodes) {
    let newNode;

    if (node.url) {
      newNode = await chrome.bookmarks.create({
        parentId: parentId,
        title: node.title,
        url: node.url
      });
    } else {
      newNode = await chrome.bookmarks.create({
        parentId: parentId,
        title: node.title
      });
    }

    if (node.children && node.children.length > 0) {
      await restoreTree(node.children, newNode.id);
    }
  }
}

/**
 * Count bookmarks in a tree
 */
export function countBookmarks(nodes) {
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

// ============================================================
// Netscape Bookmark Format Import/Export
// ============================================================

/**
 * Parse Netscape Bookmark Format HTML
 */
export function parseNetscapeBookmarkFormat(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const doctype = doc.doctype;
  const titleEl = doc.querySelector('title');
  const hasNetscapeDoctype = doctype && doctype.name.toLowerCase().includes('netscape');
  const hasBookmarks = doc.querySelector('dl') !== null;

  if (!hasNetscapeDoctype && !hasBookmarks) {
    throw new Error('Invalid bookmark file format');
  }

  function parseDL(dlElement, parentPath) {
    const items = [];
    const children = Array.from(dlElement.children);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.tagName !== 'DT') continue;

      const h3 = child.querySelector(':scope > H3');
      const a = child.querySelector(':scope > A');
      const nestedDL = child.querySelector(':scope > DL');

      if (h3) {
        const folder = {
          type: 'folder',
          title: h3.textContent.trim(),
          addDate: h3.getAttribute('ADD_DATE') || h3.getAttribute('add_date') || '',
          lastModified: h3.getAttribute('LAST_MODIFIED') || h3.getAttribute('last_modified') || '',
          children: []
        };
        if (nestedDL) {
          folder.children = parseDL(nestedDL, [...parentPath, folder.title]);
        }
        items.push(folder);
      } else if (a) {
        const bookmark = {
          type: 'bookmark',
          title: a.textContent.trim(),
          url: a.getAttribute('HREF') || a.getAttribute('href') || '',
          addDate: a.getAttribute('ADD_DATE') || a.getAttribute('add_date') || '',
          icon: a.getAttribute('ICON') || a.getAttribute('icon') || ''
        };
        items.push(bookmark);
      }
    }
    return items;
  }

  const rootDL = doc.querySelector('DL');
  if (!rootDL) {
    throw new Error('No bookmark data found in file');
  }

  return {
    title: titleEl ? titleEl.textContent.trim() : 'Bookmarks',
    items: parseDL(rootDL, [])
  };
}

/**
 * Validate bookmark structure integrity
 */
export function validateBookmarkStructure(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid data format' };
  }

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item.type === 'bookmark') {
        if (!item.url || typeof item.url !== 'string') {
          return { valid: false, error: `Item ${i}: missing or invalid URL` };
        }
        try {
          new URL(item.url);
        } catch {
          return { valid: false, error: `Item ${i}: invalid URL format: ${item.url}` };
        }
      }
    }
    return { valid: true, count: countBookmarkItems(data) };
  }

  if (!Array.isArray(data.items)) {
    return { valid: false, error: 'Missing items array' };
  }

  function validateItems(items, depth) {
    if (depth > 20) {
      return { valid: false, error: 'Nesting too deep (max 20 levels)' };
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.type || !['bookmark', 'folder'].includes(item.type)) {
        return { valid: false, error: `Item ${i}: unknown type "${item.type}"` };
      }
      if (item.type === 'bookmark') {
        if (!item.url || typeof item.url !== 'string') {
          return { valid: false, error: `Item ${i}: missing or invalid URL` };
        }
        try {
          new URL(item.url);
        } catch {
          return { valid: false, error: `Item ${i}: invalid URL format` };
        }
      }
      if (item.type === 'folder') {
        if (!Array.isArray(item.children)) {
          return { valid: false, error: `Folder "${item.title}": missing children array` };
        }
        const result = validateItems(item.children, depth + 1);
        if (!result.valid) return result;
      }
    }
    return { valid: true };
  }

  const result = validateItems(data.items, 0);
  if (!result.valid) return result;

  return { valid: true, count: countBookmarkItems(data.items) };
}

/**
 * Count bookmark items in parsed structure
 */
export function countBookmarkItems(items) {
  let count = 0;
  for (const item of items) {
    if (item.type === 'bookmark') count++;
    if (item.type === 'folder' && item.children) {
      count += countBookmarkItems(item.children);
    }
  }
  return count;
}

/**
 * Import bookmarks from HTML (Netscape format)
 * @param {string} htmlContent
 * @param {string} mode - 'merge' or 'replace'
 */
export async function importBookmarksFromHTML(htmlContent, mode = 'merge') {
  const parsed = parseNetscapeBookmarkFormat(htmlContent);
  const validation = validateBookmarkStructure(parsed);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (mode === 'replace') {
    await clearAllBookmarks();
  }

  const targetParentId = '2';

  async function createItems(items, parentId) {
    for (const item of items) {
      if (item.type === 'bookmark') {
        try {
          await chrome.bookmarks.create({
            parentId: parentId,
            title: item.title || item.url,
            url: item.url
          });
        } catch (e) {
          logger.warn('Backup', 'Failed to create bookmark during import', { title: item.title, error: e.message });
        }
      } else if (item.type === 'folder') {
        try {
          const folder = await chrome.bookmarks.create({
            parentId: parentId,
            title: item.title || 'Untitled Folder'
          });
          if (item.children && item.children.length > 0) {
            await createItems(item.children, folder.id);
          }
        } catch (e) {
          logger.warn('Backup', 'Failed to create folder during import', { title: item.title, error: e.message });
        }
      }
    }
  }

  await createItems(parsed.items, targetParentId);
  logger.info('Backup', 'HTML import complete', { count: validation.count, mode, title: parsed.title });
  return { success: true, count: validation.count, title: parsed.title };
}

/**
 * Export bookmarks to Netscape Bookmark Format HTML
 */
export async function exportBookmarksToHTML() {
  const tree = await chrome.bookmarks.getTree();

  function buildHTML(nodes, depth) {
    const indent = '    '.repeat(depth);
    let html = '';
    for (const node of nodes) {
      if (node.url) {
        const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : '';
        html += `${indent}<DT><A HREF="${escapeHtml(node.url)}" ADD_DATE="${addDate}">${escapeHtml(node.title || 'Untitled')}</A>\n`;
      } else if (node.children) {
        if (node.id === '0') {
          html += buildHTML(node.children, depth);
        } else {
          const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : '';
          const modDate = node.dateGroupModified ? Math.floor(node.dateGroupModified / 1000) : '';
          html += `${indent}<DT><H3 ADD_DATE="${addDate}" LAST_MODIFIED="${modDate}">${escapeHtml(node.title || 'Untitled')}</H3>\n`;
          html += `${indent}<DL><p>\n`;
          html += buildHTML(node.children, depth + 1);
          html += `${indent}</DL><p>\n`;
        }
      }
    }
    return html;
  }

  const bookmarksHtml = buildHTML(tree, 1);

  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${bookmarksHtml}</DL><p>
`;
}

/**
 * Export bookmarks to JSON format
 */
export async function exportBookmarksToJSON() {
  const tree = await chrome.bookmarks.getTree();
  return JSON.stringify(tree, null, 2);
}

/**
 * Generate import preview HTML structure
 */
export function generateImportPreview(items, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    const remaining = countBookmarkItems(items);
    return remaining > 0 ? `<div class="preview-more">... ${remaining} more items</div>` : '';
  }

  let html = '<ul class="preview-list">';
  let shown = 0;
  const maxItems = currentDepth === 0 ? 50 : 20;

  for (const item of items) {
    if (shown >= maxItems) {
      const remaining = countBookmarkItems(items.slice(shown));
      html += `<li class="preview-more">... ${remaining} more items</li>`;
      break;
    }

    if (item.type === 'folder') {
      const childCount = countBookmarkItems(item.children || []);
      html += `<li class="preview-folder">
        <span class="preview-folder-icon">&#128193;</span>
        <span class="preview-folder-name">${escapeHtml(item.title || 'Untitled')}</span>
        <span class="preview-folder-count">(${childCount})</span>
      </li>`;
      if (item.children && item.children.length > 0 && currentDepth < maxDepth - 1) {
        html += generateImportPreview(item.children, maxDepth, currentDepth + 1);
      }
    } else {
      html += `<li class="preview-bookmark">
        <span class="preview-bookmark-icon">&#128278;</span>
        <span class="preview-bookmark-title">${escapeHtml(item.title || 'Untitled')}</span>
      </li>`;
    }
    shown++;
  }

  html += '</ul>';
  return html;
}
