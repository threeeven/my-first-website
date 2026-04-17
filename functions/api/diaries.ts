export interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // CORS 配置（允许前端页面调用）
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET /api/diaries - 获取所有日记
    if (method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM diaries ORDER BY created_at DESC'
      ).all();
      return Response.json(results, { headers: corsHeaders });
    }

    // POST /api/diaries - 新增日记
    if (method === 'POST') {
      const { title, content } = await request.json() as { title: string; content: string };
      const id = Date.now().toString();
      const createdAt = new Date().toISOString();
      await env.DB.prepare(
        'INSERT INTO diaries (id, title, content, created_at) VALUES (?, ?, ?, ?)'
      ).bind(id, title, content, createdAt).run();
      return Response.json({ id, title, content, created_at: createdAt }, { status: 201, headers: corsHeaders });
    }

    // DELETE /api/diaries?id=xxx - 删除日记
    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return Response.json({ error: 'Missing id' }, { status: 400, headers: corsHeaders });
      }
      await env.DB.prepare('DELETE FROM diaries WHERE id = ?').bind(id).run();
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
};