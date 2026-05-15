// category-manager.js - Category folder creation and bookmark moving

import { logger } from './logger.js';

/**
 * Create a category folder if it doesn't exist
 */
export async function createCategoryFolder(categoryName) {
  const tree = await chrome.bookmarks.getTree();
  const existing = await findFolderByName(tree, categoryName);

  if (existing) {
    return existing;
  }

  const folder = await chrome.bookmarks.create({
    parentId: '0',
    title: categoryName
  });

  logger.debug('Category', 'Created category folder', { name: categoryName, id: folder.id });
  return folder;
}

/**
 * Find a folder by name in the bookmark tree
 */
export async function findFolderByName(nodes, name) {
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
 * Move a bookmark to a folder
 */
export async function moveBookmarkToFolder(bookmarkId, folderId) {
  await chrome.bookmarks.move(bookmarkId, {
    parentId: folderId
  });
}

/**
 * Batch move bookmarks with per-item error handling
 */
export async function batchMoveBookmarks(bookmarkIds, folderId) {
  const results = [];
  for (const id of bookmarkIds) {
    try {
      await moveBookmarkToFolder(id, folderId);
      results.push({ id, success: true });
    } catch (error) {
      logger.warn('Category', 'Failed to move bookmark', { id, folderId, error: error.message });
      results.push({ id, success: false, error: error.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  logger.info('Category', 'Batch move complete', { total: bookmarkIds.length, success: successCount });
  return results;
}
