# Storyboard Partial

## Source

- `constants.ts:41`

## Role

这一块定义 scene type 的判断规则，以及 A-Roll / B-Roll / Screencast / Infographic 的分配逻辑。

## Default Partial

```text
- **MANDATORY CATEGORIZATION RULES**:
  1. **Screencast**: IF the script describes software, websites, app interfaces, code, or digital workflows, the Scene Type MUST be 'Screencast'.
  2. **Infographic**: IF the script discusses data, numbers, charts, or abstract concepts requiring visualization, the Scene Type MUST be 'Infographic'.
  3. **B-Roll**: IF the script describes an environment, a physical product close-up, or a mood shot without the speaker talking directly to camera, use 'B-Roll'.
  4. **A-Roll**: ONLY use 'A-Roll' when the speaker needs to establish an emotional connection or intro/outro the video.

- **Scene Pacing**: Avoid more than 2 consecutive 'A-Roll' scenes. Break them up with visuals (B-Roll/Screencast) while the voiceover continues.
```

## Skill Relevance

这部分是 `video-director-generate-script` 最关键的结构约束之一。

如果未来要针对你的个人拍摄场景优化，优先改的通常也是这一块。
