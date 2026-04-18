// functions/api/diaries.ts
export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // 动态导入 Supabase 客户端（避免打包问题）
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 处理 CORS 预检请求
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
      const isPublic = url.searchParams.get('isPublic'); // 'true' 或 'false'

      let query = supabase.from('diaries').select('*');

      // 全文搜索（标题+内容，模糊匹配）
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      // 标签筛选（数组包含）
      if (tag) {
        query = query.contains('tags', [tag]);
      }

      // 日期范围
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // 公开/私密筛选
      if (isPublic !== null) {
        query = query.eq('is_public', isPublic === 'true');
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return Response.json(data, { headers: corsHeaders });
    }

    // ---------- POST /api/diaries ---------- 新增
    if (method === 'POST' && url.pathname === '/api/diaries') {
      const { title, content, tags, is_public, image_url } = await request.json();
      const newEntry = {
        id: Date.now().toString(),
        title: title.trim() || '无标题',
        content: content.trim() || '',
        tags: tags || [],
        is_public: is_public !== undefined ? is_public : true,
        image_url: image_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('diaries').insert(newEntry);
      if (error) throw error;
      return Response.json(newEntry, { status: 201, headers: corsHeaders });
    }

    // ---------- PUT /api/diaries?id=xxx ---------- 编辑
    if (method === 'PUT' && url.pathname === '/api/diaries') {
      const id = url.searchParams.get('id');
      if (!id) {
        return Response.json({ error: 'Missing id' }, { status: 400, headers: corsHeaders });
      }
      const updates = await request.json();
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('diaries').update(updateData).eq('id', id);
      if (error) throw error;
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

    // ---------- POST /api/upload ---------- 图片上传
    if (method === 'POST' && url.pathname === '/api/upload') {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return Response.json({ error: 'No file' }, { status: 400, headers: corsHeaders });
      }

      // 上传到 Supabase Storage (需要预先创建 bucket 'diary-images')
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('diary-images')
        .upload(fileName, file, { contentType: file.type });
      if (error) throw error;

      // 获取公开 URL
      const { data: urlData } = supabase.storage.from('diary-images').getPublicUrl(fileName);
      return Response.json({ url: urlData.publicUrl }, { headers: corsHeaders });
    }

    // 未匹配任何路由
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
};