# Prompt System Extraction

这套文档把 `AI Video Director Copilot` 里的核心 prompt 资产单独抽出来，作为可复用的创作工作流资料。

## 目标

这不是应用使用说明，也不是 UI 文档。

它只回答 4 件事：

1. 当前项目里有哪些核心 prompt 资产
2. 这些 prompt 是怎么拼装的
3. 每个阶段的输入和输出是什么
4. 这些 prompt 如何被复用为 Claude Code skills

## Prompt Workflow

当前项目的核心工作流分成 4 段：

1. Intent Analysis
2. Script Generation
3. Edit Plan Generation
4. Image Prompt Assembly

运行顺序参考：
- `store/AppContext.tsx:264`
- `store/AppContext.tsx:328`

## Core Source Files

- `constants.ts`：默认 prompt 与图片风格模板
- `utils/promptBuilder.ts`：脚本与剪辑阶段的 user prompt builder
- `services/gemini.ts`：prompt 拼装与运行时编排
- `types.ts`：输入输出的数据结构

## Extracted Asset Map

- `intent-analysis.md`
- `director-system.md`
- `director-partials/storyboard.md`
- `director-partials/cinematography.md`
- `director-partials/director.md`
- `director-partials/continuity.md`
- `script-generation-template.md`
- `editing-plan-system.md`
- `editing-plan-template.md`
- `image-style-templates.md`
- `json-schemas.md`

## Reuse Strategy

建议把这套 prompt 体系复用为：

- 一个总 skill：`video-director`
- 四个子 skill：
  - `video-director-analyze-intent`
  - `video-director-generate-script`
  - `video-director-generate-edit-plan`
  - `video-director-generate-image-prompts`

这样做的重点不是“复制应用”，而是把 prompt 从 UI 和 provider 逻辑里解耦出来，变成更直接的工作流资产。
