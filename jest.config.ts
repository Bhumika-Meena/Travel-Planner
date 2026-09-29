import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
      useESM: true,
    }],
  },
  // Run env setup before any test file is imported (handles module-level env checks)
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  restoreMocks: true,
  clearMocks: true,
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/utils/**/*.ts',
    'src/app/api/**/*.ts',
    '!src/**/*.d.ts',
  ],
};

export default config;
