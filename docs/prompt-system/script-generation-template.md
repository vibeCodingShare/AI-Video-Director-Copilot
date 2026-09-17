# Script Generation Template

## Source

- `utils/promptBuilder.ts:4`
- `services/gemini.ts:119`

## Role

这一层是脚本阶段的 user prompt builder。

它把运行时输入拼成一个明确任务：

- 给出 persona
- 给出目标时长
- 给出 raw content
- 给出附加要求
- 强制要求输出固定 JSON 结构

## Runtime Inputs

- `persona`
- `targetDuration`
- `rawContent`
- `additionalPrompt`

## Prompt Shape

```text
Context/Persona: {persona}
Target Duration: {targetDuration} seconds (approx)

Raw Content:
"""
{rawContent}
"""

Additional Instructions:
{additionalPrompt}

---
Task:
Convert the raw content into a video script JSON.
Calculate the duration of each scene carefully to match the total target duration.
```

同时还包含关键视觉规则：

- 不允许全 A-Roll
- 软件/UI/数字流程必须优先是 Screencast
- 比喻/环境/物理反应优先 B-Roll
- A-Roll 和其他视觉类型应交替出现

## Output Contract

输出必须是 `ProjectData` 风格的 JSON：

- `project_summary`
- `scenes[]`
  - `id`
  - `type`
  - `duration_sec`
  - `script`
  - `emotion`
  - `visual_spec`
  - `image_prompt`
  - `editing_note`

详细字段见 `json-schemas.md`。

## Runtime Notes

当前在 `services/gemini.ts:131`：

- 对非 Google provider 还会附加 JSON-only 强约束
- 返回结果会去掉 ```json 包裹再解析

## Skill Mapping

`video-director-generate-script` 应该：

1. 先准备 director system prompt
2. 再用这个 template 组装 user prompt
3. 返回严格 JSON
