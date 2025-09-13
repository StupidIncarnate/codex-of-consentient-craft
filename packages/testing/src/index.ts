// Testing utilities and helpers for QuestMaestro projects

export const TESTING_PACKAGE_VERSION = '0.1.0';

// Test mocking utilities
export { ChildProcessMocker } from './child-process-mocker';
export type { MockSpawnResult, MockProcessBehavior } from './child-process-mocker';

// Test project utilities
export { createTestProject } from './testbed';
export type { TestProject, QuestmaestroConfig } from './testbed';
