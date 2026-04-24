// functions/api/diaries.ts
export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---------- GET /api/diaries ----------
    if (method === 'GET' && url.pathname === '/api/diaries') {
      const search = url.searchParams.get('search') || '';
      const tag = url.searchParams.get('tag') || '';
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const isPublic = url.searchParams.get('isPublic');

      let query = supabase.from('diaries').select('*');

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }
      if (tag) {
        query = query.contains('tags', [tag]);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lt('created_at', endDate);
      }
      if (isPublic !== null) {
        query = query.eq('is_public', isPublic === 'true');
      }

      // 排序：置顶优先，再按创建时间倒序
      const { data, error } = await query
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return Response.json(data, { headers: corsHeaders });
    }

    // ---------- POST /api/diaries ----------
    if (method === 'POST' && url.pathname === '/api/diaries') {
      const { title, content, tags, is_public, image_url } = await request.json();
      const newEntry = {
        id: Date.now().toString(),
        title: title.trim() || '无标题',
        content: content.trim() || '',
        tags: tags || [],
        is_public: is_public !== undefined ? is_public : true,
        image_url: image_url || null,
        pinned: false,                     // 新增日记默认不置顶
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('diaries').insert(newEntry);
      if (error) throw error;
      return Response.json(newEntry, { status: 201, headers: corsHeaders });
    }

    // ---------- PUT /api/diaries?id=xxx ----------
    // PUT /api/diaries?id=xxx 编辑
    if (method === 'PUT' && url.pathname === '/api/diaries') {
      const id = url.searchParams.get('id');
      if (!id) {
        return Response.json({ error: 'Missing id' }, { status: 400, headers: corsHeaders });
      }

      // 1. 获取当前日记内容（旧版本）
      const { data: current, error: fetchError } = await supabase
        .from('diaries')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      // 2. 插入旧版本到 diary_versions 表
      const versionId = `${Date.now()}-${id}`;
      const versionData = {
        id: versionId,
        diary_id: id,
        title: current.title,
        content: current.content,
        tags: current.tags,
        is_public: current.is_public,
        image_url: current.image_url,
        created_at: new Date().toISOString(),
      };
      const { error: versionError } = await supabase.from('diary_versions').insert(versionData);
      if (versionError) console.error('Version insert error:', versionError); // 非致命错误，但记录日志

      // 3. 更新当前日记
      const updates = await request.json();
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      const { error: updateError } = await supabase.from('diaries').update(updateData).eq('id', id);
      if (updateError) throw updateError;

      return Response.json({ success: true }, { headers: corsHeaders });
    }

    // ---------- DELETE /api/diaries?id=xxx ----------
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