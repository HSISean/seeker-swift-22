import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface JobInsertRequest {
  title?: string
  description?: string
  location?: string
  company_name?: string
  company_link?: string
  company_logo_url?: string
  salary?: string
  job_link?: string
  job_site_id?: string
  justification?: string
  match_rating?: number
  uuid: string
  expires_at?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('N8N job insert request received')

    // Verify API key
    const apiKey = req.headers.get('x-api-key')
    const expectedApiKey = Deno.env.get('N8N_API_KEY')
    
    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const jobData: JobInsertRequest = await req.json()
    console.log('Job data received:', { 
      uuid: jobData.uuid, 
      title: jobData.title,
      company: jobData.company_name 
    })

    // Validate required fields
    if (!jobData.uuid) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: uuid' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Insert job using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        company_name: jobData.company_name,
        company_link: jobData.company_link,
        company_logo_url: jobData.company_logo_url,
        salary: jobData.salary,
        job_link: jobData.job_link,
        job_site_id: jobData.job_site_id,
        justification: jobData.justification,
        match_rating: jobData.match_rating,
        uuid: jobData.uuid,
        expires_at: jobData.expires_at,
        is_active: true,
        posted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to insert job', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Job inserted successfully:', data.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        job_id: data.id,
        message: 'Job inserted successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
