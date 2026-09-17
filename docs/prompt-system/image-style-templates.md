# Image Style Templates

## Source

- `constants.ts:81`
- `services/gemini.ts:63`

## Role

这部分不是脚本 prompt，而是对每个 scene 的图片 prompt 做最后包装。

当前内置风格包括：

- Cinematic (Default)
- Anime Style
- Storyboard Sketch
- Cyberpunk/Neon
- Corporate Vector

## Template Rule

每个 style template 都是一段可复用文本。

如果模板里包含 `{{DESCRIPTION}}`：
- 用 `scene.visual_spec.description` 替换

否则：
- 自动拼成 `Subject: {visualDescription}`

最后都会再追加：
- `Detail: {imagePrompt}`

## Default Templates

### cinematic
```text
A cinematic shot of {{DESCRIPTION}}. Professional photography, ARRI Alexa, 50mm lens, depth of field, photorealistic, 8k, dramatic lighting.
```

### anime
```text
Anime key visual of {{DESCRIPTION}}. Makoto Shinkai style, vibrant colors, beautiful clouds, high quality 2D animation, detailed background.
```

### lineart
```text
Rough black and white storyboard sketch of {{DESCRIPTION}}. Pencil drawing on paper, loose lines, concept art, minimal details.
```

### cyberpunk
```text
Futuristic cyberpunk shot of {{DESCRIPTION}}. Neon lights, rain-slicked streets, purple and blue color palette, high contrast, blade runner aesthetic.
```

### minimal
```text
Flat vector illustration of {{DESCRIPTION}}. Corporate memphis style, minimal, clean solid colors, white background, tech startup aesthetic.
```

## Skill Mapping

第一版 skill 建议只做：

- 接收 scene 数据
- 根据 style 生成最终图片 prompt

不直接做图片 API 调用，这样更清楚，也更容易在不同模型之间复用。
