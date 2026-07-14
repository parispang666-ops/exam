# 环慧慧 EHS+ 企业安全生产考试管理系统 — 原型预览

高保真前端原型项目，用于演示企业考试管理功能的界面设计与交互流程。涵盖集团、下级单位、普通租户三种业务形态。

## 技术栈

- 纯原生 **HTML + CSS + JavaScript**，无框架依赖
- CSS 自定义变量驱动的统一设计系统
- Flexbox 布局 + iframe 内嵌原型导航

## 快速开始

直接在浏览器中打开 `index.html` 即可浏览所有原型页面。

```bash
open index.html
```

## 页面清单

### 考试管理

| 功能 | 集团 | 下级单位 | 普通租户 |
|------|:--:|:--:|:--:|
| 考试列表 | 考试列表-集团.html | 考试列表-下级单位.html | 考试列表-普通租户.html |
| 新增考试 | 新增考试-集团.html | 新增考试-下级单位.html | 新增考试-普通租户.html |
| 编辑考试 | 编辑考试-集团.html | 编辑考试-下级单位:独立租户.html | — |
| 考试统计 | 考试统计-集团.html | 考试统计-下级单位:独立租户.html | 考试统计-普通租户.html |

### 人员与记录

| 功能 | 集团 | 下级单位 |
|------|:--:|:--:|
| 人员选择 | 人员选择-集团.html | 人员选择-下级单位.html / 下级单位:本单位.html |
| 考试记录 | — | 考试记录-下级单位.html |

### 其他

- `规则说明.html` — 评分规则说明
- `小程序考试列表.html` — 小程序端考试列表

## 项目结构

```
.
├── index.html                  # 原型导航首页（侧边栏菜单 + iframe 加载）
├── assets/                     # 图片资源（SVG 图标）
├── prd/                        # PRD 文档（Markdown）
│   ├── 考试功能-整体PRD.md          # 全局功能 PRD
│   ├── 考试列表-集团.md
│   ├── 考试统计-集团.md
│   └── ...                     # 各页面详细 PRD
├── prd-annotation.css          # PRD 标注样式
├── prd-annotation.js           # PRD 标注交互脚本
└── *.html                      # 各功能原型页面
```

## PRD 标注系统

部分页面内嵌 **结构化 PRD 标注**（角标 + 全局抽屉），标注配置以 JSON 形式写入页面底部的 `<script type="application/json" id="prd-annotation-config">` 中。

**标注可见性规则：**
- `::before` 中的 `content` 为空时，相应角标自动隐藏
- 打开 iframe 弹窗时自动隐藏抽屉切换按钮
- `alert` 模态框打开时自动隐藏 PRD 角标和相关 UI

## 设计规范

| 属性 | 值 |
|------|------|
| 品牌主色 | `#1570EF` |
| 字体 | PingFang SC / HarmonyOS Sans SC / Microsoft YaHei |
| 圆角 | `--radius-xs` ~ `--radius-xl` |
| 阴影 | `--shadow-sm` / `--shadow-md` / `--shadow-lg` |
