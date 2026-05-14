# 图标文件说明

本项目使用一套统一设计的矢量图标，体现「书签整理」的核心功能。

## 图标设计

### 设计理念：Organized Bookmark（有序书签）

| 元素 | 说明 |
|------|------|
| **渐变背景** | 圆角矩形，对角线渐变 `#667eea` → `#764ba2`，与扩展主题色保持一致 |
| **书签主体** | 白色旗帜形书签，底部 V 型切口，象征书签功能 |
| **列表线条** | 书签内的横线代表整理后的有序列表，暗示分类与归纳 |
| **完成标记** | 右下角的白色圆形 + 紫色对勾（48px / 128px），表示整理完成、链接有效 |

### 三种尺寸

| 文件 | 尺寸 | 设计特点 |
|------|------|----------|
| `icon16.svg` | 16 x 16 | 极简设计：书签 + 2 条横线，确保工具栏小图标清晰可辨 |
| `icon48.svg` | 48 x 48 | 标准设计：书签 + 3 条横线 + 完成对勾，用于扩展管理页 |
| `icon128.svg`| 128 x 128| 完整设计：阴影效果 + 4 条横线 + 完成对勾，用于商店展示 |

> 所有图标均为 **SVG 矢量格式**，可无损缩放。Chrome 扩展运行时实际使用的是导出的 **PNG** 文件。

---

## 生成 PNG 图标

### 方法一：浏览器工具（推荐，无需安装任何软件）

1. 用浏览器打开 `icons/generate-icons.html`
2. 在「图标预览」区域查看效果
3. 点击「批量下载全部 PNG」按钮，即可获取三个尺寸的 PNG 文件
4. 如需自定义尺寸或修改后的 SVG，使用「自定义 SVG 转 PNG」功能

### 方法二：在线转换工具

1. 访问 https://cloudconvert.com/svg-to-png 或 https://convertio.co/zh/svg-png/
2. 分别上传 `icon16.svg`、`icon48.svg`、`icon128.svg`
3. 设置输出尺寸为对应的 16x16、48x48、128x128
4. 下载转换后的 PNG 文件

### 方法三：ImageMagick（命令行）

```bash
# Windows (PowerShell)
magick -background none icons/icon16.svg  -resize 16x16  icons/icon16.png
magick -background none icons/icon48.svg  -resize 48x48  icons/icon48.png
magick -background none icons/icon128.svg -resize 128x128 icons/icon128.png

# macOS / Linux
convert -background none icons/icon16.svg  -resize 16x16  icons/icon16.png
convert -background none icons/icon48.svg  -resize 48x48  icons/icon48.png
convert -background none icons/icon128.svg -resize 128x128 icons/icon128.png
```

### 方法四：图片编辑软件

使用 Photoshop、GIMP、Figma、Sketch 等软件：
1. 打开 SVG 文件
2. 设置画布大小为对应尺寸（16x16、48x48、128x128）
3. 导出为 PNG 格式（保留透明背景）
4. 保存到 `icons/` 目录

---

## 修改图标设计

如需调整图标样式，直接编辑对应的 `.svg` 文件即可：

- **更换配色**：修改 `<linearGradient>` 中的 `stop-color` 值
- **调整圆角**：修改 `<rect>` 的 `rx` 属性
- **增删元素**：书签内的横线数量、完成标记的大小等

修改后使用上述任意方法重新生成 PNG。

---

## 图标设计建议

- **简洁明了**：小尺寸下图标元素不宜过多，16px 版本已做极简处理
- **色彩协调**：渐变方案与扩展 UI 的 `#667eea` 主题色保持一致
- **辨识度高**：书签旗帜形状在浏览器工具栏中具有高度辨识度
- **风格统一**：三种尺寸保持一致的视觉语言，细节随尺寸递增

## 免费图标资源

如需完全不同的设计风格，可以从以下网站获取灵感或素材：
- https://www.flaticon.com/ (免费矢量图标)
- https://iconscout.com/ (部分免费)
- https://thenounproject.com/ (免费需署名)

搜索关键词：`bookmark`, `organize`, `folder`, `check`, `list`
