/**
 * GET /api/health
 *
 * Health check endpoint for Render and other orchestration platforms.
 * - Returns 200 when the application and database are healthy.
 * - Returns 503 when the database is unreachable.
 *
 * This endpoint is intentionally public (no auth) so load balancers
 * and uptime monitors can check it without credentials.
 */

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startMs = Date.now();

  try {
    const { db } = await connectToDatabase();
    // Run a lightweight ping to verify the connection is live
    await db.command({ ping: 1 });

    const latencyMs = Date.now() - startMs;
    logger.info({ latencyMs }, 'Health check OK');

    return NextResponse.json(
      {
        status: 'ok',
        db: 'connected',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    logger.error({ err, latencyMs }, 'Health check failed — database unreachable');

    return NextResponse.json(
      {
        status: 'error',
        db: 'unreachable',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
