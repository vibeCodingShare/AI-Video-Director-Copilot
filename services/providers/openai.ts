
import { ModelConfig } from '../../types';

export const callOpenAICompatible = async (
  config: ModelConfig, 
  prompt: string, 
  systemInstruction?: string, 
  jsonMode: boolean = false
): Promise<string> => {
  if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
  const baseUrl = config.baseUrl?.replace(/\/+$/, '') || 'https://api.openai.com/v1';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`
  };

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const body: any = {
    model: config.modelId,
    messages: messages,
    max_tokens: 4000, // Sufficient for detailed shooting scripts
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Compatible API Error: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e: any) {
    console.error("OpenAI Call Failed", e);
    throw e;
  }
};

export const callOpenAICompatibleImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
  if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
  const baseUrl = config.baseUrl?.replace(/\/+$/, '') || 'https://api.openai.com/v1';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`
  };

  const body = {
    model: config.modelId,
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json" 
  };

  try {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Image Gen API Error: ${err}`);
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (b64) {
      return `data:image/png;base64,${b64}`; 
    }
    const url = data.data?.[0]?.url;
    if (url) return url;

    throw new Error("No image data found in response");
  } catch (e) {
    console.error("Image Gen Failed", e);
    throw e;
  }
};
