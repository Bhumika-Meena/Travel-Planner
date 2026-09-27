import { NextResponse } from 'next/server';
import { getAuthSession, signAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getAuthSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Issue a fresh chat auth token with the user's verified identity
  const token = await signAuthToken(session);
  return NextResponse.json({ token, userId: session.userId });
}
