
import { ModelConfig } from '../../types';

export const callAnthropicText = async (
  config: ModelConfig, 
  prompt: string, 
  systemInstruction?: string, 
  jsonMode: boolean = false
): Promise<string> => {
  if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
  const baseUrl = config.baseUrl?.replace(/\/+$/, '') || 'https://api.anthropic.com/v1';
  
  // Anthropic headers are specific
  const headers = {
    'content-type': 'application/json',
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01',
    // Note: Browser-based calls to api.anthropic.com often fail CORS without a proxy.
    // However, if the user provides a proxy URL in settings, this will work.
    'anthropic-dangerous-direct-browser-access': 'true' 
  };

  const messages = [];
  messages.push({ role: 'user', content: prompt });

  const body: any = {
    model: config.modelId,
    messages: messages,
    max_tokens: 4096, // Anthropic requires max_tokens to be set
  };

  if (systemInstruction) {
      body.system = systemInstruction;
  }

  // Claude doesn't have a strict 'json_object' flag like OpenAI, 
  // but we rely on the prompt instructions injected by the orchestrator.

  try {
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API Error: ${err}`);
    }

    const data = await response.json();
    
    // Extract text content from content blocks
    if (data.content && Array.isArray(data.content)) {
        const textBlock = data.content.find((c: any) => c.type === 'text');
        return textBlock ? textBlock.text : "";
    }
    
    return "";
  } catch (e: any) {
    console.error("Anthropic Call Failed", e);
    throw e;
  }
};
