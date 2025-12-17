
import { ModelConfig } from '../../types';

// --- SIGNING HELPERS ---

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
    const canonicalUri = path || "/";
    const canonicalQueryString = query; 
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
    };
}

// --- MAIN API CALL ---

export const callJimengVisualGen = async (config: ModelConfig, prompt: string): Promise<string> => {
    if (!config.accessKey || !config.secretKey) {
        throw new Error("Access Key and Secret Key are required for Jimeng (Native API).");
    }

    // V4.0 Gateway URL
    const baseUrl = config.baseUrl || 'https://visual.volcengineapi.com';
    const host = new URL(baseUrl).host;

    const reqKey = config.modelId || "jimeng_t2i_v40"; // V4.0 Fixed Key

    // --- STEP 1: SUBMIT TASK (ASYNC) ---
    
    // Fixed Action & Version for V4.0
    const submitQuery = "Action=CVSync2AsyncSubmitTask&Version=2022-08-31"; 
    const submitUrl = `${baseUrl}?${submitQuery}`;

    const submitBody = {
        req_key: reqKey,
        prompt: prompt,
        width: 2048,
        height: 2048,
        scale: 0.5,
        force_single: true 
    };

    const submitBodyStr = JSON.stringify(submitBody);

    const submitHeaders = await signVolcengineRequest(
        config.accessKey,
        config.secretKey,
        "POST",
        host,
        "/", 
        submitQuery,
        "application/json",
        submitBodyStr
    );

    const submitRes = await fetch(submitUrl, {
        method: 'POST',
        headers: submitHeaders,
        body: submitBodyStr
    });

    if (!submitRes.ok) {
        const txt = await submitRes.text();
        throw new Error(`Jimeng Submit Failed: ${txt}`);
    }

    const submitJson = await submitRes.json();
    if (submitJson.code !== 10000) {
        throw new Error(`Jimeng Submit Error ${submitJson.code}: ${submitJson.message}`);
    }

    const taskId = submitJson.data?.task_id;
    if (!taskId) {
        throw new Error("Jimeng response missing task_id");
    }

    // --- STEP 2: POLL STATUS ---

    const pollQuery = "Action=CVSync2AsyncGetResult&Version=2022-08-31";
    const pollUrl = `${baseUrl}?${pollQuery}`;
    
    // Config for return format
    const pollReqJson = JSON.stringify({
        return_url: true, 
        logo_info: { add_logo: false }
    });

    const pollBody = {
        req_key: reqKey,
        task_id: taskId,
        req_json: pollReqJson
    };
    const pollBodyStr = JSON.stringify(pollBody);

    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 2 minutes max
    
    while (attempts < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, 2000)); 
        attempts++;

        // Re-sign per request due to timestamp
        const pollHeaders = await signVolcengineRequest(
            config.accessKey,
            config.secretKey,
            "POST",
            host,
            "/",
            pollQuery,
            "application/json",
            pollBodyStr
        );

        const pollRes = await fetch(pollUrl, {
            method: 'POST',
            headers: pollHeaders,
            body: pollBodyStr
        });

        if (!pollRes.ok) {
           console.warn("Jimeng poll network error, retrying...");
           continue; 
        }

        const pollJson = await pollRes.json();
        
        if (pollJson.code !== 10000) {
            throw new Error(`Jimeng Poll Error ${pollJson.code}: ${pollJson.message}`);
        }

        const status = pollJson.data?.status;

        if (status === 'done' || status === 'succeed' || status === 'success') {
            const imageUrls = pollJson.data?.image_urls;
            if (imageUrls && imageUrls.length > 0) {
                return imageUrls[0];
            }
            const base64List = pollJson.data?.binary_data_base64;
            if (base64List && base64List.length > 0) {
                return `data:image/jpeg;base64,${base64List[0]}`;
            }
            throw new Error("Jimeng task done but no image data returned.");

        } else if (status === 'failed' || status === 'failure') {
            throw new Error("Jimeng task failed according to status.");
        } else if (status === 'not_found' || status === 'expired') {
            throw new Error(`Jimeng task status: ${status}`);
        }
    }

    throw new Error("Jimeng Generation Timed Out");
};
