
import { GoogleGenAI } from "@google/genai";
import { AppSettings, ProjectData, EditingPlan, ModelConfig } from '../types';

// Helper to get the active config
const getActiveTextConfig = (settings: AppSettings): ModelConfig | undefined => {
  return settings.textModels.find(m => m.id === settings.activeTextModelId);
};

const getActiveImageConfig = (settings: AppSettings): ModelConfig | undefined => {
  return settings.imageModels.find(m => m.id === settings.activeImageModelId);
};

// --- GENERIC API CALLERS ---

const callGoogleGenAI = async (
  config: ModelConfig, 
  prompt: string, 
  systemInstruction?: string, 
  jsonMode: boolean = false
): Promise<string> => {
  if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  
  const options: any = {
    systemInstruction,
  };
  if (jsonMode) {
    options.responseMimeType = "application/json";
  }

  const response = await ai.models.generateContent({
    model: config.modelId,
    contents: prompt,
    config: options,
  });

  return response.text || "";
};

const callOpenAICompatible = async (
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
  };

  if (jsonMode) {
    // Note: Some providers strictly require "json" in the prompt for json_object mode
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

const generateText = async (
  prompt: string, 
  settings: AppSettings, 
  systemInstruction?: string, 
  jsonMode: boolean = false
): Promise<string> => {
  const config = getActiveTextConfig(settings);
  if (!config) throw new Error("No active text model configured.");

  if (config.provider === 'google') {
    return callGoogleGenAI(config, prompt, systemInstruction, jsonMode);
  } else {
    // OpenAI and Jimeng (if used for text) fallback to compatible
    return callOpenAICompatible(config, prompt, systemInstruction, jsonMode);
  }
};

// --- IMAGE GENERATION ---

const callGoogleImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
   if (!config.apiKey) throw new Error(`API Key missing for ${config.name}`);
   const ai = new GoogleGenAI({ apiKey: config.apiKey });
   
   const response = await ai.models.generateContent({
      model: config.modelId,
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in Google response");
};

const callOpenAICompatibleImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
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
      return `data:image/png;base64,${b64}`; // Assuming png/jpeg, browser handles it usually if header is approximate
    }
    // Fallback if URL is returned (though we asked for b64)
    const url = data.data?.[0]?.url;
    if (url) return url;

    throw new Error("No image data found in response");
  } catch (e) {
    console.error("Image Gen Failed", e);
    throw e;
  }
};

// --- VOLCENGINE V4 SIGNING HELPERS ---

async function hmac(key: CryptoKey | Uint8Array, message: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const cryptoKey = key instanceof Uint8Array 
        ? await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
        : key;
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
    return new Uint8Array(signature);
}

async function sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function signVolcengineRequest(
    accessKey: string,
    secretKey: string,
    method: string,
    host: string,
    path: string,
    query: string,
    contentType: string,
    body: string
): Promise<Record<string, string>> {
    const region = "cn-north-1";
    const service = "cv";
    const now = new Date();
    
    // ISO8601 Basic Format: YYYYMMDDTHHMMSSZ
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8); // YYYYMMDD

    // 1. Canonical Request
    const canonicalUri = path;
    const canonicalQueryString = query; // Assuming already sorted or empty
    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-date";
    const payloadHash = await sha256(body);
    
    const canonicalRequest = [
        method,
        canonicalUri,
        canonicalQueryString,
        canonicalHeaders,
        signedHeaders,
        payloadHash
    ].join('\n');

    // 2. String to Sign
    const algorithm = "HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/${service}/request`;
    const stringToSign = [
        algorithm,
        amzDate,
        credentialScope,
        await sha256(canonicalRequest)
    ].join('\n');

    // 3. Signing Key
    const kSecret = new TextEncoder().encode(secretKey);
    const kDate = await hmac(kSecret, dateStamp);
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, "request");

    // 4. Signature
    const signatureBytes = await hmac(kSigning, stringToSign);
    const signature = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // 5. Auth Header
    const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
        'Authorization': authorization,
        'X-Date': amzDate,
        'Content-Type': contentType,
        // Host header is intentionally omitted here as it's forbidden to set in browser fetch
        // The browser will automatically set it to the URL's host, which matches our signature
    };
}

const callJimengVisualGen = async (config: ModelConfig, prompt: string): Promise<string> => {
    if (!config.accessKey || !config.secretKey) {
        throw new Error("Access Key and Secret Key are required for Jimeng (Native API).");
    }

    const fullUrl = config.baseUrl || 'https://visual.volcengineapi.com/api/v1/high_aes/cv_20240911/generated_images';
    const urlObj = new URL(fullUrl);
    
    const reqBody = {
        req_key: config.modelId || "high_aes_general_v21_L", // Default to V2.1 if not specified
        prompt: prompt,
        model_version: "general_v2.1_L", // Usually implied by req_key, but helpful to be explicit if known
        return_url: false, // We want base64 for immediate display
        logo_info: {
             add_logo: false
        }
    };

    const bodyStr = JSON.stringify(reqBody);
    
    const signedHeaders = await signVolcengineRequest(
        config.accessKey,
        config.secretKey,
        "POST",
        urlObj.host,
        urlObj.pathname,
        urlObj.search.slice(1), // remove '?'
        "application/json",
        bodyStr
    );

    const response = await fetch(fullUrl, {
        method: 'POST',
        headers: signedHeaders,
        body: bodyStr
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Jimeng API Failed: ${txt}`);
    }

    const json = await response.json();
    
    // Handle standard response: { code: 10000, data: { binary_data_base64: [...] } }
    if (json.code !== 10000) {
        throw new Error(`Jimeng Error Code ${json.code}: ${json.message}`);
    }

    const base64Data = json.data?.binary_data_base64?.[0];
    if (base64Data) {
        return `data:image/png;base64,${base64Data}`;
    }

    const imageUrl = json.data?.image_urls?.[0];
    if (imageUrl) {
        return imageUrl;
    }

    throw new Error("No image data found in Jimeng response.");
};

// --- KLING AI JWT GENERATION (Browser Compatible) ---

const base64UrlEncode = (str: string): string => {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const base64UrlEncodeArray = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const generateKlingToken = async (accessKey: string, secretKey: string): Promise<string> => {
    // Kling AI JWT Structure
    const header = {
        alg: "HS256",
        typ: "JWT"
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: accessKey,
        exp: now + 1800, // 30 minutes expiration
        nbf: now - 5     // Valid from 5 seconds ago
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secretKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        enc.encode(dataToSign)
    );

    const encodedSignature = base64UrlEncodeArray(signature);
    return `${dataToSign}.${encodedSignature}`;
};

const callKlingImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
    if (!config.accessKey || !config.secretKey) {
        throw new Error(`Access Key and Secret Key are required for Kling AI`);
    }
    
    // Generate JWT Token on the fly
    const token = await generateKlingToken(config.accessKey, config.secretKey);

    const baseUrl = config.baseUrl?.replace(/\/+$/, '') || 'https://api.klingai.com/v1';
  
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  
    // 1. Submit Task
    // Kling typically uses /images/generations for submission, returning a Task ID
    const submitRes = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.modelId || 'kling-v1',
        prompt: prompt,
        n: 1
      })
    });
  
    if (!submitRes.ok) {
       const txt = await submitRes.text();
       throw new Error(`Kling Submit Failed: ${txt}`);
    }
  
    const submitData = await submitRes.json();
    
    // Check if it returned image directly (Standard/Sync mode fallback)
    if (submitData.data && Array.isArray(submitData.data) && (submitData.data[0]?.url || submitData.data[0]?.b64_json)) {
        if (submitData.data[0].b64_json) return `data:image/png;base64,${submitData.data[0].b64_json}`;
        return submitData.data[0].url;
    }
    
    // Async Task Flow
    // Kling response usually wraps data in a 'data' field, and task_id inside it
    const taskId = submitData.data?.task_id || submitData.task_id;
    if (!taskId) {
        // Just in case the structure is very different
        console.error("Kling Response:", submitData);
        throw new Error(`No task_id or image data found in Kling response.`);
    }
  
    // 2. Poll Status
    let attempts = 0;
    const MAX_ATTEMPTS = 45; // 90 seconds max
    
    while (attempts < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s
        attempts++;
  
        const checkRes = await fetch(`${baseUrl}/images/generations/${taskId}`, {
            headers
        });
        
        if (!checkRes.ok) continue;
  
        const checkData = await checkRes.json();
        const statusData = checkData.data || checkData; // Handle wrapped or unwrapped data
        const status = statusData.task_status || statusData.status;
        
        if (status === 'succeed' || status === 'completed' || status === 'success') {
            const result = statusData.task_result || statusData.result;
            const images = result?.images;
            if (images && images[0]?.url) {
                return images[0].url;
            }
        } else if (status === 'failed' || status === 'failure') {
            throw new Error(`Kling Task Failed: ${statusData.task_status_msg || 'Unknown error'}`);
        }
    }
  
    throw new Error("Kling Generation Timed Out");
};

// --- EXPORTED FUNCTIONS ---

export const analyzeIntent = async (
  rawInput: string,
  settings: AppSettings
): Promise<string> => {
  try {
    return await generateText(
      `Raw User Input: "${rawInput}"\n\n${settings.intentPrompt}`, 
      settings
    );
  } catch (error) {
    console.error("Intent analysis error:", error);
    return rawInput;
  }
};

export const generateScript = async (
  userMessage: string,
  settings: AppSettings
): Promise<ProjectData> => {
  
  let systemInstruction = settings.directorMainPrompt;
  systemInstruction = systemInstruction.replace('{{STORYBOARD}}', settings.directorVar_storyboard);
  systemInstruction = systemInstruction.replace('{{CINEMATOGRAPHY}}', settings.directorVar_cinematography);
  systemInstruction = systemInstruction.replace('{{DIRECTOR}}', settings.directorVar_director);
  systemInstruction = systemInstruction.replace('{{CONTINUITY}}', settings.directorVar_continuity);

  // If using OpenAI compatible models, we append "Respond in JSON" explicitly to prompt to be safe, 
  // although json_object mode helps.
  const config = getActiveTextConfig(settings);
  if (config?.provider === 'openai-compatible' || config?.provider === 'jimeng') {
      systemInstruction += "\n\nIMPORTANT: You must respond with raw JSON only. No markdown formatting.";
  }

  try {
    const text = await generateText(userMessage, settings, systemInstruction, true);
    
    // Robust JSON cleaning
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as ProjectData;
  } catch (error) {
    console.error("Script generation error:", error);
    throw error;
  }
};

export const generateSceneImage = async (
  imagePrompt: string,
  visualDescription: string,
  styleTemplate: string, 
  settings: AppSettings
): Promise<string> => {
  
  let fullPrompt = "";
  if (styleTemplate.includes('{{DESCRIPTION}}')) {
      fullPrompt = styleTemplate.replace('{{DESCRIPTION}}', visualDescription);
  } else {
      fullPrompt = `${styleTemplate}. Subject: ${visualDescription}.`;
  }
  fullPrompt += ` Detail: ${imagePrompt}`;

  const config = getActiveImageConfig(settings);
  if (!config) {
      throw new Error("No active image model configured. Please check Settings.");
  }

  try {
    if (config.provider === 'google') {
      return await callGoogleImageGen(config, fullPrompt);
    } else if (config.provider === 'jimeng') {
      return await callJimengVisualGen(config, fullPrompt);
    } else if (config.provider === 'kling') {
      return await callKlingImageGen(config, fullPrompt);
    } else {
      return await callOpenAICompatibleImageGen(config, fullPrompt);
    }
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

export const generateEditingPlan = async (
  prompt: string,
  settings: AppSettings
): Promise<EditingPlan> => {
  try {
    const text = await generateText(prompt, settings, settings.editingPrompt, true);
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as EditingPlan;
  } catch (error) {
    console.error("Editing plan generation error:", error);
    throw error;
  }
};
