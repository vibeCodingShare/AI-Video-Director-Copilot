
import { ModelConfig } from '../../types';

/**
 * 调用通义万相/通义千问图像生成接口 (阿里云 DashScope)
 * 支持模型: wan2.6-t2i, wan2.5-t2i-preview, qwen-image-plus 等
 */
export const callQianwenImageGen = async (config: ModelConfig, prompt: string): Promise<string> => {
  if (!config.apiKey) {
    throw new Error(`通义千问/万相尚未配置 API Key。`);
  }

  // DashScope 默认 Base URL
  const baseUrl = config.baseUrl?.replace(/\/+$/, '') || 'https://dashscope.aliyuncs.com/api/v1';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
    'X-DashScope-Async': 'enable' // 启用异步模式
  };

  // 根据模型系列决定参数结构 (通义万相 vs 通义千问)
  const isWanx = config.modelId.startsWith('wan');
  
  const submitBody = isWanx ? {
    model: config.modelId,
    input: {
      prompt: prompt
    },
    parameters: {
      style: "<auto>",
      size: "1024*1024",
      n: 1
    }
  } : {
    model: config.modelId,
    input: {
      prompt: prompt
    }
  };

  // --- 阶段 1: 提交任务 ---
  const submitUrl = isWanx 
    ? `${baseUrl}/services/aigc/text2image/image-synthesis`
    : `${baseUrl}/services/aigc/multimodal-generation/generation`;

  const submitRes = await fetch(submitUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(submitBody)
  });

  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    throw new Error(`通义图像任务提交失败 (${submitRes.status}): ${errorText}`);
  }

  const submitData = await submitRes.json();
  const taskId = submitData.output?.task_id;

  if (!taskId) {
    throw new Error(`未获取到通义任务 ID: ${JSON.stringify(submitData)}`);
  }

  // --- 阶段 2: 轮询结果 ---
  let attempts = 0;
  const maxAttempts = 60; // 最多等待 2 分钟
  
  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 2000)); // 每 2 秒轮询一次
    attempts++;

    const pollRes = await fetch(`${baseUrl}/tasks/${taskId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });

    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();
    const taskStatus = pollData.output?.task_status;

    if (taskStatus === 'SUCCEEDED') {
      // 不同模型的返回路径略有差异，做兼容处理
      const resultUrl = pollData.output?.results?.[0]?.url || pollData.output?.url;
      if (resultUrl) return resultUrl;
      throw new Error("任务成功但未找到图像 URL");
    }

    if (taskStatus === 'FAILED' || taskStatus === 'UNKNOWN') {
      throw new Error(`通义图像生成失败: ${pollData.output?.message || '未知原因'}`);
    }

    // PENDING 或 RUNNING 则继续轮询
  }

  throw new Error("通义任务生成超时");
};
