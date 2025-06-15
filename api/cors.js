export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // 设置 CORS 头
    const headers = {
        'Access-Control-Allow-Origin': 'https://liushaoyin.github.io',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    };

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers
        });
    }

    try {
        // 转发请求到 analyze API
        const response = await fetch('https://digital-bazi.vercel.app/api/analyze', {
            method: req.method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: req.method !== 'GET' ? JSON.stringify(await req.json()) : undefined
        });

        // 获取响应数据
        const data = await response.json();

        // 返回响应
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        // 处理错误
        return new Response(JSON.stringify({
            error: error.message || '请求处理失败',
            details: error.stack
        }), {
            status: 500,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        });
    }
} 