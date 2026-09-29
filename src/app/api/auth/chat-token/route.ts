import { getAuthSession, signAuthToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getAuthSession(request);
  if (!session) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  // Issue a fresh chat auth token with the user's verified identity
  const token = await signAuthToken(session);
  return apiSuccess({ token, userId: session.userId });
}
