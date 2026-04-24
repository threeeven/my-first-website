// functions/api/diaries/versions.ts
export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const diaryId = url.searchParams.get('id');
  if (!diaryId) {
    return Response.json({ error: 'Missing diary id' }, { status: 400, headers: corsHeaders });
  }

  try {
    const { data, error } = await supabase
      .from('diary_versions')
      .select('id, title, content, created_at')
      .eq('diary_id', diaryId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Response.json(data, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
};