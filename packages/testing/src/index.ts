// Testing utilities and helpers for Dungeonmaster projects

export const TESTING_PACKAGE_VERSION = '0.1.0';

// Test mocking utilities
export type { MockSpawnResult } from './contracts/mock-spawn-result/mock-spawn-result-contract';
export type { MockProcessBehavior } from './contracts/mock-process-behavior/mock-process-behavior-contract';

// Test project utilities
export { integrationEnvironmentCreateBroker } from './brokers/integration-environment/create/integration-environment-create-broker';
export { integrationEnvironmentCleanupAllBroker } from './brokers/integration-environment/cleanup-all/integration-environment-cleanup-all-broker';
export { integrationEnvironmentListBroker } from './brokers/integration-environment/list/integration-environment-list-broker';
export type { TestGuild } from './contracts/test-guild/test-guild-contract';
export type { TestbedConfig } from './contracts/testbed-config/testbed-config-contract';

// Install testbed utilities
export { installTestbedCreateBroker } from './brokers/install-testbed/create/install-testbed-create-broker';
export type { InstallTestbed } from './contracts/install-testbed/install-testbed-contract';

// HTTP endpoint mocking
export { StartEndpointMock } from './startup/start-endpoint-mock';
export type {
  EndpointControl,
  HttpMethod,
} from './contracts/endpoint-control/endpoint-control-contract';

// TypeScript transformer - use @dungeonmaster/testing/ts-jest/proxy-mock-transformer in jest.config.js

// Contract stubs
export { MockSpawnResultStub } from './contracts/mock-spawn-result/mock-spawn-result.stub';
export { MockProcessBehaviorStub } from './contracts/mock-process-behavior/mock-process-behavior.stub';
export { TestGuildStub } from './contracts/test-guild/test-guild.stub';
export { TestbedConfigStub } from './contracts/testbed-config/testbed-config.stub';
export { InstallTestbedStub } from './contracts/install-testbed/install-testbed.stub';

// Mock dispatch
export { mockRegisterMiddleware as registerMock } from './middleware/mock-register/mock-register-middleware';
export type { MockHandle } from './contracts/mock-handle/mock-handle-contract';
