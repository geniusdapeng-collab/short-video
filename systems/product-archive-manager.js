/**
 * 商品档案库管理器
 * 版本: v0.4.0-commercial
 * 功能: 商品注册、定妆照管理、商品查询
 */

'use strict';

const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');

class ProductArchiveManager {
  constructor(options = {}) {
    this.baseDir = options.baseDir || (process.cwd().includes('short-video-system') 
      ? path.join(process.cwd(), 'products')
      : path.join(process.cwd(), 'short-video-system', 'products'));
    this.registryFile = path.join(this.baseDir, 'product-registry.json');
    this.registry = { products: [], lastUpdated: null };
    this._ensureBaseDir();
  }

  async _ensureBaseDir() {
    if (!fss.existsSync(this.baseDir)) {
      await fs.mkdir(this.baseDir, { recursive: true });
    }
    await this._loadRegistry();
  }

  async _loadRegistry() {
    try {
      const data = await fs.readFile(this.registryFile, 'utf-8');
      this.registry = JSON.parse(data);
    } catch (e) {
      this.registry = { products: [], lastUpdated: new Date().toISOString() };
      await this._saveRegistry();
    }
  }

  async _saveRegistry() {
    this.registry.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.registryFile, JSON.stringify(this.registry, null, 2));
  }

  /**
   * 注册新商品
   * @param {Object} productInfo 商品信息
   * @param {Array} portraitFiles 定妆照文件路径数组
   */
  async registerProduct(productInfo, portraitFiles = []) {
    const productId = productInfo.id || this._generateProductId(productInfo.name);
    const productDir = path.join(this.baseDir, productId);
    const portraitsDir = path.join(productDir, 'portraits');

    // 创建目录
    await fs.mkdir(productDir, { recursive: true });
    await fs.mkdir(portraitsDir, { recursive: true });

    // 保存定妆照
    const portraits = {};
    const portraitNames = ['closeup', 'front', 'side', 'threeQuarter'];
    for (let i = 0; i < portraitFiles.length && i < 4; i++) {
      const ext = path.extname(portraitFiles[i]) || '.png';
      const destName = `${portraitNames[i]}${ext}`;
      const destPath = path.join(portraitsDir, destName);
      await fs.copyFile(portraitFiles[i], destPath);
      portraits[portraitNames[i]] = `portraits/${destName}`;
    }

    // 构建完整商品档案
    const fullProductInfo = {
      ...productInfo,
      id: productId,
      portraits,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      usageHistory: []
    };

    // 保存商品信息
    await fs.writeFile(
      path.join(productDir, 'product-info.json'),
      JSON.stringify(fullProductInfo, null, 2)
    );

    // 生成商品卡片
    await this._generateProductCard(fullProductInfo, productDir);

    // 更新注册表
    const existingIndex = this.registry.products.findIndex(p => p.id === productId);
    if (existingIndex >= 0) {
      this.registry.products[existingIndex] = { id: productId, name: productInfo.name, category: productInfo.category };
    } else {
      this.registry.products.push({ id: productId, name: productInfo.name, category: productInfo.category });
    }
    await this._saveRegistry();

    console.log(`[ProductArchive] ✅ 商品已注册: ${productId} | ${productInfo.name}`);
    return { productId, productInfo: fullProductInfo };
  }

  /**
   * 获取商品信息
   */
  async getProduct(productId) {
    const productDir = path.join(this.baseDir, productId);
    const infoPath = path.join(productDir, 'product-info.json');
    try {
      const data = await fs.readFile(infoPath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  /**
   * 列出所有商品
   */
  async listProducts() {
    await this._loadRegistry();
    return this.registry.products;
  }

  /**
   * 更新商品使用记录
   */
  async recordUsage(productId, videoId) {
    const product = await this.getProduct(productId);
    if (!product) return false;

    product.usageCount += 1;
    product.usageHistory.push({ videoId, usedAt: new Date().toISOString() });
    product.updatedAt = new Date().toISOString();

    const productDir = path.join(this.baseDir, productId);
    await fs.writeFile(
      path.join(productDir, 'product-info.json'),
      JSON.stringify(product, null, 2)
    );

    return true;
  }

  /**
   * 生成商品描述卡片
   */
  async _generateProductCard(productInfo, productDir) {
    const card = `# ${productInfo.name} 商品卡片

## 基本信息
- **ID**: ${productInfo.id}
- **品牌**: ${productInfo.brand || '未知'}
- **类别**: ${productInfo.category || '未分类'}
- **型号**: ${productInfo.model || '未指定'}
- **描述**: ${productInfo.description || '无描述'}

## 视觉特征
${productInfo.visualFeatures ? Object.entries(productInfo.visualFeatures).map(([k, v]) => `- **${k}**: ${v}`).join('\n') : '未定义'}

## 适用场景
${productInfo.usageScenarios ? productInfo.usageScenarios.map(s => `- ${s}`).join('\n') : '未定义'}

## 植入策略
${productInfo.implantStrategy ? Object.entries(productInfo.implantStrategy).map(([k, v]) => `- **${k}**: ${v}`).join('\n') : '未定义'}

## 定妆照
${Object.entries(productInfo.portraits || {}).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## 使用统计
- **使用次数**: ${productInfo.usageCount || 0}
- **创建时间**: ${productInfo.createdAt || '未知'}
- **更新时间**: ${productInfo.updatedAt || '未知'}
`;

    await fs.writeFile(path.join(productDir, 'product-card.md'), card);
  }

  _generateProductId(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }
}

module.exports = { ProductArchiveManager };
