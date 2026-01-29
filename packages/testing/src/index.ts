// Testing utilities and helpers for Dungeonmaster projects

export const TESTING_PACKAGE_VERSION = '0.1.0';

// Test mocking utilities
export { childProcessMockerAdapter } from './adapters/child-process/mocker/child-process-mocker-adapter';
export type { MockSpawnResult } from './contracts/mock-spawn-result/mock-spawn-result-contract';
export type { MockProcessBehavior } from './contracts/mock-process-behavior/mock-process-behavior-contract';

// Test project utilities
export { integrationEnvironmentCreateBroker } from './brokers/integration-environment/create/integration-environment-create-broker';
export { integrationEnvironmentCleanupAllBroker } from './brokers/integration-environment/cleanup-all/integration-environment-cleanup-all-broker';
export { integrationEnvironmentListBroker } from './brokers/integration-environment/list/integration-environment-list-broker';
export type { TestProject } from './contracts/test-project/test-project-contract';
export type { DungeonmasterConfig } from './contracts/dungeonmaster-config/dungeonmaster-config-contract';

// Install testbed utilities
export { installTestbedCreateBroker } from './brokers/install-testbed/create/install-testbed-create-broker';
export type { InstallTestbed } from './contracts/install-testbed/install-testbed-contract';

// E2E testbed utilities
export { e2eTestbedCreateBroker } from './brokers/e2e-testbed/create/e2e-testbed-create-broker';
export type { E2ETestbed, KeyName } from './contracts/e2e-testbed/e2e-testbed-contract';
export type { CliScreenName } from './contracts/cli-screen-name/cli-screen-name-contract';
export type { ScreenFrame } from './contracts/screen-frame/screen-frame-contract';
export type { E2EScreenState } from './contracts/e2e-screen-state/e2e-screen-state-contract';
export type { SubdirName } from './contracts/subdir-name/subdir-name-contract';

// TypeScript transformer - use @dungeonmaster/testing/ts-jest/proxy-mock-transformer in jest.config.js

// Contract stubs
export { MockSpawnResultStub } from './contracts/mock-spawn-result/mock-spawn-result.stub';
export { MockProcessBehaviorStub } from './contracts/mock-process-behavior/mock-process-behavior.stub';
export { TestProjectStub } from './contracts/test-project/test-project.stub';
export { DungeonmasterConfigStub } from './contracts/dungeonmaster-config/dungeonmaster-config.stub';
export { InstallTestbedStub } from './contracts/install-testbed/install-testbed.stub';
export { BaseNameStub } from './contracts/base-name/base-name.stub';
export { FileNameStub } from './contracts/file-name/file-name.stub';
export { FileContentStub } from './contracts/file-content/file-content.stub';
export { RelativePathStub } from './contracts/relative-path/relative-path.stub';
export { CliScreenNameStub } from './contracts/cli-screen-name/cli-screen-name.stub';
export { ScreenFrameStub } from './contracts/screen-frame/screen-frame.stub';
export { E2EScreenStateStub } from './contracts/e2e-screen-state/e2e-screen-state.stub';
export { E2ETestbedStub } from './contracts/e2e-testbed/e2e-testbed.stub';
export { SubdirNameStub } from './contracts/subdir-name/subdir-name.stub';
