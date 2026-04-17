import { createClient } from '@supabase/supabase-js';

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

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
    if (method === 'GET' && url.pathname === '/api/diaries') {
      const { data, error } = await supabase.from('diaries').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return Response.json(data, { headers: corsHeaders });
    }

    if (method === 'POST' && url.pathname === '/api/diaries') {
      const { title, content } = await request.json();
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

    if (method === 'DELETE' && url.pathname === '/api/diaries') {
      const id = url.searchParams.get('id');
      if (!id) return Response.json({ error: 'Missing id' }, { status: 400, headers: corsHeaders });
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