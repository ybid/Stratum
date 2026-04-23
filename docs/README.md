# Stratum 文档索引

## 文档目录

| 文档 | 说明 |
|------|------|
| [TECHNICAL.md](./TECHNICAL.md) | 技术文档 - 类型定义、数据模型、组件架构 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 架构设计 - 整体架构、数据流、交互流程 |
| [REFACTORING.md](./REFACTORING.md) | 重构指南 - ID生成、持久化、状态拆分建议 |
| [TESTING.md](./TESTING.md) | 测试指南 - Vitest + Playwright 配置与示例 |
| [FEATURES.md](./FEATURES.md) | 功能增强建议 - 导入导出、撤销重做等 |

## 快速导航

### 开发者
- 新人接手 → [TECHNICAL.md](./TECHNICAL.md)
- 理解架构 → [ARCHITECTURE.md](./ARCHITECTURE.md)
- 编写测试 → [TESTING.md](./TESTING.md)

### 重构相关
- 了解可改进点 → [REFACTORING.md](./REFACTORING.md)
- ID生成、存储层、Store拆分

### 功能规划
- 查看计划功能 → [FEATURES.md](./FEATURES.md)
- 优先级矩阵

---

## 项目信息

- **技术栈**: Next.js 16 + TypeScript + Tailwind CSS v4 + Zustand
- **包管理**: pnpm
- **持久化**: localStorage
- **状态**: ~800 行 TypeScript
