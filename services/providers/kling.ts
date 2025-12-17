
import { ModelConfig } from '../../types';

// --- JWT HELPERS ---

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
    const header = {
        alg: "HS256",
        typ: "JWT"
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: accessKey,
        exp: now + 1800, 
        nbf: now - 5    
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

// --- MAIN API CALL ---

export const callKlingImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
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
    const taskId = submitData.data?.task_id || submitData.task_id;
    if (!taskId) {
        console.error("Kling Response:", submitData);
        throw new Error(`No task_id or image data found in Kling response.`);
    }
  
    // 2. Poll Status
    let attempts = 0;
    const MAX_ATTEMPTS = 45; // 90 seconds max
    
    while (attempts < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
  
        const checkRes = await fetch(`${baseUrl}/images/generations/${taskId}`, {
            headers
        });
        
        if (!checkRes.ok) continue;
  
        const checkData = await checkRes.json();
        const statusData = checkData.data || checkData; 
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
