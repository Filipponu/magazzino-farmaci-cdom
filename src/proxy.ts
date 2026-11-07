import {NextResponse,type NextRequest} from 'next/server';
import {createServerClient} from '@supabase/ssr';
export async function proxy(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.next();
 let res=NextResponse.next({request:req});
 const db=createServerClient(url,key,{cookies:{getAll:()=>req.cookies.getAll(),setAll:cs=>{cs.forEach(c=>req.cookies.set(c.name,c.value));res=NextResponse.next({request:req});cs.forEach(c=>res.cookies.set(c.name,c.value,c.options));}}});
 const {data:{user}}=await db.auth.getUser();
 const path=req.nextUrl.pathname;const open=['/login','/signup','/forgot-password','/update-password','/auth/callback'];
 if(!user&&!open.includes(path)&&!path.startsWith('/api/'))return NextResponse.redirect(new URL('/login',req.url));
 const allowed=['/','/operatore','/coordinatore',...open];
 if(!allowed.includes(path)&&!path.startsWith('/api/')&&!path.startsWith('/_next/')&&!path.startsWith('/ocr/')&&path!== '/favicon.svg')return NextResponse.redirect(new URL('/',req.url));
 return res;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|ocr/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
