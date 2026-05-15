// duplicate-detector.js - Duplicate bookmark detection

import { extractDomain, normalizeUrl, calculateSimilarity, calculateGroupSimilarity } from './shared.js';
import { getAllBookmarks, getBookmarksPaths } from './bookmark-scanner.js';
import { logger } from './logger.js';

/**
 * Detect duplicate bookmarks
 * @param {number} similarityThreshold - 0.0 ~ 1.0
 */
export async function detectDuplicates(similarityThreshold = 0.8) {
  logger.info('Duplicate', 'Starting duplicate detection', { threshold: similarityThreshold });

  const bookmarks = await getAllBookmarks();
  const duplicates = [];
  const processed = new Set();

  // Group by domain
  const domainGroups = {};
  for (const bookmark of bookmarks) {
    const domain = extractDomain(bookmark.url);
    if (!domainGroups[domain]) {
      domainGroups[domain] = [];
    }
    domainGroups[domain].push(bookmark);
  }

  // Phase 1: Exact duplicates (same URL string)
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

  logger.debug('Duplicate', 'Exact duplicates found', { count: duplicates.length });

  // Phase 2: Normalized duplicates (same path, different query params)
  const normalizedMap = {};
  for (const bookmark of bookmarks) {
    if (processed.has(bookmark.id)) continue;
    const norm = normalizeUrl(bookmark.url);
    if (!normalizedMap[norm]) {
      normalizedMap[norm] = [];
    }
    normalizedMap[norm].push(bookmark);
  }

  for (const norm in normalizedMap) {
    const group = normalizedMap[norm];
    if (group.length > 1) {
      const unprocessed = group.filter(b => !processed.has(b.id));
      if (unprocessed.length > 1) {
        duplicates.push({
          type: 'normalized',
          items: unprocessed,
          similarity: 1.0
        });
        unprocessed.forEach(b => processed.add(b.id));
      }
    }
  }

  logger.debug('Duplicate', 'Normalized duplicates found', { count: duplicates.filter(d => d.type === 'normalized').length });

  // Phase 3: Similar duplicates (same domain, similar title and URL path)
  for (const domain in domainGroups) {
    const group = domainGroups[domain];
    if (group.length < 2) continue;

    for (let i = 0; i < group.length; i++) {
      if (processed.has(group[i].id)) continue;

      const similarGroup = [group[i]];

      for (let j = i + 1; j < group.length; j++) {
        if (processed.has(group[j].id)) continue;

        const titleSim = calculateSimilarity(group[i].title, group[j].title);
        const urlSim = calculateSimilarity(
          normalizeUrl(group[i].url),
          normalizeUrl(group[j].url)
        );

        const similarity = titleSim * 0.6 + urlSim * 0.4;

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

  // Add path info for all duplicate items
  if (duplicates.length > 0) {
    const allBookmarkIds = [];
    duplicates.forEach(group => {
      group.items.forEach(item => {
        allBookmarkIds.push(item.id);
      });
    });

    const pathsMap = await getBookmarksPaths(allBookmarkIds);

    duplicates.forEach(group => {
      group.items.forEach(item => {
        const info = pathsMap[item.id] || { path: 'Unknown Location', inBookmarksBar: false };
        item.path = info.path;
        item.inBookmarksBar = info.inBookmarksBar;
      });
    });
  }

  logger.info('Duplicate', 'Duplicate detection complete', {
    totalGroups: duplicates.length,
    exact: duplicates.filter(d => d.type === 'exact').length,
    normalized: duplicates.filter(d => d.type === 'normalized').length,
    similar: duplicates.filter(d => d.type === 'similar').length
  });

  return duplicates;
}
