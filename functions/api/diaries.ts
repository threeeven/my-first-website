// functions/api/diaries.ts
import { createClient } from '@supabase/supabase-js';

// 定义数据库表对应的接口，用于类型提示
interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // 1. 初始化 Supabase 客户端
  // 从 Cloudflare 的环境变量中获取敏感信息
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  // 注意：此处使用了 SERVICE_ROLE_KEY，因为它运行在安全的服务器端（Pages Functions），
  // 可以绕过 Row Level Security (RLS) 进行完整的数据操作。
  // 在生产环境中，请务必理解其权限范围。

  // CORS 配置：允许你的前端域名跨域访问 API
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // 生产环境建议替换为你的具体域名
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 处理预检请求
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- GET /api/diaries: 获取所有日记 ---
    if (method === 'GET' && url.pathname === '/api/diaries') {
      const { data, error } = await supabase
        .from('diaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return Response.json(data, { headers: corsHeaders });
    }

    // --- POST /api/diaries: 新增日记 ---
    if (method === 'POST' && url.pathname === '/api/diaries') {
      const { title, content } = await request.json() as { title: string; content: string };
      const newEntry = {
        id: Date.now().toString(),
        title: title.trim() || '无标题',
        content: content.trim() || '（没有内容）',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('diaries').insert(newEntry);
      if (error) throw error;

      return Response.json(newEntry, { status: 201, headers: corsHeaders });
    }

    // --- DELETE /api/diaries?id=xxx: 删除日记 ---
    if (method === 'DELETE' && url.pathname === '/api/diaries') {
      const id = url.searchParams.get('id');
      if (!id) {
        return Response.json({ error: 'Missing diary id' }, { status: 400, headers: corsHeaders });
      }

      const { error } = await supabase.from('diaries').delete().eq('id', id);
      if (error) throw error;

      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 未匹配到任何路由，返回 404
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
};