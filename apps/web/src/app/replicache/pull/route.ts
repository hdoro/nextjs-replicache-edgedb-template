import { CustomPullRequest } from '@repo/lib'
import { NextResponse, type NextRequest } from 'next/server'
import { process_pull } from './process-pull'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  console.log(`Processing pull`, CustomPullRequest.parse(body))

  // @TODO error handling
  const response = await process_pull(CustomPullRequest.parse(body))

  return NextResponse.json(response, {
    status: 200,
    headers: corsHeaders,
  })
}
