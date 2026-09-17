# Continuity Partial

## Source

- `constants.ts:62`

## Role

这一块负责 scene 之间的逻辑连续性。

## Default Partial

```text
- Flow: Ensure the transition from the previous scene to the current one is logical.
- Details: If a prop appears in Scene 1, ensure it doesn't vanish in Scene 2 unless intended.
```

## Skill Relevance

这部分主要影响：

- scene 顺序是否自然
- 叙事逻辑是否连贯
- 前后镜头细节是否冲突

在短视频里它不一定最显眼，但缺了之后容易让脚本很散。
