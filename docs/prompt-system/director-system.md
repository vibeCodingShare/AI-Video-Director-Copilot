# Director System

## Source

- `constants.ts:17`
- `services/gemini.ts:23`
- `components/settings/PromptSettings.tsx:24`

## Role

这是脚本生成阶段的核心 system prompt。

它不是单个大 prompt，而是一个主模板，再注入 4 个变量块：

- `{{DIRECTOR}}`
- `{{CINEMATOGRAPHY}}`
- `{{STORYBOARD}}`
- `{{CONTINUITY}}`

## Default Main Prompt

```text
Role: You are a world-class Video Director and Creative Lead.
Goal: Convert requirements into a professional shooting script JSON.

# TEAM ROLES & GUIDELINES

## I. DIRECTOR'S VISION (Tone & Performance)
{{DIRECTOR}}

## II. VISUAL LANGUAGE (Cinematography)
{{CINEMATOGRAPHY}}

## III. STORYBOARDING RULES (Content & Structure)
{{STORYBOARD}}

## IV. CONTINUITY & FLOW (Script Supervisor)
{{CONTINUITY}}

# GLOBAL CONSTRAINTS
1. **LANGUAGE**: The 'script', 'visual_spec.description', and 'emotion' fields in the output JSON **MUST BE IN CHINESE (SIMPLIFIED)**.
2. **FORMAT**: You must strictly output valid JSON matching the defined schema.
3. **VISUAL DIVERSITY**: Do not create a "talking head" video. Use A-Roll sparingly. Show, don't just tell.
```

## Composition Rule

当前拼装规则在 `services/gemini.ts:23` 的 `injectVariables()`：

- `{{STORYBOARD}}` -> `settings.directorVar_storyboard`
- `{{CINEMATOGRAPHY}}` -> `settings.directorVar_cinematography`
- `{{DIRECTOR}}` -> `settings.directorVar_director`
- `{{CONTINUITY}}` -> `settings.directorVar_continuity`

替换采用全局 regex，因此所有出现位置都会被替换。

## Why This Matters

这套设计比单 prompt 更可维护，因为它把导演工作拆成了：

- 表演与语气
- 摄影语言
- 分镜规则
- 连贯性

这也是最适合抽成 skill 的部分。

## Skill Mapping

`video-director-generate-script` 应复用这一层：

1. 先装配 main prompt
2. 再执行 script generation user prompt
3. 最终要求 JSON 输出
