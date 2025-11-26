// Testing utilities and helpers for QuestMaestro projects

export const TESTING_PACKAGE_VERSION = '0.1.0';

// Test mocking utilities
export { childProcessMockerAdapter } from './adapters/child-process/mocker/child-process-mocker-adapter';
export type { MockSpawnResult } from './contracts/mock-spawn-result/mock-spawn-result-contract';
export type { MockProcessBehavior } from './contracts/mock-process-behavior/mock-process-behavior-contract';

// Test project utilities
export { integrationEnvironmentCreateBroker } from './brokers/integration-environment/create/integration-environment-create-broker';
export { integrationEnvironmentCreateBrokerProxy } from './brokers/integration-environment/create/integration-environment-create-broker.proxy';
export { integrationEnvironmentCleanupAllBroker } from './brokers/integration-environment/cleanup-all/integration-environment-cleanup-all-broker';
export { integrationEnvironmentListBroker } from './brokers/integration-environment/list/integration-environment-list-broker';
export type { TestProject } from './contracts/test-project/test-project-contract';
export type { QuestmaestroConfig } from './contracts/questmaestro-config/questmaestro-config-contract';

// TypeScript transformer adapter
import type * as ts from 'typescript';
import { typescriptProxyMockTransformerAdapter as _typescriptProxyMockTransformerAdapter } from './adapters/typescript/proxy-mock-transformer/typescript-proxy-mock-transformer-adapter';
import { typescriptTransformerStatics } from './statics/typescript-transformer/typescript-transformer-statics';

export { typescriptProxyMockTransformerAdapter } from './adapters/typescript/proxy-mock-transformer/typescript-proxy-mock-transformer-adapter';
export const { name, version } = typescriptTransformerStatics;
export const factory = ({
  program,
}: {
  program?: ts.Program;
}): ts.TransformerFactory<ts.SourceFile> => {
  if (!program) {
    throw new Error('jest-proxy-mock-transformer requires a TypeScript Program');
  }
  return _typescriptProxyMockTransformerAdapter({ program });
};

// Contract stubs
export { MockSpawnResultStub } from './contracts/mock-spawn-result/mock-spawn-result.stub';
export { MockProcessBehaviorStub } from './contracts/mock-process-behavior/mock-process-behavior.stub';
export { TestProjectStub } from './contracts/test-project/test-project.stub';
export { QuestmaestroConfigStub } from './contracts/questmaestro-config/questmaestro-config.stub';
