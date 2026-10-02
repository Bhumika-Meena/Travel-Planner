/**
 * Global Jest setup — runs before every test file.
 * Sets environment variables that are read at module import time
 * so that mocks can intercept before real connections are attempted.
 */

// Provide minimum env vars needed so modules that guard at import time don't throw
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.MONGODB_DB = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-definitely-32-chars-long!!';
(process.env as Record<string, string | undefined>).NODE_ENV = 'test';
