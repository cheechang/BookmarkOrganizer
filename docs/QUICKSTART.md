# 快速开始指南

## 🚀 5分钟快速安装和使用

### 第一步: 准备图标文件 (1分钟)

**最简单的方法** - 在浏览器中生成占位图标:

1. 打开Chrome浏览器
2. 按 `F12` 打开开发者工具
3. 切换到 Console (控制台) 标签
4. 复制粘贴以下代码并按回车:

```javascript
function createIcon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#667eea';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = 'white';
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📚', size / 2, size / 2);
  const link = document.createElement('a');
  link.download = `icon${size}.png`;
  link.href = canvas.toDataURL();
  link.click();
}
createIcon(16);
setTimeout(() => createIcon(48), 500);
setTimeout(() => createIcon(128), 1000);
```

5. 会自动下载3个PNG文件
6. 将它们重命名为 `icon16.png`, `icon48.png`, `icon128.png`
7. 移动到 `BookmarkOrganizer/icons/` 文件夹

### 第二步: 加载插件到Chrome (1分钟)

1. 打开Chrome浏览器
2. 在地址栏输入: `chrome://extensions/`
3. 开启右上角的 **"开发者模式"** 开关
4. 点击左上角的 **"加载已解压的扩展程序"** 按钮
5. 选择 `BookmarkOrganizer` 文件夹
6. 插件安装成功! 🎉

### 第三步: 开始使用 (3分钟)

1. **打开插件**
   - 点击Chrome工具栏右上角的插件图标
   - 如果没看到,点击拼图图标🧩找到"Bookmark Organizer"

2. **扫描分析**
   - 点击 **"🔍 开始扫描分析"** 按钮
   - 等待分析完成(会自动备份你的书签)
   - 查看统计信息

3. **查看分类建议**
   - 在"分类建议"标签页查看自动分类结果
   - 每个书签显示置信度(高/中/低)
   - 取消勾选不想移动的书签

4. **应用分类**
   - 点击 **"✓ 应用分类"** 按钮
   - 确认操作
   - 插件会自动创建文件夹并移动书签

5. **清理重复**
   - 切换到"重复检测"标签页
   - 查看发现的重复书签
   - 每组选择一个要保留的
   - 点击 **"🗑 清理选中的重复项"**

6. **管理备份**
   - 切换到"备份管理"标签页
   - 查看所有备份记录
   - 可以随时恢复到任意备份点

## 💡 使用技巧

### 首次使用建议
1. ✅ 先手动通过Chrome书签管理器导出完整备份
2. ✅ 让插件自动备份后再进行操作
3. ✅ 先小范围测试,确认效果满意再批量应用

### 提高分类准确度
- 编辑 `rules/categories.json` 添加你自己的关键词
- 域名匹配权重最高,确保添加常用网站域名
- 可以添加中英文关键词提高匹配率

### 处理大量书签
- 如果有超过1000个书签,分析可能需要几分钟
- 保持弹窗打开,不要关闭浏览器
- 可以分批处理,先应用高置信度的分类

### 备份策略
- 开启自动备份功能(默认开启)
- 重要操作前手动备份一次
- 定期清理旧备份释放空间
- 保留至少2-3个最近的备份

## ❓ 遇到问题?

### 插件图标不显示
- 检查 `icons/` 目录下是否有PNG文件
- 确保文件名正确: icon16.png, icon48.png, icon128.png
- 重新加载插件: 在 `chrome://extensions/` 点击刷新按钮

### 扫描没有反应
- 打开开发者工具(F12)查看Console是否有错误
- 确认有书签权限: 在 `chrome://extensions/` 查看权限
- 尝试重新加载插件

### 分类不准确
- 编辑 `rules/categories.json` 添加更多关键词
- 域名匹配最准确,优先添加常用网站域名
- 可以手动调整,只应用高置信度的分类

### 恢复备份失败
- 确认备份数据存在
- 检查存储空间是否充足
- 尝试使用Chrome书签管理器导入之前导出的备份

## 🎯 下一步

- ⭐ 给项目点个Star支持开发
- 📝 阅读完整的 [README.md](README.md) 了解更多功能
- 🔧 自定义分类规则适应你的需求
- 💬 提交Issue反馈问题或建议

---

**享受整洁的书签吧!** 📚✨
