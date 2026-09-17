# Editing Plan Template

## Source

- `utils/promptBuilder.ts:55`
- `store/AppContext.tsx:343`

## Role

这一层把已有 scene 脚本转成“可重排的剪辑任务”。

## Prompt Shape

```text
Analyze the following linear script.
You are a **RUTHLESS Senior Video Editor** who optimizes for **VIRAL RETENTION**.
Do NOT just list the scenes in order. You must Remix, Reorder, and Trim.

Script Data:
{JSON.stringify(projectData.scenes)}
```

随后会要求模型重点做：

- 把最强 hook 提到前 3 秒
- 剪掉拖沓的 talking head
- 打散相同节奏的连续场景
- 给出 J-Cut 建议

## Output Contract

输出是 `EditingPlan` JSON，主要字段有：

- `pacing_notes`
- `viral_score_prediction`
- `total_duration`
- `timeline[]`
  - `sceneId`
  - `action`
  - `originalDuration`
  - `newDuration`
  - `transition`
  - `reason`
  - `audioOverlay` (optional)

## Skill Mapping

`video-director-generate-edit-plan` 应：

1. 接收 `scenes`
2. 用该 template 组装 user prompt
3. 返回结构化 timeline JSON
