// 图标生成器脚本 - 从 generate-icons.html 提取以避免内联脚本 CSP 问题

// 内嵌 SVG 代码（当前版本）
const icons = [
  {
    name: 'icon16',
    size: 16,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><defs><linearGradient id="g16" x1="0" y1="0" x2="16" y2="16"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient></defs><rect width="16" height="16" rx="3.5" fill="url(#g16)"/><path d="M4 2h8v11.5L8 10.5 4 13.5z" fill="white"/><rect x="5" y="3.5" width="6" height="1.2" rx="0.6" fill="#667eea" opacity="0.5"/><rect x="5" y="6" width="4" height="1.2" rx="0.6" fill="#667eea" opacity="0.5"/></svg>`
  },
  {
    name: 'icon48',
    size: 48,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><defs><linearGradient id="g48" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#g48)"/><path d="M13 7h22v34L24 33 13 41z" fill="white"/><rect x="16" y="11" width="16" height="2.5" rx="1.25" fill="#667eea" opacity="0.45"/><rect x="16" y="16" width="12" height="2.5" rx="1.25" fill="#667eea" opacity="0.45"/><rect x="16" y="21" width="14" height="2.5" rx="1.25" fill="#667eea" opacity="0.45"/><circle cx="38.5" cy="38.5" r="5.5" fill="white"/><path d="M36 38.5l2 2 3.5-3.5" stroke="#764ba2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
  },
  {
    name: 'icon128',
    size: 128,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g128" x1="0" y1="0" x2="128" y2="128"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient><filter id="sh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.15"/></filter></defs><rect width="128" height="128" rx="28" fill="url(#g128)"/><path d="M32 20h64v96L64 104 32 116z" fill="white" filter="url(#sh)"/><rect x="42" y="26" width="44" height="5.5" rx="2.75" fill="#667eea" opacity="0.35"/><rect x="42" y="38" width="36" height="5.5" rx="2.75" fill="#667eea" opacity="0.35"/><rect x="42" y="50" width="40" height="5.5" rx="2.75" fill="#667eea" opacity="0.35"/><rect x="42" y="62" width="32" height="5.5" rx="2.75" fill="#667eea" opacity="0.35"/><circle cx="99" cy="99" r="14" fill="white" filter="url(#sh)"/><path d="M91.5 99l4.5 4.5 11-11" stroke="#764ba2" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
  }
];

// 渲染预览
function renderPreviews() {
  const grid = document.getElementById('previewGrid');
  icons.forEach(icon => {
    const blob = new Blob([icon.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const item = document.createElement('div');
    item.className = 'preview-item';
    // 放大显示以便查看细节（16px 的放大到 96px 显示）
    const displaySize = Math.max(icon.size, 96);

    const img = document.createElement('img');
    img.src = url;
    img.width = displaySize;
    img.height = displaySize;
    img.alt = icon.name;

    const sizeLabel = document.createElement('div');
    sizeLabel.className = 'size-label';
    sizeLabel.textContent = icon.name;

    const pxLabel = document.createElement('div');
    pxLabel.className = 'px-label';
    pxLabel.textContent = `${icon.size} x ${icon.size} px`;

    item.appendChild(img);
    item.appendChild(sizeLabel);
    item.appendChild(pxLabel);
    grid.appendChild(item);
  });
}

// SVG 转 PNG 下载
function svgToPng(svgString, size, filename) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      // 使用高质量缩放
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        resolve();
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG load failed'));
    };

    img.src = url;
  });
}

// 批量下载
async function downloadAll() {
  const btn = document.getElementById('downloadAllBtn');
  const originalText = btn.textContent;
  btn.textContent = '下载中...';
  btn.disabled = true;

  try {
    for (const icon of icons) {
      await svgToPng(icon.svg, icon.size, `${icon.name}.png`);
      await new Promise(r => setTimeout(r, 200)); // 避免浏览器阻塞
    }
    btn.textContent = '下载完成！';
    setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2000);
  } catch (err) {
    alert('下载失败: ' + err.message);
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// 自定义转换
async function convertCustom() {
  const fileInput = document.getElementById('svgInput');
  const sizeSelect = document.getElementById('sizeSelect');

  if (!fileInput.files.length) {
    alert('请先选择一个 SVG 文件');
    return;
  }

  const file = fileInput.files[0];
  const size = parseInt(sizeSelect.value);
  const svgText = await file.text();

  const btn = document.getElementById('convertCustomBtn');
  const originalText = btn.textContent;
  btn.textContent = '转换中...';
  btn.disabled = true;

  try {
    const filename = file.name.replace('.svg', `_${size}.png`);
    await svgToPng(svgText, size, filename);
    btn.textContent = '转换完成！';
    setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2000);
  } catch (err) {
    alert('转换失败: ' + err.message);
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  renderPreviews();
  document.getElementById('downloadAllBtn').addEventListener('click', downloadAll);
  document.getElementById('convertCustomBtn').addEventListener('click', convertCustom);
});
