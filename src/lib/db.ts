/**
 * Database connection bridge:
 * Consolidates database connection into a single connection pool from '@/lib/mongodb'.
 */
export { default, connectToDatabase } from '@/lib/mongodb';