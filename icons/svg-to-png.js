const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const icons = [
  { svg: 'icon16.svg',  png: 'icon16.png',  size: 16 },
  { svg: 'icon48.svg',  png: 'icon48.png',  size: 48 },
  { svg: 'icon128.svg', png: 'icon128.png', size: 128 }
];

async function convert() {
  const dir = __dirname;
  for (const icon of icons) {
    const svgPath = path.join(dir, icon.svg);
    const pngPath = path.join(dir, icon.png);

    if (!fs.existsSync(svgPath)) {
      console.error(`❌ 找不到文件: ${icon.svg}`);
      continue;
    }

    try {
      await sharp(svgPath)
        .resize(icon.size, icon.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(pngPath);
      console.log(`✅ ${icon.svg} → ${icon.png} (${icon.size}x${icon.size})`);
    } catch (err) {
      console.error(`❌ 转换失败 ${icon.svg}: ${err.message}`);
    }
  }
}

convert().catch(console.error);
