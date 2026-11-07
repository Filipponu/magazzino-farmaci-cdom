import {createClientServer} from '@/lib/supabase/server';
import {redirect} from 'next/navigation';
export async function GET(){const db=await createClientServer();await db.auth.signOut();redirect('/login');}
