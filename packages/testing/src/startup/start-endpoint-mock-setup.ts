/**
 * PURPOSE: MSW lifecycle management for test suites - starts server before all tests, resets between tests, closes after
 *
 * USAGE:
 * Add to jest.config.js setupFilesAfterEnv:
 * '<rootDir>/../../packages/testing/src/startup/start-endpoint-mock-setup.ts'
 */

import { mswServerAdapter } from '../adapters/msw/server/msw-server-adapter';

const server = mswServerAdapter();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
