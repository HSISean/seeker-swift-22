import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function uploadToS3(
  bucket: string,
  key: string,
  fileData: ArrayBuffer,
  contentType: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string
) {
  const encoder = new TextEncoder();
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = date.slice(0, 8);
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  
  const payloadHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', fileData))
  ).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const canonicalRequest = [
    'PUT',
    `/${key}`,
    '',
    `content-type:${contentType}`,
    `host:${bucket}.s3.${region}.amazonaws.com`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${date}`,
    '',
    'content-type;host;x-amz-content-sha256;x-amz-date',
    payloadHash
  ].join('\n');
  
  const canonicalRequestHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const stringToSign = [
    algorithm,
    date,
    credentialScope,
    canonicalRequestHash
  ].join('\n');
  
  async function hmac(key: Uint8Array | ArrayBuffer, data: string): Promise<ArrayBuffer> {
    let keyData: ArrayBuffer;
    if (key instanceof Uint8Array) {
      keyData = new ArrayBuffer(key.byteLength);
      new Uint8Array(keyData).set(new Uint8Array(key.buffer, key.byteOffset, key.byteLength));
    } else {
      keyData = key;
    }
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  }
  
  let kDate = await hmac(encoder.encode(`AWS4${secretAccessKey}`), dateStamp);
  let kRegion = await hmac(kDate, region);
  let kService = await hmac(kRegion, 's3');
  let kSigning = await hmac(kService, 'aws4_request');
  let signature = await hmac(kSigning, stringToSign);
  
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=${signatureHex}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Host': `${bucket}.s3.${region}.amazonaws.com`,
      'x-amz-date': date,
      'x-amz-content-sha256': payloadHash,
      'Content-Type': contentType,
      'Authorization': authorization,
    },
    body: fileData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`S3 upload failed: ${response.status} - ${errorText}`);
  }
  
  return url;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('uuid, resume_folder')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const userUuid = profile.uuid || user.id.slice(0, 10);
    const fileExt = file.name.split('.').pop();
    const key = `users/${userUuid}/original_resume/resume.${fileExt}`;
    
    const bucket = Deno.env.get('AWS_S3_BUCKET_NAME');
    const region = Deno.env.get('AWS_REGION');
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing AWS credentials');
    }

    // Convert file to ArrayBuffer
    const fileData = await file.arrayBuffer();
    
    // Upload to S3
    const s3Url = await uploadToS3(
      bucket,
      key,
      fileData,
      file.type || 'application/pdf',
      region,
      accessKeyId,
      secretAccessKey
    );

    console.log(`Successfully uploaded resume to S3: ${s3Url}`);

    // Calculate enhanced resume folder
    const enhancedResumeFolder = s3Url.replace('original_resume', 'enhanced_resume');

    // Update profile with S3 URL, key, and enhanced folder
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        resume_folder: s3Url,
        resume_key: key,
        enhanced_resume_folder: enhancedResumeFolder,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        s3_url: s3Url,
        s3_key: key,
        enhanced_folder: enhancedResumeFolder,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in upload-resume-to-s3:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
