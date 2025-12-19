
import { ModelConfig } from '../../types';

/**
 * 调用通义图像生成接口 (阿里云 DashScope)
 * 适配 Qwen-Image (同步模式) 与 Wanx (异步模式)
 * 文档: https://help.aliyun.com/zh/model-studio/developer-reference/qwen-image-api-refer
 */
export const callQianwenImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
  if (!config.apiKey) {
    throw new Error(`通义千问/万相尚未配置 API Key。`);
  }

  // 默认使用官方北京地域 API 地址
  const rawBaseUrl = config.baseUrl?.trim() || 'https://dashscope.aliyuncs.com/api/v1';
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  const modelId = config.modelId.trim();
  
  // 判断模型系列
  const isQwenImage = modelId.toLowerCase().includes('qwen-image');

  // --- 模式 1: 通义千问 Qwen-Image (强制同步消息模式) ---
  if (isQwenImage) {
    // 官方推荐的同步接口地址
    const syncUrl = `${baseUrl}/services/aigc/multimodal-generation/generation`;
    
    // Qwen-Image 同步接口必须使用 messages 结构，否则可能返回 403 Forbidden
    const body = {
      model: modelId,
      input: {
        messages: [
          {
            role: "user",
            content: [
              { text: prompt }
            ]
          }
        ]
      },
      parameters: {
        size: "1328*1328", // 默认 1:1 分辨率
        prompt_extend: true,
        watermark: false
      }
    };

    try {
      const res = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorText = await res.text();
        handleQianwenError(res.status, errorText, modelId);
      }

      const data = await res.json();
      
      // 解析同步接口返回的图片 URL
      const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image;
      if (imageUrl) return imageUrl;
      
      throw new Error("通义同步请求成功但响应中未发现图片地址，请检查账号欠费情况或模型额度。");
    } catch (err: any) {
      handleNetworkError(err, syncUrl);
    }
  }

  // --- 模式 2: 通义万相 Wanx 系列 (强制异步模式) ---
  const asyncSubmitUrl = `${baseUrl}/services/aigc/text2image/image-synthesis`;
  const asyncBody = {
    model: modelId,
    input: { prompt },
    parameters: {
      size: "1024*1024", 
      n: 1,
      prompt_extend: true
    }
  };

  try {
    // 1. 提交异步任务
    const submitRes = await fetch(asyncSubmitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify(asyncBody)
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      handleQianwenError(submitRes.status, errorText, modelId);
    }

    const submitData = await submitRes.json();
    const taskId = submitData.output?.task_id;
    if (!taskId) throw new Error("通义异步任务提交失败：未返回 task_id");

    // 2. 轮询结果 (最多等待 2 分钟)
    let attempts = 0;
    while (attempts < 60) {
      await new Promise(r => setTimeout(r, 2000));
      attempts++;

      const pollRes = await fetch(`${baseUrl}/tasks/${taskId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });

      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();
      const status = pollData.output?.task_status;

      if (status === 'SUCCEEDED') {
        const url = pollData.output?.results?.[0]?.url || pollData.output?.url;
        if (url) return url;
        throw new Error("通义异步任务成功但未发现图片地址。");
      }

      if (status === 'FAILED' || status === 'UNKNOWN') {
        throw new Error(`通义任务执行失败: ${pollData.output?.message || pollData.output?.code || '未知原因'}`);
      }
    }
    throw new Error("通义生图任务轮询超时，请检查网络或稍后重试。");
  } catch (err: any) {
    handleNetworkError(err, asyncSubmitUrl);
  }
  
  return "";
};

const handleQianwenError = (status: number, text: string, modelId: string) => {
  // 阿里云 403 可能是模型未授权，也可能是 Key 格式不正确或跨地域调用
  if (status === 403) {
    throw new Error(`[403 拒绝访问] 请确认：1. 已在百炼控制台开通了 "${modelId}"；2. API Key 正确且未过期；3. 请求地址地域与 Key 匹配。`);
  }
  if (status === 401) throw new Error(`[401 认证失败] 请检查您的 API Key 是否填写正确。`);
  if (status === 404) throw new Error(`[404 地址错误] 接口路径无效，请检查设置中的 Base URL。`);
  throw new Error(`通义 API 错误 (HTTP ${status}): ${text}`);
};

const handleNetworkError = (err: any, url: string) => {
  if (err.name === 'TypeError' && !url.includes('cors')) {
    throw new Error(`[CORS 跨域拦截] 浏览器禁止直接请求阿里云 API。请在设置中将 Base URL 修改为代理地址，例如: https://cors-anywhere.herokuapp.com/${url}`);
  }
  throw err;
};
