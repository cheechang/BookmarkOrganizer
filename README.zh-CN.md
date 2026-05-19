# 书签整理工具

智能、本地、隐私优先 —— 让你的浏览器书签井井有条。

一个能够扫描、分类、去重和备份书签的浏览器扩展。所有处理完全在本地设备上进行，不会向任何服务器上传数据。

[English](README.md) · **中文** · [Español](README.es.md) · [日本語](README.ja.md) · [Deutsch](README.de.md)

README 更新：2026-04-23 · 当前版本：`1.9.6` · 发布记录：[CHANGELOG.md](CHANGELOG.md)

---

## 项目定位

书签整理工具是一个基于原生 JavaScript 和 Manifest V3 构建的浏览器扩展。它的目标不是取代你的书签管理器，而是让你已有的书签再次变得可用。

- **整理优先**：根据标题、URL 和域名关键词自动推荐分类。可通过 UI 或 JSON 添加自定义规则。
- **清理优先**：检测完全重复、规范化重复（同路径不同参数）和相似重复（同域名相似标题）。
- **安全优先**：每次扫描前自动创建备份。本地保留最近 10 份备份，支持一键恢复和手动 JSON/HTML 导入导出。
- **隐私优先**：所有数据保存在浏览器存储中。无网络请求，无遥测，无需账户。
- **个性化优先**：8 款内置皮肤 + 自定义皮肤生成器（上传任意图片）。完整的深色模式和 5 语言国际化支持。

> **Important**
>
> 扩展默认设置面向通用场景。安装后建议进入**设置**页面调整相似度阈值、自动备份行为、主题皮肤和自定义分类规则。

---

## 截图

**扫描分析页面**  
![扫描分析](docs/screenshots/scan.png)

**分类建议页面**  
![分类建议](docs/screenshots/categories.png)

**重复检测 — 标签筛选**  
![重复检测](docs/screenshots/duplicates.png)

**备份管理**  
![备份管理](docs/screenshots/backups.png)

---

## 下载与安装

| 项目 | 说明 |
| --- | --- |
| 最新版本 | [GitHub Releases](https://github.com/cheechang/BookmarkOrganizer/releases) |
| Edge 扩展商店 | [Bookmark Organizer](https://www.crxsoso.com/addon/detail/obmalmnejfkdbbphdmlkimjhfefgfcem) |
| Firefox 扩展商店 | [BookmarkTidy](https://addons.crxsoso.com/zh-CN/firefox/addon/bookmarktidy/) |
| 支持的浏览器 | Chrome / Edge / Firefox / Chromium 内核浏览器 |
| 所需权限 | Bookmarks, Storage, Downloads |

### 方式一：浏览器扩展商店

直接通过上方商店链接安装。扩展将自动更新。

### 方式二：开发者模式（适合测试或自用）

1. 克隆仓库：
   ```bash
   git clone https://github.com/cheechang/BookmarkOrganizer.git
   cd BookmarkOrganizer
   ```

2. 确保 `icons/` 目录下包含以下精确尺寸的 PNG 文件：
   - `icon16.png` — 16×16
   - `icon48.png` — 48×48
   - `icon128.png` — 128×128

   如果只有 SVG，可用任意在线转换工具生成 PNG。

3. 打开浏览器扩展管理页面（如 Edge 中输入 `edge://extensions/`），开启右上角**开发者模式**。

4. 点击**加载已解压的扩展程序**，选择项目根目录。

5. 工具栏会出现扩展图标，点击即可使用。

---

## 核心能力

| 模块 | 能力 |
| --- | --- |
| 智能分类 | 扫描书签并基于标题/URL/域名关键词推荐文件夹。置信度评分（高/中/低）。支持通过 UI 或 `rules/categories.json` 自定义规则。 |
| 重复检测 | 三种类型：完全重复（URL 相同）、规范化重复（路径相同参数不同）、相似重复（同域名标题相近）。加权相似度算法（标题 60%，URL 40%）。 |
| 智能勾选 | 重复分组智能预勾选：优先保全书签栏中的副本，其余自动选中实现一键清理。 |
| 备份与回滚 | 扫描前自动备份。保留最近 10 份备份并自动清理。一键恢复。支持导出 JSON 或标准 Netscape HTML。 |
| 失效链接检测 | 通过 HTTP HEAD/GET 检测不可访问的书签，带超时机制。识别 404、5xx、超时和网络故障。批量删除并集成备份。 |
| 跨浏览器导入导出 | 从 Chrome、Firefox、Edge、Safari 导入标准 Netscape Bookmark HTML。导出为 HTML 或 JSON。支持合并或替换模式。 |
| 主题皮肤系统 | 8 款内置皮肤（默认、浏览器原生、极简商务、经典怀旧、高对比度单色、毛玻璃、自然低饱和，外加 4 款渐变色主题）。支持上传任意图片生成自定义皮肤。 |
| 完整国际化 | 完整 UI 翻译支持 5 种语言：英语、简体中文、西班牙语、日语、德语。实时切换并即时重渲染。 |
| 深色模式 | 一键切换浅色/深色主题。偏好设置持久化保存在浏览器存储中。所有皮肤均配备专用深色配色。 |

---

## 体验设计

书签整理工具的界面围绕「清晰、高效、视觉舒适」设计。

- **双界面模式**：完整独立页面（`options.html`）带侧边栏导航，加上紧凑弹窗（`popup.html`）供快速访问。点击工具栏图标直接打开完整页面。
- **左侧边栏导航**：扫描、分类、重复检测、失效链接、备份、设置 —— 每个页面配有自定义 SVG 图标和激活状态指示器。
- **自适应皮肤**：每个 UI 元素 —— 侧边栏、卡片、列表、表单、进度条、筛选标签 —— 均通过 CSS 自定义属性动态响应所选皮肤和浅色/深色模式。
- **DPI 自动适配**：CSS 媒体查询处理 100%、125%、150%、200%+ 显示缩放，防止高 DPI 屏幕上的布局断裂。
- **内联操作**：批量选择、单独删除、展开/折叠、可排序列、浮动滚动辅助按钮，让操作触手可及。

---

## 主题皮肤系统

| 皮肤 | 说明 |
| --- | --- |
| 默认 | 干净的渐变紫蓝色侧边栏，搭配中性浅色内容区。 |
| 浏览器原生 | 匹配宿主浏览器的原生 UI 色调，无缝融合。 |
| 极简商务 | 冷静的蓝灰色专业配色，营造专注的工作环境。 |
| 经典怀旧 | 温暖的复古纸张与墨迹风格，带有棕褐色调。 |
| 高对比度单色 | 纯黑白色调，最大化可访问性和可读性。 |
| 毛玻璃 | 半透明模糊效果的现代外观，动态背景。 |
| 自然低饱和 | 柔和护眼绿米色，减少视觉疲劳。 |
| 深海 | 深蓝色渐变主题，灵感来自海洋。 |
| 日落 | 暖橙红色渐变主题，灵感来自日落。 |
| 星空 | 深紫蓝色渐变主题，带有天体氛围。 |
| 樱花 | 柔和粉色渐变主题，浪漫的樱花色调。 |
| **自定义皮肤** | 上传任意图片；扩展自动提取主色调并生成个性化主题，确保对比度合规。 |

> **注意**
>
> 自定义皮肤保存在浏览器本地存储中，跨会话持久化，在弹窗和完整页面中均可用。

---

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 语言 | 原生 JavaScript (ES2020+) |
| 架构 | ES Modules — 模块化导入，无构建工具 |
| 清单 | Manifest V3 (Chromium) / Manifest V3 配合 `background.scripts` (Firefox) |
| UI | 手写 HTML + CSS，无框架 |
| 样式 | CSS 自定义属性 (`--bo-*`) 构建皮肤系统，`color-mix()` 实现自适应色调 |
| 存储 | `chrome.storage.local` 存储设置、备份、日志和自定义规则 |
| 书签 API | `chrome.bookmarks` 实现读取、创建、移动、删除和树遍历 |
| 相似度 | Levenshtein 距离（编辑距离）配合标题/URL 加权平均 |
| 国际化 | `_locales/` 配合 `__MSG_*__` 占位符和运行时 `_t()` 引擎 |
| 图标 | 自定义 SVG 线型图标，使用 `currentColor` 实现主题自适应 |
| CI/CD | GitHub Actions — 跨平台矩阵构建 Chromium + Firefox |

---

## 项目结构

```
BookmarkOrganizer/
├── manifest.json              # Chromium 扩展配置 (MV3)
├── manifest-firefox.json      # Firefox 扩展配置 (MV3)
├── background.js              # Service Worker：安装事件、图标点击处理
├── options.html/css/js        # 完整版独立页面
├── popup.html/css/js          # 紧凑弹窗界面
├── i18n.js                    # 运行时翻译引擎
├── theme-system.css           # 皮肤系统：8+ 款皮肤 × 浅色/深色变量
│
├── shared.js                  # 纯工具函数 (escapeHtml 等)
├── bookmark-scanner.js        # 书签扫描、分析、失效链接检测
├── category-manager.js        # 智能分类和批量移动操作
├── duplicate-detector.js      # 重复检测：完全、规范化、相似
├── backup-manager.js          # 备份/恢复、HTML/JSON 导入导出
├── logger.js                  # 客户端调试日志框架
├── utils.js                   # 遗留共享工具（向后兼容）
│
├── rules/
│   └── categories.json        # 默认分类关键词规则
├── _locales/                  # 国际化消息：en, zh_CN, es, ja, de
├── icons/                     # 扩展图标 (16px, 48px, 128px)
├── docs/
│   ├── screenshots/           # README 用 UI 截图
│   ├── DEVELOPMENT_LOG.md     # 开发历史
│   └── STORE_LISTING.md       # 商店上架文案
├── .github/
│   └── workflows/
│       └── release.yml        # 自动化构建与发布流水线
├── CHANGELOG.md               # 版本历史
├── PRIVACY_POLICY.md          # 隐私政策（商店提交所需）
└── LICENSE                    # MIT 许可证
```

---

## 构建

无需构建步骤。这是一个手写原生扩展，运行时零依赖。

```bash
git clone https://github.com/cheechang/BookmarkOrganizer.git
cd BookmarkOrganizer
```

直接在浏览器开发者模式中加载项目根目录（详见[下载与安装](#下载与安装)）。

CI 打包（由 GitHub Actions 使用）：

```bash
# Chromium 包
zip -r BookmarkOrganizer-v1.9.6.zip manifest.json *.js *.css *.html rules/ _locales/ icons/ -x "*.map" "node_modules/*"

# Firefox 包
# (manifest-firefox.json 在打包前被重命名为 manifest.json)
```

---

## 文档入口

| 内容 | 链接 |
| --- | --- |
| 变更日志 | [CHANGELOG.md](CHANGELOG.md) |
| 隐私政策 | [PRIVACY_POLICY.md](PRIVACY_POLICY.md) |
| 开发日志 | [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) |
| 商店文案 | [docs/STORE_LISTING.md](docs/STORE_LISTING.md) |

---

## 最近更新

当前版本：**1.9.6**。完整发布说明见 [CHANGELOG.md](CHANGELOG.md)。v1.9.6 亮点：

- 新增 4 款渐变皮肤：深海、日落、星空、樱花。
- 新增自定义皮肤功能：上传任意图片生成个性化主题，自动提取颜色并确保对比度合规。
- 修复所有皮肤和模式下的侧边栏主题适配；将硬编码颜色替换为 CSS 变量。
- 优化深色模式下的皮肤颜色对比度，提升可读性。
- 修复发布工作流的变更日志提取正则表达式。

---

## 路线图

| 状态 | 方向 |
| --- | --- |
| 已完成 | 智能分类、重复检测（3 种类型）、备份/回滚、失效链接检测、跨浏览器导入导出、自定义分类规则、完整国际化（5 种语言）、深色模式、8+ 款主题皮肤、自定义皮肤生成器、自动更新检查、模块化 ES Module 架构、调试日志系统 |
| 进行中 | Wiki 文档、大规模书签集（5000+）性能基准测试、更多皮肤预设 |
| 计划中 | 备份云同步、书签使用统计、基于标签的组织、书签内搜索、键盘快捷键 |

---

## 参与贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库。
2. 从 `main` 分支创建 feature 或 fix 分支。
3. 保持改动聚焦，并在 PR 描述中补充必要的测试步骤。
4. 提交 PR，清晰说明改动目的、影响范围和验证结果。

优先处理可复现的问题、清晰的功能补全、真实设备反馈和带验证记录的修复。

---

## 致谢

书签整理工具基于标准 Web 平台 API 构建，不捆绑任何第三方运行时库。开发过程中使用了以下工具和资源：

| 项目/资源 | 用途 |
| --- | --- |
| Chrome Extensions API | Bookmarks, Storage, Downloads, Action, i18n |
| Levenshtein 距离 | 重复检测的相似度评分 |
| CSS 自定义属性 | 通过动态变量级联构建主题皮肤系统 |
| GitHub Actions | 自动化跨平台构建和发布流水线 |
| sharp (Node.js) | 开发期间的图标批量生成 |

---

## 免责声明

> **Caution**
>
> 1. 本扩展会修改您的浏览器书签。虽然每次扫描前都会自动创建备份，但强烈建议在首次使用前手动导出一份备份。
> 2. 所有数据处理均在浏览器本地进行。不会向任何服务器上传书签数据。
> 3. 失效链接检测会向您的书签 URL 发送 HTTP 请求。请确保这符合您的网络环境和当地法规。
> 4. 如遇到数据丢失或异常行为，请立即从备份管理页面恢复。

---

## 许可证

[MIT License](LICENSE)

您可以自由使用、修改和分发此代码，包括用于商业项目。唯一要求是在再分发时保留原始许可证和版权声明。

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cheechang/BookmarkOrganizer&type=Date)](https://star-history.com/#cheechang/BookmarkOrganizer&Date)

---

Made by [cheechang](https://github.com/cheechang)
