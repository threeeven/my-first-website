// functions/api/upload.ts
export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return Response.json({ error: 'No file' }, { status: 400, headers: corsHeaders });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('diary-images')
      .upload(fileName, file, { contentType: file.type });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('diary-images').getPublicUrl(fileName);
    return Response.json({ url: urlData.publicUrl }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Upload failed' }, { status: 500, headers: corsHeaders });
  }
};