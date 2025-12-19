
import { ModelConfig } from '../../types';

/**
 * 严格对齐 Python pyjwt 的 Base64Url 编码
 */
const base64UrlEncode = (input: Uint8Array | string): string => {
  let binary = '';
  if (typeof input === 'string') {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    bytes.forEach(b => binary += String.fromCharCode(b));
  } else {
    input.forEach(b => binary += String.fromCharCode(b));
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * 生成可灵 API JWT Token
 * 严格遵循官方提供的 Python 示例结构
 */
const generateKlingToken = async (accessKey: string, secretKey: string): Promise<string> => {
  // 1. Header
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  // 2. Payload (对齐 Python 示例的时间戳处理)
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKey,
    exp: now + 1800, // 30分钟后过期
    nbf: now - 60,   // 1分钟前生效，防止服务器时钟同步微差导致的 401
    iat: now         // 签发时间
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // 3. Signature (HMAC-SHA256)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(unsignedToken)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${unsignedToken}.${encodedSignature}`;
};

export const callKlingImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
  if (!config.accessKey || !config.secretKey) {
    throw new Error(`[配置错误] 可灵 AI 需要 Access Key 和 Secret Key。`);
  }

  const token = await generateKlingToken(config.accessKey, config.secretKey);
  
  // 默认使用北京集群
  let baseUrl = config.baseUrl?.trim() || 'https://api-beijing.klingai.com';
  
  // 路径自动修正逻辑
  const sanitizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const apiUrl = sanitizedBaseUrl.includes('/v1') 
    ? `${sanitizedBaseUrl}/images/generations` 
    : `${sanitizedBaseUrl}/v1/images/generations`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const body = {
    model: config.modelId || 'kling-v1',
    prompt,
    n: 1,
    aspect_ratio: "1:1"
  };

  try {
    // --- 阶段 1: 任务提交 ---
    const submitRes = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      if (submitRes.status === 401) {
        throw new Error(`[401 鉴权失败] Token 被拒绝。请确认 Secret Key 无误。如果使用了跨域代理，请确认代理未修改 Authorization 头。`);
      }
      if (submitRes.status === 404) {
        throw new Error(`[404 路径错误] 请检查 Base URL。当前请求地址: ${apiUrl}`);
      }
      throw new Error(`可灵请求失败 (HTTP ${submitRes.status}): ${errorText}`);
    }

    const submitData = await submitRes.json();
    if (submitData.code !== 0) {
      throw new Error(`[可灵业务错误 ${submitData.code}] ${submitData.message}`);
    }

    const taskId = submitData.data?.task_id;
    if (!taskId) throw new Error("未获取到任务 ID");

    // --- 阶段 2: 轮询结果 ---
    let attempts = 0;
    const maxAttempts = 50;
    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 4000));
      attempts++;

      // 轮询也要带 Token
      const pollUrl = `${apiUrl}/${taskId}`;
      const pollRes = await fetch(pollUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();
      const task = pollData.data;

      if (task?.task_status === 'succeed' || task?.task_status === 'completed') {
        const url = task.task_result?.images?.[0]?.url;
        if (url) return url;
      }

      if (task?.task_status === 'failed') {
        throw new Error(`[生成失败] ${task.task_status_msg || '任务被系统终止'}`);
      }
    }

    throw new Error("可灵任务生成超时（约 3 分钟）");
  } catch (err: any) {
    // 专门处理浏览器 CORS 拦截导致的 TypeError
    if (err.name === 'TypeError' && !apiUrl.includes('cors')) {
      throw new Error(`[CORS 跨域拦截] 浏览器安全策略阻止了直接请求。解决办法：请在 Base URL 前加上 'https://cors-anywhere.herokuapp.com/' 代理。`);
    }
    throw err;
  }
};
