import {createClientServer} from '@/lib/supabase/server';
import {NextResponse} from 'next/server';
export async function GET(req:Request){const url=new URL(req.url);const code=url.searchParams.get('code');if(code){const db=await createClientServer();const {error}=await db.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(url.searchParams.get('next')==='/update-password'?'/update-password':'/',url.origin));}return NextResponse.redirect(new URL('/login?error=link',url.origin));}
