/**
 * PURPOSE: MSW lifecycle management for test suites - starts server before all tests, resets between tests, closes after
 *
 * USAGE:
 * Add to jest.config.js setupFilesAfterEnv:
 * '<rootDir>/../../packages/testing/src/startup/start-endpoint-mock-setup.ts'
 */

import { EndpointMockSetupFlow } from '../flows/endpoint-mock-setup/endpoint-mock-setup-flow';

const lifecycle = EndpointMockSetupFlow();

beforeAll(() => {
  lifecycle.listen();
});

afterEach(() => {
  lifecycle.resetHandlers();
});

afterAll(() => {
  lifecycle.close();
});
