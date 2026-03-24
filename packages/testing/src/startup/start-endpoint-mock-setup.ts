/**
 * PURPOSE: MSW lifecycle management for test suites - starts server before all tests, resets between tests, closes after
 *
 * USAGE:
 * Add to jest.config.js setupFilesAfterEnv:
 * '<rootDir>/../../packages/testing/src/startup/start-endpoint-mock-setup.ts'
 */

import { EndpointMockSetupFlow } from '../flows/endpoint-mock-setup/endpoint-mock-setup-flow';
import { NetworkRecordLifecycleFlow } from '../flows/network-record-lifecycle/network-record-lifecycle-flow';

const lifecycle = EndpointMockSetupFlow();
const recorder = NetworkRecordLifecycleFlow();

beforeAll(() => {
  lifecycle.listen();
  recorder.start();
});

afterEach(async () => {
  await recorder.afterEach();
  lifecycle.resetHandlers();
});

afterAll(() => {
  recorder.stop();
  lifecycle.close();
});
