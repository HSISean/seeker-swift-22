import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface S3PutObjectRequest {
  Bucket: string;
  Key: string;
  Body?: string;
}

async function createS3Folder(bucket: string, folderPath: string, region: string, accessKeyId: string, secretAccessKey: string) {
  const key = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = date.slice(0, 8);
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  
  // Empty payload hash for folder creation
  const payloadHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  
  // Create canonical request with x-amz-content-sha256
  const canonicalRequest = [
    'PUT',
    `/${key}`,
    '',
    `host:${bucket}.s3.${region}.amazonaws.com`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${date}`,
    '',
    'host;x-amz-content-sha256;x-amz-date',
    payloadHash
  ].join('\n');
  
  // Create string to sign
  const encoder = new TextEncoder();
  const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const stringToSign = [
    algorithm,
    date,
    credentialScope,
    canonicalRequestHashHex
  ].join('\n');
  
  // Calculate signature
  async function hmac(key: Uint8Array | ArrayBuffer, data: string): Promise<ArrayBuffer> {
    let keyData: ArrayBuffer;
    if (key instanceof Uint8Array) {
      // Create a new ArrayBuffer and copy the data
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
  
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signatureHex}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Host': `${bucket}.s3.${region}.amazonaws.com`,
      'x-amz-date': date,
      'x-amz-content-sha256': payloadHash,
      'Authorization': authorization,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`S3 API error: ${response.status} - ${errorText}`);
  }
  
  return { success: true, folderPath: key };
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

    // Get user profile to get the uuid
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('uuid')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const userUuid = profile.uuid || user.id.slice(0, 10);
    
    const bucket = Deno.env.get('AWS_S3_BUCKET_NAME');
    const region = Deno.env.get('AWS_REGION');
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing AWS credentials');
    }

    // Create main user folder
    const mainFolder = `${userUuid}/`;
    await createS3Folder(bucket, mainFolder, region, accessKeyId, secretAccessKey);
    console.log(`Created main folder: ${mainFolder}`);

    // Create original resume subfolder
    const originalFolder = `${userUuid}/original_resume/`;
    await createS3Folder(bucket, originalFolder, region, accessKeyId, secretAccessKey);
    console.log(`Created original resume folder: ${originalFolder}`);

    // Create enhanced resume subfolder
    const enhancedFolder = `${userUuid}/enhanced_resume/`;
    await createS3Folder(bucket, enhancedFolder, region, accessKeyId, secretAccessKey);
    console.log(`Created enhanced resume folder: ${enhancedFolder}`);

    return new Response(
      JSON.stringify({
        success: true,
        folders: {
          main: mainFolder,
          original: originalFolder,
          enhanced: enhancedFolder,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in manage-resume-folders:', error);
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
