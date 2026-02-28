// Child proxies for enforce-proxy-child-creation, enforce-implementation-colocation,
// enforce-proxy-patterns, and enforce-test-colocation transitively import adapter proxies
// that call jest.mock('fs'). The eslint-plugin-jest npm package uses fs.readdirSync at load
// time which breaks under the fs mock. Provide a minimal mock to prevent the crash.
import _eslintPluginJest from 'eslint-plugin-jest';

jest.mock('eslint-plugin-jest', () => ({
  __esModule: true,
  default: { rules: {}, configs: {} },
}));

import { ruleBanAdhocTypesBrokerProxy } from '../../../brokers/rule/ban-adhoc-types/rule-ban-adhoc-types-broker.proxy';
import { ruleBanPrimitivesBrokerProxy } from '../../../brokers/rule/ban-primitives/rule-ban-primitives-broker.proxy';
import { ruleEnforceContractUsageInTestsBrokerProxy } from '../../../brokers/rule/enforce-contract-usage-in-tests/rule-enforce-contract-usage-in-tests-broker.proxy';
import { ruleBanJestMockInTestsBrokerProxy } from '../../../brokers/rule/ban-jest-mock-in-tests/rule-ban-jest-mock-in-tests-broker.proxy';
import { ruleRequireZodOnPrimitivesBrokerProxy } from '../../../brokers/rule/require-zod-on-primitives/rule-require-zod-on-primitives-broker.proxy';
import { ruleExplicitReturnTypesBrokerProxy } from '../../../brokers/rule/explicit-return-types/rule-explicit-return-types-broker.proxy';
import { ruleEnforceProjectStructureBrokerProxy } from '../../../brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker.proxy';
import { ruleEnforceImportDependenciesBrokerProxy } from '../../../brokers/rule/enforce-import-dependencies/rule-enforce-import-dependencies-broker.proxy';
import { ruleEnforceJestMockedUsageBrokerProxy } from '../../../brokers/rule/enforce-jest-mocked-usage/rule-enforce-jest-mocked-usage-broker.proxy';
import { ruleEnforceMagicArraysBrokerProxy } from '../../../brokers/rule/enforce-magic-arrays/rule-enforce-magic-arrays-broker.proxy';
import { ruleEnforceObjectDestructuringParamsBrokerProxy } from '../../../brokers/rule/enforce-object-destructuring-params/rule-enforce-object-destructuring-params-broker.proxy';
import { ruleEnforceOptionalGuardParamsBrokerProxy } from '../../../brokers/rule/enforce-optional-guard-params/rule-enforce-optional-guard-params-broker.proxy';
import { ruleEnforceStubPatternsBrokerProxy } from '../../../brokers/rule/enforce-stub-patterns/rule-enforce-stub-patterns-broker.proxy';
import { ruleEnforceStubUsageBrokerProxy } from '../../../brokers/rule/enforce-stub-usage/rule-enforce-stub-usage-broker.proxy';
import { ruleEnforceProxyChildCreationBrokerProxy } from '../../../brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.proxy';
import { ruleEnforceProxyPatternsBrokerProxy } from '../../../brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.proxy';
import { ruleEnforceTestColocationBrokerProxy } from '../../../brokers/rule/enforce-test-colocation/rule-enforce-test-colocation-broker.proxy';
import { ruleEnforceTestCreationOfProxyBrokerProxy } from '../../../brokers/rule/enforce-test-creation-of-proxy/rule-enforce-test-creation-of-proxy-broker.proxy';
import { ruleEnforceTestProxyImportsBrokerProxy } from '../../../brokers/rule/enforce-test-proxy-imports/rule-enforce-test-proxy-imports-broker.proxy';
import { ruleEnforceImplementationColocationBrokerProxy } from '../../../brokers/rule/enforce-implementation-colocation/rule-enforce-implementation-colocation-broker.proxy';
import { ruleForbidNonExportedFunctionsBrokerProxy } from '../../../brokers/rule/forbid-non-exported-functions/rule-forbid-non-exported-functions-broker.proxy';
import { ruleForbidTypeReexportBrokerProxy } from '../../../brokers/rule/forbid-type-reexport/rule-forbid-type-reexport-broker.proxy';
import { ruleJestMockedMustImportBrokerProxy } from '../../../brokers/rule/jest-mocked-must-import/rule-jest-mocked-must-import-broker.proxy';
import { ruleNoMutableStateInProxyFactoryBrokerProxy } from '../../../brokers/rule/no-mutable-state-in-proxy-factory/rule-no-mutable-state-in-proxy-factory-broker.proxy';
import { ruleRequireContractValidationBrokerProxy } from '../../../brokers/rule/require-contract-validation/rule-require-contract-validation-broker.proxy';
import { ruleNoMultiplePropertyAssertionsBrokerProxy } from '../../../brokers/rule/no-multiple-property-assertions/rule-no-multiple-property-assertions-broker.proxy';
import { ruleForbidTodoSkipBrokerProxy } from '../../../brokers/rule/forbid-todo-skip/rule-forbid-todo-skip-broker.proxy';
import { ruleEnforceRegexUsageBrokerProxy } from '../../../brokers/rule/enforce-regex-usage/rule-enforce-regex-usage-broker.proxy';
import { ruleEnforceFileMetadataBrokerProxy } from '../../../brokers/rule/enforce-file-metadata/rule-enforce-file-metadata-broker.proxy';
import { ruleBanFetchInProxiesBrokerProxy } from '../../../brokers/rule/ban-fetch-in-proxies/rule-ban-fetch-in-proxies-broker.proxy';
import { ruleBanStartupBranchingBrokerProxy } from '../../../brokers/rule/ban-startup-branching/rule-ban-startup-branching-broker.proxy';
import { configDungeonmasterBrokerProxy } from '../../../brokers/config/dungeonmaster/config-dungeonmaster-broker.proxy';
import { EslintPluginCreateResponder } from './eslint-plugin-create-responder';

export const EslintPluginCreateResponderProxy = (): {
  callResponder: typeof EslintPluginCreateResponder;
} => {
  ruleBanAdhocTypesBrokerProxy();
  ruleBanPrimitivesBrokerProxy();
  ruleEnforceContractUsageInTestsBrokerProxy();
  ruleBanJestMockInTestsBrokerProxy();
  ruleRequireZodOnPrimitivesBrokerProxy();
  ruleExplicitReturnTypesBrokerProxy();
  ruleEnforceProjectStructureBrokerProxy();
  ruleEnforceImportDependenciesBrokerProxy();
  ruleEnforceJestMockedUsageBrokerProxy();
  ruleEnforceMagicArraysBrokerProxy();
  ruleEnforceObjectDestructuringParamsBrokerProxy();
  ruleEnforceOptionalGuardParamsBrokerProxy();
  ruleEnforceStubPatternsBrokerProxy();
  ruleEnforceStubUsageBrokerProxy();
  ruleEnforceProxyChildCreationBrokerProxy();
  ruleEnforceProxyPatternsBrokerProxy();
  ruleEnforceTestColocationBrokerProxy();
  ruleEnforceTestCreationOfProxyBrokerProxy();
  ruleEnforceTestProxyImportsBrokerProxy();
  ruleEnforceImplementationColocationBrokerProxy();
  ruleForbidNonExportedFunctionsBrokerProxy();
  ruleForbidTypeReexportBrokerProxy();
  ruleJestMockedMustImportBrokerProxy();
  ruleNoMutableStateInProxyFactoryBrokerProxy();
  ruleRequireContractValidationBrokerProxy();
  ruleNoMultiplePropertyAssertionsBrokerProxy();
  ruleForbidTodoSkipBrokerProxy();
  ruleEnforceRegexUsageBrokerProxy();
  ruleEnforceFileMetadataBrokerProxy();
  ruleBanFetchInProxiesBrokerProxy();
  ruleBanStartupBranchingBrokerProxy();
  configDungeonmasterBrokerProxy();

  return {
    callResponder: EslintPluginCreateResponder,
  };
};
