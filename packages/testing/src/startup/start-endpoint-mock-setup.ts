/**
 * PURPOSE: MSW lifecycle management for test suites - starts server before all tests, resets between tests, closes after
 * An integration or e2e test file gets a no-op MSW lifecycle instead (see
 * `endpoint-mock-setup-responder.ts`'s own header): those do real I/O against a server they started
 * themselves, by design, and MSW's unhandled-request check would fail that on purpose.
 *
 * USAGE:
 * Add to jest.config.js setupFilesAfterEnv:
 * '<rootDir>/../../packages/testing/src/startup/start-endpoint-mock-setup.ts'
 */

import { EndpointMockSetupFlow } from '../flows/endpoint-mock-setup/endpoint-mock-setup-flow';
import { NetworkRecordLifecycleFlow } from '../flows/network-record-lifecycle/network-record-lifecycle-flow';

const lifecycle = EndpointMockSetupFlow({ testPath: String(expect.getState().testPath) });
const recorder = NetworkRecordLifecycleFlow();

beforeAll(() => {
  lifecycle.listen();
  recorder.start();
});

afterEach(async () => {
  await recorder.afterEach();
  // Reset FIRST, so a violation this test made never leaks a per-test handler into the next one —
  // then assert, so the throw below fails only the test that made the violation.
  lifecycle.resetHandlers();
  lifecycle.assertNoUnhandledRequests();
});

afterAll(() => {
  recorder.stop();
  lifecycle.close();
});
