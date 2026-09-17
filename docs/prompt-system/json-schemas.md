# JSON Schemas

## Source

- `types.ts:31`
- `types.ts:38`
- `types.ts:51`
- `types.ts:80`
- `types.ts:90`

## ProjectData

```ts
interface ProjectData {
  project_summary: string;
  scenes: Scene[];
}
```

## Scene

```ts
interface Scene {
  id: number;
  type: 'A-Roll' | 'B-Roll' | 'Screencast' | 'Macro' | 'Infographic';
  duration_sec: number;
  script: string;
  emotion?: string;
  visual_spec: {
    description: string;
    shot_size: string;
    camera_move: string;
    lighting: string;
  };
  image_prompt: string;
  editing_note?: string;
  generated_image_url?: string;
  image_style_preset?: string;
}
```

## EditingPlan

```ts
interface EditingPlan {
  timeline: EditingPlanItem[];
  pacing_notes: string;
  total_duration: number;
  viral_score_prediction: number;
}
```

## EditingPlanItem

```ts
interface EditingPlanItem {
  sceneId: number;
  action: 'KEEP' | 'TRIM' | 'MOVE_TO_START' | 'REORDER';
  originalDuration: number;
  newDuration: number;
  transition: string;
  reason: string;
  audioOverlay?: string;
}
```

## Why This Matters For Skills

skill 的输出应该尽量对齐这些结构，而不是重新起一套名字。

这样做的好处：

- 与当前应用数据兼容
- 文档和运行时更一致
- 后续可以直接把 skill 输出回灌到项目里
