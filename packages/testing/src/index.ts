// Testing utilities and helpers for QuestMaestro projects

export const TESTING_PACKAGE_VERSION = '0.1.0';

// Test mocking utilities
export { childProcessMockerAdapter } from './adapters/child-process/mocker/child-process-mocker-adapter';
export type { MockSpawnResult } from './contracts/mock-spawn-result/mock-spawn-result-contract';
export type { MockProcessBehavior } from './contracts/mock-process-behavior/mock-process-behavior-contract';

// Test project utilities - all from create broker (they share state)
export {
  integrationEnvironmentCreateBroker,
  integrationEnvironmentCleanupAllBroker,
  integrationEnvironmentListBroker,
} from './brokers/integration-environment/create/integration-environment-create-broker';
export type { TestProject } from './contracts/test-project/test-project-contract';
export type { QuestmaestroConfig } from './contracts/questmaestro-config/questmaestro-config-contract';

// TypeScript transformer adapter
export {
  typescriptProxyMockTransformerAdapter,
  factory,
  name,
  version,
} from './adapters/typescript/proxy-mock-transformer/typescript-proxy-mock-transformer-adapter';

// Contract stubs
export { MockSpawnResultStub } from './contracts/mock-spawn-result/mock-spawn-result.stub';
export { MockProcessBehaviorStub } from './contracts/mock-process-behavior/mock-process-behavior.stub';
export { TestProjectStub } from './contracts/test-project/test-project.stub';
export { QuestmaestroConfigStub } from './contracts/questmaestro-config/questmaestro-config.stub';
