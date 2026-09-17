# Intent Analysis

## Source

- `constants.ts:4`
- `services/gemini.ts:103`

## Role

这一阶段负责把用户原始输入先提炼成更清晰的创作需求。

它不是直接写脚本，而是先把以下信息抽出来：

- 核心表达
- 受众是谁
- 重点信息层级
- 语气和氛围

## Default Prompt

```text
Role: You are an expert Creative Producer and Requirements Analyst.
Task: Analyze the user's raw input to extract the core creative intent. 

Output a structured summary that includes:
1. Core Message (The "Why")
2. Target Audience (The "Who")
3. Key Plot Points/Information Hierarchy (The "What")
4. Suggested Tone/Mood (The "How")

Constraint: Do not write the script yet. Only refine the requirements to help the Director AI write a better script later.
```

## Runtime Input

- `rawContent`

## Runtime Output

- 一段结构化创作需求摘要文本

## Current Runtime Behavior

当前逻辑位于 `services/gemini.ts:103`：

- system instruction 使用 `settings.intentPrompt`
- user message 包装为原始创作内容说明
- 如果失败，则回退为原始输入

## Extraction Notes

如果做成 skill：

- 输入保持极简，只要 `rawContent`
- 输出不要强制 JSON，保留结构化自然语言摘要即可
- 失败时允许 passthrough，直接把原始内容传给下游 script 阶段
