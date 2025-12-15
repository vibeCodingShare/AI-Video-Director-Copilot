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
        "description": "Visual description",
        "shot_size": "Wide" | "Medium" | "Close-up" etc,
        "camera_move": "Static" | "Pan" etc,
        "lighting": "Natural" | "Softbox" etc
      },
      "image_prompt": "A detailed English prompt to generate a storyboard image for this scene",
      "editing_note": "Any specific editing instruction"
    }
  ]
}

Respond ONLY with the JSON. Do not add markdown backticks.
`;
};

export const buildEditingPlanPrompt = (projectData: any): string => {
  return `
Analyze the following video script and create a pacing and transition plan.

Script Data:
${JSON.stringify(projectData.scenes)}

Task:
Suggest transitions (Cut, Dissolve, Wipe, J-Cut, Match Cut) between scenes.
Suggest pacing notes.

Output JSON Format:
{
  "pacing_notes": "General advice on the video's rhythm",
  "timeline": [
    {
      "sceneId": 1,
      "transition": "Transition to next scene (e.g. Cut, J-Cut)",
      "duration": 5,
      "notes": "Specific rhythm note"
    }
    // ... for all scenes
  ]
}
Respond ONLY with the JSON.
`;
};
