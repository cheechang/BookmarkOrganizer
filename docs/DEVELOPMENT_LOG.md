# Bookmark Organizer 开发历程

> 本文档汇总了项目开发过程中的技术决策、功能迭代和 Bug 修复记录。面向开发者和贡献者，非用户文档。用户请查看根目录的 [README.md](../README.md) 和 [CHANGELOG.md](../CHANGELOG.md)。

---

## 项目概述

Bookmark Organizer 是一款基于 Chrome Extension Manifest V3 的书签整理工具，核心功能包括：

- **智能分类**：基于关键词和域名的自动分类算法，置信度评分（高/中/低）
- **重复检测**：完全重复（URL 相同）+ 相似重复（同域名 + 标题相似度 > 80%），使用 Levenshtein 距离
- **备份与恢复**：整理前自动备份，保留最近 10 个版本，一键恢复到任意备份点
- **双界面模式**：Popup 弹窗（快速操作）+ Options 独立页面（深度整理，支持导出/导入备份文件）

### 技术栈

- 前端：HTML5, CSS3, JavaScript (ES6+)
- API：Chrome Extensions API (Manifest V3), Chrome Storage API
- 算法：Levenshtein 距离、字符串匹配
- 架构：模块化、异步编程、事件驱动

---

## 快速开始

1. **准备图标**：确保 `icons/` 目录下有 `icon16.png`, `icon48.png`, `icon128.png`
2. **加载扩展**：打开 `chrome://extensions/` → 开启"开发者模式" → "加载已解压的扩展程序" → 选择项目文件夹
3. **开始使用**：点击工具栏图标即可打开完整版页面

### 使用流程

```
扫描分析 → 查看分类建议 → 应用分类 → 清理重复 → 管理备份
```

---

## 版本迭代记录

### v1.1.0 — 完整功能独立页面

**新增：**
- `options.html/css/js` — 独立功能页面，解决 Popup 失焦关闭问题
- 备份导出/导入功能 — 通过 `chrome.downloads` API 将备份保存为 JSON 文件
- 书签路径显示 — 在重复检测中显示每个书签的文件夹路径
- 设置页面 — 自动备份开关、相似度阈值调节（50%-95%）、显示书签路径开关

**技术要点：**
- `chrome.storage.local` 有 5-10MB 限制，无法直接访问文件系统，通过导出/导入作为替代方案
- 批量获取书签路径时，一次性获取所有相关节点并构建节点映射表，减少 API 调用次数（性能提升 10 倍以上）

### v1.2.1 — 图标点击行为与 UI 优化

**新增：**
- 点击工具栏图标直接打开 `options.html`，移除 `default_popup`
- 首次安装时自动打开完整版页面引导用户

**Bug 修复：**
- **CSP 合规**：将内联 `onclick="..."` 改为事件委托（`addEventListener` + `data-*` 属性传参）
- **标签筛选器点击失效**：Chrome 扩展的 CSP 策略禁止内联 JavaScript，改用事件委托模式

### v1.2.2 — 标签筛选器样式现代化

- 标签容器和按钮采用渐变背景、圆角、阴影
- 悬停效果：`translateY(-2px) scale(1.02)` + 紫色渐变背景 + 双层阴影
- 删除按钮添加光泽扫过效果
- 使用 `cubic-bezier(0.4, 0, 0.2, 1)` 缓动曲线

### v1.2.3 — 删除后实时更新修复

**问题 1：事件监听器重复绑定**
- 每次 `displayDuplicates()` 后调用 `bindDuplicateEvents()`，导致监听器数量递增
- **修复**：使用 `cloneNode(true)` 克隆容器并替换旧容器，清除旧监听器后再绑定

**问题 2：数组 `splice` 导致索引失效**
- 筛选模式下删除整组后，`currentFilterGroup` 仍指向旧索引
- **修复**：
  - 删除整组时同步更新 `currentFilterGroup`
  - `displayDuplicates` 中添加索引安全检查，超出范围时自动清除筛选

### v1.3.0 — 智能默认勾选

- 重复检测页面中默认勾选需要删除的重复项：
  - 如果组内有书签栏中的项 → 勾选所有**不在**书签栏中的项
  - 如果全组都不在书签栏中 → 保留第一个，勾选其余
  - 如果全组都在书签栏中 → 同样保留第一个，勾选其余
- 实现方式：`getBookmarksPaths()` 沿 `parentId` 链向上检查，遇到 `"1"`（Chrome 书签栏固定 ID）则标记 `inBookmarksBar`

---

## 核心功能增强详情

### 重复检测功能增强（v1.2.0）

| 功能 | 说明 |
|------|------|
| 多选模式 | checkbox 替代 radio，支持批量选择删除 |
| 独立删除按钮 | 每个重复项右侧添加 🗑️ 按钮，点击立即删除 |
| 标签分类筛选 | 顶部显示所有重复组标签，点击仅显示该组 |
| 智能数据更新 | 删除后立即从内存 `duplicates` 数组移除，无需重新扫描 |

**数据结构：**

```javascript
{
  type: 'exact' | 'similar',
  similarity: 0.95,
  items: [
    {
      id: 'bookmark_id',
      title: '书签标题',
      url: 'https://example.com',
      path: '书签栏 > 文件夹1',
      inBookmarksBar: false
    }
  ]
}
```

### 书签路径显示

- 帮助用户判断应该保留哪个重复项
- 路径格式：`文件夹1 > 文件夹2 > 文件夹3`
- 特殊情况：直接在书签栏显示"书签栏"，查询失败显示"未知位置"

---

## 布局优化

### 三段式固定布局

采用 **固定布局 + 独立滚动区域** 解决大量书签时操作按钮滚出可视区域的问题：

```
┌─────────────────────────────┐
│  Header + Control + Tabs    │ ← 固定
├─────────────────────────────┤
│                             │
│    Scrollable Content       │ ← 可滚动区域
│    (分类/重复/备份列表)      │
│                             │
├─────────────────────────────┤
│  Fixed Actions (操作按钮)    │ ← 固定
└─────────────────────────────┘
```

**关键 CSS：**

```css
body { height: 700px; overflow: hidden; }
.container { display: flex; flex-direction: column; height: 100%; }
.scrollable-content { flex: 1; overflow-y: auto; min-height: 0; }
.fixed-actions { flex-shrink: 0; }
```

---

## Bug 修复汇总

| 版本 | 问题 | 根因 | 修复方案 |
|------|------|------|----------|
| v1.2.1 | 标签筛选器点击无效 | CSP 禁止内联 `onclick` | 事件委托 + `data-*` 属性 |
| v1.2.3 | 删除后页面不更新 | 事件监听器重复绑定 | `cloneNode(true)` 清除旧监听器 |
| v1.2.3 | 删除后索引错乱 | `splice` 导致索引失效 | 同步更新 `currentFilterGroup` |
| v1.2.1 | `showMessageFull()` 未定义 | 函数名拼写不一致 | 统一为 `showMessage()` |
| v1.2.1 | 备份列表按钮 CSP 违规 | 内联 `onclick` | 改为 `data-action` + 事件委托 |
| v1.2.1 | `clearAllBookmarks` 删除失败 | `remove()` 无法删除非空文件夹 | 改为 `removeTree()` |
| v1.3.0 | 相似度阈值未生效 | popup.js 中硬编码默认值 | 使用 `currentSettings.similarityThreshold` |
| v1.3.0 | 选择状态残留 | `selectedBookmarks` 未清空 | 每次扫描前 `selectedBookmarks.clear()` |

---

## 技术知识点

### 事件委托模式

```javascript
container.addEventListener('click', (e) => {
  const tag = e.target.closest('.filter-tag');
  if (tag) {
    const groupIndex = parseInt(tag.dataset.groupIndex);
    filterDuplicates(groupIndex);
  }
});
```

- 只需一个监听器处理所有子元素
- 动态添加的子元素自动支持
- 内存占用少

### `cloneNode(true)` 清除监听器

```javascript
const newContainer = container.cloneNode(true);
container.parentNode.replaceChild(newContainer, container);
// cloneNode 复制 DOM 结构和属性，但不复制事件监听器
```

### 数组 `splice` 的副作用

```javascript
const arr = ['a', 'b', 'c', 'd'];
arr.splice(1, 1);  // arr = ['a', 'c', 'd']
// 原索引 2('c') 变成了索引 1
```

删除元素后，后续元素索引前移。在筛选模式下删除整组时，必须同步更新相关的索引状态。

---

## 截图目录

功能截图存放在 `screenshots/` 子目录：

- `scan.png` — 扫描分析页面
- `categories.png` — 分类建议页面
- `duplicates.png` — 重复检测页面
- `backups.png` — 备份管理页面

---

**最后更新**: 2026年4月23日  
**兼容**: Chrome 88+ (Manifest V3)  
**许可证**: MIT License
