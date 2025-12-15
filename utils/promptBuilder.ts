
import { ProjectInput } from '../types';

export const buildScriptGenerationPrompt = (input: ProjectInput): string => {
  return `
Context/Persona: ${input.persona}
Target Duration: ${input.targetDuration} seconds (approx)

Raw Content:
"""
${input.rawContent}
"""

Additional Instructions:
${input.additionalPrompt}

---
Task:
Convert the raw content into a video script JSON.
Calculate the duration of each scene carefully to match the total target duration.

**CRITICAL VISUAL RULES (STRICT COMPLIANCE REQUIRED):**
1. **NO "Talking Head" Marathons**: Do not create a script that is 100% "A-Roll". This is a failure.
2. **Screencasts**: If the content mentions a software feature, UI, website, app, or digital step, the scene type MUST be "Screencast". The visual description must describe the cursor movement, click, or UI change.
3. **B-Roll**: If the content is metaphorical, setting a scene, or showing a physical reaction, use "B-Roll".
4. **Diversity**: You must alternate between A-Roll and other types. A good ratio is 30% A-Roll, 70% Visuals (B-Roll/Screencast/Infographic).

The output MUST be a valid JSON object matching the following structure exactly:

{
  "project_summary": "Short summary of the video",
  "scenes": [
    {
      "id": 1,
      "type": "A-Roll" | "B-Roll" | "Screencast" | "Macro" | "Infographic",
      "duration_sec": 5,
      "script": "Spoken words or visual description if no speech",
      "emotion": "Tone of the scene",
      "visual_spec": {
        "description": "Visual description. If Screencast, describe the UI action.",
        "shot_size": "Wide" | "Medium" | "Close-up" etc,
        "camera_move": "Static" | "Pan" etc,
        "lighting": "Natural" | "Softbox" etc
      },
      "image_prompt": "A detailed English prompt to generate a storyboard image for this scene. If Screencast, describe the UI layout.",
      "editing_note": "Any specific editing instruction"
    }
  ]
}

Respond ONLY with the JSON. Do not add markdown backticks.
`;
};

export const buildEditingPlanPrompt = (projectData: any): string => {
  return `
Analyze the following linear script.
You are a **RUTHLESS Senior Video Editor** who optimizes for **VIRAL RETENTION**.
Do NOT just list the scenes in order. You must Remix, Reorder, and Trim.

Script Data:
${JSON.stringify(projectData.scenes)}

# YOUR MANDATE:
1. **HOOK (First 3 Seconds)**: Identify the most visually engaging or high-stakes scene from the entire script. Move it to the very beginning as a "Cold Open" / "Teaser".
2. **KILL THE BORING**: If a scene is an "A-Roll" talking head that lasts >5 seconds, you MUST perform a 'TRIM' action to cut it down to the essential soundbite, or note that B-Roll should cover it.
3. **PACING**: Ensure no two consecutive scenes have the exact same duration. Create a rhythm (Short, Short, Long, Short).
4. **J-CUTS**: Look for opportunities where the audio of the next scene should start *before* the video cuts.

# OUTPUT FORMAT
Return a valid JSON object.
"action" must be one of: "KEEP" (No change), "TRIM" (Shortened), "MOVE_TO_START" (The Hook), "REORDER" (Moved elsewhere).

{
  "pacing_notes": "Your aggressive strategy for this edit (e.g. 'I moved the explosion to the start to hook the viewer...')",
  "viral_score_prediction": 8,
  "total_duration": 120,
  "timeline": [
    {
      "sceneId": 1,
      "action": "KEEP" | "TRIM" | "MOVE_TO_START" | "REORDER",
      "originalDuration": 10,
      "newDuration": 5,
      "transition": "J-Cut / Hard Cut / Whip Pan",
      "reason": "Trimmed 5s of silence to keep energy high.",
      "audioOverlay": "Start audio of Scene 2 here" (optional)
    }
    // ... order the array in the FINAL PLAYBACK ORDER
  ]
}

Respond ONLY with the JSON.
`;
};
