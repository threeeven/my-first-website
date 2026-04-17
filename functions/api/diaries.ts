// functions/api/diaries.ts
export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // 使用动态 import() 导入
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

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
        return Response.json({ error: 'Missing id' }, { status: 400, headers: corsHeaders });
      }
      const { error } = await supabase.from('diaries').delete().eq('id', id);
      if (error) throw error;
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
};