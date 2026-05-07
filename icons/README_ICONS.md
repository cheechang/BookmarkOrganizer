# 图标文件说明

由于Chrome扩展需要PNG格式的图标文件,请按照以下步骤准备图标:

## 方法一: 使用在线转换工具(推荐)

1. 访问 https://cloudconvert.com/svg-to-png 或 https://convertio.co/zh/svg-png/
2. 上传 `icon16.svg`, `icon48.svg`, `icon128.svg` 文件
3. 设置输出尺寸为对应的 16x16, 48x48, 128x128
4. 下载转换后的PNG文件
5. 将PNG文件重命名为:
   - icon16.png
   - icon48.png
   - icon128.png
6. 放入 `icons/` 目录

## 方法二: 使用图片编辑软件

使用 Photoshop、GIMP 或其他图片编辑软件:
1. 打开SVG文件
2. 调整画布大小为对应尺寸
3. 导出为PNG格式
4. 保存到 `icons/` 目录

## 方法三: 使用命令行工具(需要安装ImageMagick)

```bash
# 安装 ImageMagick (如果尚未安装)
# Windows: choco install imagemagick
# macOS: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# 转换图标
convert -background none -resize 16x16 icons/icon16.svg icons/icon16.png
convert -background none -resize 48x48 icons/icon48.svg icons/icon48.png
convert -background none -resize 128x128 icons/icon128.svg icons/icon128.png
```

## 方法四: 使用简单的占位图标

如果暂时不需要精美图标,可以创建简单的彩色方块作为占位符:

```javascript
// 在浏览器控制台运行以下代码生成base64 PNG
function createPlaceholderIcon(size, color = '#667eea') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // 背景
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  
  // 文字
  ctx.fillStyle = 'white';
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📚', size / 2, size / 2);
  
  // 下载
  const link = document.createElement('a');
  link.download = `icon${size}.png`;
  link.href = canvas.toDataURL();
  link.click();
}

// 生成三个尺寸的图标
createPlaceholderIcon(16);
createPlaceholderIcon(48);
createPlaceholderIcon(128);
```

## 图标设计建议

- **简洁明了**: 使用书签、整理相关的图标元素
- **色彩协调**: 建议使用渐变色或品牌色
- **辨识度高**: 确保在小尺寸下也能清晰识别
- **风格统一**: 三个尺寸的图标应保持一致的视觉风格

## 免费图标资源

如果需要更专业的图标,可以从以下网站获取:
- https://www.flaticon.com/ (免费图标)
- https://iconscout.com/ (部分免费)
- https://thenounproject.com/ (免费需署名)

搜索关键词: bookmark, organize, library, folder
