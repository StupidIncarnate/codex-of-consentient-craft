/**
 * PURPOSE: Assembles the ESLint plugin object with all custom rules and configurations
 *
 * USAGE:
 * const plugin = EslintPluginCreateResponder();
 * // Returns { rules: {...}, configs: {...} } ready for ESLint consumption
 */
import { ruleBanAdhocTypesBroker } from '../../../brokers/rule/ban-adhoc-types/rule-ban-adhoc-types-broker';
import { ruleBanPrimitivesBroker } from '../../../brokers/rule/ban-primitives/rule-ban-primitives-broker';
import { ruleEnforceContractUsageInTestsBroker } from '../../../brokers/rule/enforce-contract-usage-in-tests/rule-enforce-contract-usage-in-tests-broker';
import { ruleBanJsxOutsideWidgetsAndFlowsBroker } from '../../../brokers/rule/ban-jsx-outside-widgets-and-flows/rule-ban-jsx-outside-widgets-and-flows-broker';
import { ruleBanJestMockInTestsBroker } from '../../../brokers/rule/ban-jest-mock-in-tests/rule-ban-jest-mock-in-tests-broker';
import { ruleRequireZodOnPrimitivesBroker } from '../../../brokers/rule/require-zod-on-primitives/rule-require-zod-on-primitives-broker';
import { ruleEnforceProjectStructureBroker } from '../../../brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker';
import { ruleEnforceImportDependenciesBroker } from '../../../brokers/rule/enforce-import-dependencies/rule-enforce-import-dependencies-broker';
import { ruleEnforceJestMockedUsageBroker } from '../../../brokers/rule/enforce-jest-mocked-usage/rule-enforce-jest-mocked-usage-broker';
import { ruleEnforceMagicArraysBroker } from '../../../brokers/rule/enforce-magic-arrays/rule-enforce-magic-arrays-broker';
import { ruleEnforceObjectDestructuringParamsBroker } from '../../../brokers/rule/enforce-object-destructuring-params/rule-enforce-object-destructuring-params-broker';
import { ruleEnforceOptionalGuardParamsBroker } from '../../../brokers/rule/enforce-optional-guard-params/rule-enforce-optional-guard-params-broker';
import { ruleEnforceStubPatternsBroker } from '../../../brokers/rule/enforce-stub-patterns/rule-enforce-stub-patterns-broker';
import { ruleEnforceStubUsageBroker } from '../../../brokers/rule/enforce-stub-usage/rule-enforce-stub-usage-broker';
import { ruleEnforceProxyChildCreationBroker } from '../../../brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker';
import { ruleEnforceProxyPatternsBroker } from '../../../brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker';
import { ruleEnforceTestColocationBroker } from '../../../brokers/rule/enforce-test-colocation/rule-enforce-test-colocation-broker';
import { ruleEnforceTestCreationOfProxyBroker } from '../../../brokers/rule/enforce-test-creation-of-proxy/rule-enforce-test-creation-of-proxy-broker';
import { ruleEnforceTestProxyImportsBroker } from '../../../brokers/rule/enforce-test-proxy-imports/rule-enforce-test-proxy-imports-broker';
import { ruleEnforceHydrationRecipesStructureBroker } from '../../../brokers/rule/enforce-hydration-recipes-structure/rule-enforce-hydration-recipes-structure-broker';
import { ruleEnforceImplementationColocationBroker } from '../../../brokers/rule/enforce-implementation-colocation/rule-enforce-implementation-colocation-broker';
import { ruleForbidNonExportedFunctionsBroker } from '../../../brokers/rule/forbid-non-exported-functions/rule-forbid-non-exported-functions-broker';
import { ruleForbidTypeReexportBroker } from '../../../brokers/rule/forbid-type-reexport/rule-forbid-type-reexport-broker';
import { ruleJestMockedMustImportBroker } from '../../../brokers/rule/jest-mocked-must-import/rule-jest-mocked-must-import-broker';
import { ruleNoMutableStateInProxyFactoryBroker } from '../../../brokers/rule/no-mutable-state-in-proxy-factory/rule-no-mutable-state-in-proxy-factory-broker';
import { ruleRequireContractValidationBroker } from '../../../brokers/rule/require-contract-validation/rule-require-contract-validation-broker';
import { ruleNoMultiplePropertyAssertionsBroker } from '../../../brokers/rule/no-multiple-property-assertions/rule-no-multiple-property-assertions-broker';
import { ruleForbidTodoSkipBroker } from '../../../brokers/rule/forbid-todo-skip/rule-forbid-todo-skip-broker';
import { ruleEnforceRegexUsageBroker } from '../../../brokers/rule/enforce-regex-usage/rule-enforce-regex-usage-broker';
import { ruleEnforceFileMetadataBroker } from '../../../brokers/rule/enforce-file-metadata/rule-enforce-file-metadata-broker';
import { ruleEnforceFolderReturnTypesBroker } from '../../../brokers/rule/enforce-folder-return-types/rule-enforce-folder-return-types-broker';
import { ruleBanFetchInProxiesBroker } from '../../../brokers/rule/ban-fetch-in-proxies/rule-ban-fetch-in-proxies-broker';
import { ruleBanStartupBranchingBroker } from '../../../brokers/rule/ban-startup-branching/rule-ban-startup-branching-broker';
import { ruleBanJestMockInProxiesBroker } from '../../../brokers/rule/ban-jest-mock-in-proxies/rule-ban-jest-mock-in-proxies-broker';
import { ruleEnforceHarnessPatternsBroker } from '../../../brokers/rule/enforce-harness-patterns/rule-enforce-harness-patterns-broker';
import { ruleBanNodeBuiltinsInTestScenariosBroker } from '../../../brokers/rule/ban-node-builtins-in-test-scenarios/rule-ban-node-builtins-in-test-scenarios-broker';
import { ruleBanInlineHelpersInTestScenariosBroker } from '../../../brokers/rule/ban-inline-helpers-in-test-scenarios/rule-ban-inline-helpers-in-test-scenarios-broker';
import { ruleBanSilentCatchBroker } from '../../../brokers/rule/ban-silent-catch/rule-ban-silent-catch-broker';
import { ruleBanWaitForTimeoutBroker } from '../../../brokers/rule/ban-wait-for-timeout/rule-ban-wait-for-timeout-broker';
import { ruleBanPageRouteInE2eBroker } from '../../../brokers/rule/ban-page-route-in-e2e/rule-ban-page-route-in-e2e-broker';
import { ruleEnforceE2eBaseImportBroker } from '../../../brokers/rule/enforce-e2e-base-import/rule-enforce-e2e-base-import-broker';
import { ruleBanNotToThrowBroker } from '../../../brokers/rule/ban-not-to-throw/rule-ban-not-to-throw-broker';
import { ruleBanWeakExistenceMatchersBroker } from '../../../brokers/rule/ban-weak-existence-matchers/rule-ban-weak-existence-matchers-broker';
import { ruleBanTypeofAssertionsBroker } from '../../../brokers/rule/ban-typeof-assertions/rule-ban-typeof-assertions-broker';
import { ruleEnforceTestNamePrefixBroker } from '../../../brokers/rule/enforce-test-name-prefix/rule-enforce-test-name-prefix-broker';
import { ruleBanUnanchoredToMatchBroker } from '../../../brokers/rule/ban-unanchored-to-match/rule-ban-unanchored-to-match-broker';
import { ruleEnforceTestidQueriesBroker } from '../../../brokers/rule/enforce-testid-queries/rule-enforce-testid-queries-broker';
import { ruleBanPlaywrightEvaluateForStylesBroker } from '../../../brokers/rule/ban-playwright-evaluate-for-styles/rule-ban-playwright-evaluate-for-styles-broker';
import { ruleBanPlaywrightExtractThenAssertBroker } from '../../../brokers/rule/ban-playwright-extract-then-assert/rule-ban-playwright-extract-then-assert-broker';
import { ruleBanNegatedMatchersBroker } from '../../../brokers/rule/ban-negated-matchers/rule-ban-negated-matchers-broker';
import { ruleBanTautologicalAssertionsBroker } from '../../../brokers/rule/ban-tautological-assertions/rule-ban-tautological-assertions-broker';
import { ruleBanObjectKeysInExpectBroker } from '../../../brokers/rule/ban-object-keys-in-expect/rule-ban-object-keys-in-expect-broker';
import { ruleBanStringIncludesInExpectBroker } from '../../../brokers/rule/ban-string-includes-in-expect/rule-ban-string-includes-in-expect-broker';
import { ruleBanWeakAsymmetricMatchersBroker } from '../../../brokers/rule/ban-weak-asymmetric-matchers/rule-ban-weak-asymmetric-matchers-broker';
import { ruleNoBareProcessCwdBroker } from '../../../brokers/rule/no-bare-process-cwd/rule-no-bare-process-cwd-broker';
import { ruleBanReflectOutsideGuardsBroker } from '../../../brokers/rule/ban-reflect-outside-guards/rule-ban-reflect-outside-guards-broker';
import { ruleBanRequireInSourceBroker } from '../../../brokers/rule/ban-require-in-source/rule-ban-require-in-source-broker';
import { ruleBanUnknownPayloadInDiscriminatedUnionBroker } from '../../../brokers/rule/ban-unknown-payload-in-discriminated-union/rule-ban-unknown-payload-in-discriminated-union-broker';
import { ruleRequireValidationOnUntypedPropertyAccessBroker } from '../../../brokers/rule/require-validation-on-untyped-property-access/rule-require-validation-on-untyped-property-access-broker';
import { ruleEnforceProxyParamBindingBroker } from '../../../brokers/rule/enforce-proxy-param-binding/rule-enforce-proxy-param-binding-broker';
import { ruleBanFlattenedContractParamsBroker } from '../../../brokers/rule/ban-flattened-contract-params/rule-ban-flattened-contract-params-broker';
import { ruleBanAnonymousJsxInMapBroker } from '../../../brokers/rule/ban-anonymous-jsx-in-map/rule-ban-anonymous-jsx-in-map-broker';
import { ruleBanDomHandlesInIngredientsBroker } from '../../../brokers/rule/ban-dom-handles-in-ingredients/rule-ban-dom-handles-in-ingredients-broker';
import { ruleBanNondeterminismInIngredientsBroker } from '../../../brokers/rule/ban-nondeterminism-in-ingredients/rule-ban-nondeterminism-in-ingredients-broker';
import { ruleRawImportBanBroker } from '../../../brokers/rule/raw-import-ban/rule-raw-import-ban-broker';
import { ruleRequireContractParseBroker } from '../../../brokers/rule/require-contract-parse/rule-require-contract-parse-broker';
import { ruleEnforceUniqueContractNamesBroker } from '../../../brokers/rule/enforce-unique-contract-names/rule-enforce-unique-contract-names-broker';
import { ruleEnforceOwnerFieldReuseBroker } from '../../../brokers/rule/enforce-owner-field-reuse/rule-enforce-owner-field-reuse-broker';
import { rulePlatformGlobalsBanBroker } from '../../../brokers/rule/platform-globals-ban/rule-platform-globals-ban-broker';
import { ruleBinProgramSpawnBanBroker } from '../../../brokers/rule/bin-program-spawn-ban/rule-bin-program-spawn-ban-broker';
import { ruleGatewayImportBoundaryBroker } from '../../../brokers/rule/gateway-import-boundary/rule-gateway-import-boundary-broker';
import { ruleGatewayColocationBroker } from '../../../brokers/rule/gateway-colocation/rule-gateway-colocation-broker';
import { ruleGatewayLayoutBroker } from '../../../brokers/rule/gateway-layout/rule-gateway-layout-broker';
import { ruleGatewayDependencyDeclaredBroker } from '../../../brokers/rule/gateway-dependency-declared/rule-gateway-dependency-declared-broker';
import { ruleGatewayReturnUnknownNotCallerTypeBroker } from '../../../brokers/rule/gateway-return-unknown-not-caller-type/rule-gateway-return-unknown-not-caller-type-broker';
import { ruleGatewaySchemaBrandBroker } from '../../../brokers/rule/gateway-schema-brand/rule-gateway-schema-brand-broker';
import { ruleBanGatewayExportBroker } from '../../../brokers/rule/ban-gateway-export/rule-ban-gateway-export-broker';
import { ruleEnforceGatewayRestrictedToBroker } from '../../../brokers/rule/enforce-gateway-restricted-to/rule-enforce-gateway-restricted-to-broker';
import { ruleEnforceGatewayConfigNamesExistBroker } from '../../../brokers/rule/enforce-gateway-config-names-exist/rule-enforce-gateway-config-names-exist-broker';
import { ruleEnforceGatewaySchemaFieldsBroker } from '../../../brokers/rule/enforce-gateway-schema-fields/rule-enforce-gateway-schema-fields-broker';
import { ruleBanWorkspaceExportMocksBroker } from '../../../brokers/rule/ban-workspace-export-mocks/rule-ban-workspace-export-mocks-broker';
import { ruleBanProxyCatchAllDefaultsBroker } from '../../../brokers/rule/ban-proxy-catch-all-defaults/rule-ban-proxy-catch-all-defaults-broker';
import { ruleBanProxyEmptyCalledWithBroker } from '../../../brokers/rule/ban-proxy-empty-called-with/rule-ban-proxy-empty-called-with-broker';
import { ruleBanInventedFailuresBroker } from '../../../brokers/rule/ban-invented-failures/rule-ban-invented-failures-broker';
import { ruleBanContractTypePredicatesBroker } from '../../../brokers/rule/ban-contract-type-predicates/rule-ban-contract-type-predicates-broker';
import { ruleRequireObjectContractBrandsBroker } from '../../../brokers/rule/require-object-contract-brands/rule-require-object-contract-brands-broker';
import { ruleRequireObjectContractBrandsIndexedBroker } from '../../../brokers/rule/require-object-contract-brands-indexed/rule-require-object-contract-brands-indexed-broker';
import { ruleBanTypeAliasesBroker } from '../../../brokers/rule/ban-type-aliases/rule-ban-type-aliases-broker';
import { ruleBanTestSupportInProductionBroker } from '../../../brokers/rule/ban-test-support-in-production/rule-ban-test-support-in-production-broker';
import { ruleBanJoinIdBesideChildBroker } from '../../../brokers/rule/ban-join-id-beside-child/rule-ban-join-id-beside-child-broker';
import { configDungeonmasterBroker } from '../../../brokers/config/dungeonmaster/config-dungeonmaster-broker';

export const EslintPluginCreateResponder = (): {
  readonly rules: {
    readonly 'ban-adhoc-types': ReturnType<typeof ruleBanAdhocTypesBroker>;
    readonly 'ban-primitives': ReturnType<typeof ruleBanPrimitivesBroker>;
    readonly 'enforce-contract-usage-in-tests': ReturnType<
      typeof ruleEnforceContractUsageInTestsBroker
    >;
    readonly 'ban-jest-mock-in-tests': ReturnType<typeof ruleBanJestMockInTestsBroker>;
    readonly 'ban-jsx-outside-widgets-and-flows': ReturnType<
      typeof ruleBanJsxOutsideWidgetsAndFlowsBroker
    >;
    readonly 'require-zod-on-primitives': ReturnType<typeof ruleRequireZodOnPrimitivesBroker>;
    readonly 'enforce-project-structure': ReturnType<typeof ruleEnforceProjectStructureBroker>;
    readonly 'enforce-import-dependencies': ReturnType<typeof ruleEnforceImportDependenciesBroker>;
    readonly 'enforce-jest-mocked-usage': ReturnType<typeof ruleEnforceJestMockedUsageBroker>;
    readonly 'enforce-magic-arrays': ReturnType<typeof ruleEnforceMagicArraysBroker>;
    readonly 'enforce-object-destructuring-params': ReturnType<
      typeof ruleEnforceObjectDestructuringParamsBroker
    >;
    readonly 'enforce-optional-guard-params': ReturnType<
      typeof ruleEnforceOptionalGuardParamsBroker
    >;
    readonly 'enforce-stub-patterns': ReturnType<typeof ruleEnforceStubPatternsBroker>;
    readonly 'enforce-stub-usage': ReturnType<typeof ruleEnforceStubUsageBroker>;
    readonly 'enforce-proxy-child-creation': ReturnType<typeof ruleEnforceProxyChildCreationBroker>;
    readonly 'enforce-proxy-patterns': ReturnType<typeof ruleEnforceProxyPatternsBroker>;
    readonly 'enforce-test-colocation': ReturnType<typeof ruleEnforceTestColocationBroker>;
    readonly 'enforce-test-creation-of-proxy': ReturnType<
      typeof ruleEnforceTestCreationOfProxyBroker
    >;
    readonly 'enforce-test-proxy-imports': ReturnType<typeof ruleEnforceTestProxyImportsBroker>;
    readonly 'enforce-hydration-recipes-structure': ReturnType<
      typeof ruleEnforceHydrationRecipesStructureBroker
    >;
    readonly 'enforce-implementation-colocation': ReturnType<
      typeof ruleEnforceImplementationColocationBroker
    >;
    readonly 'forbid-non-exported-functions': ReturnType<
      typeof ruleForbidNonExportedFunctionsBroker
    >;
    readonly 'forbid-type-reexport': ReturnType<typeof ruleForbidTypeReexportBroker>;
    readonly 'jest-mocked-must-import': ReturnType<typeof ruleJestMockedMustImportBroker>;
    readonly 'no-mutable-state-in-proxy-factory': ReturnType<
      typeof ruleNoMutableStateInProxyFactoryBroker
    >;
    readonly 'require-contract-validation': ReturnType<typeof ruleRequireContractValidationBroker>;
    readonly 'no-multiple-property-assertions': ReturnType<
      typeof ruleNoMultiplePropertyAssertionsBroker
    >;
    readonly 'forbid-todo-skip': ReturnType<typeof ruleForbidTodoSkipBroker>;
    readonly 'enforce-regex-usage': ReturnType<typeof ruleEnforceRegexUsageBroker>;
    readonly 'enforce-file-metadata': ReturnType<typeof ruleEnforceFileMetadataBroker>;
    readonly 'enforce-folder-return-types': ReturnType<typeof ruleEnforceFolderReturnTypesBroker>;
    readonly 'ban-fetch-in-proxies': ReturnType<typeof ruleBanFetchInProxiesBroker>;
    readonly 'ban-startup-branching': ReturnType<typeof ruleBanStartupBranchingBroker>;
    readonly 'ban-jest-mock-in-proxies': ReturnType<typeof ruleBanJestMockInProxiesBroker>;
    readonly 'enforce-harness-patterns': ReturnType<typeof ruleEnforceHarnessPatternsBroker>;
    readonly 'ban-node-builtins-in-test-scenarios': ReturnType<
      typeof ruleBanNodeBuiltinsInTestScenariosBroker
    >;
    readonly 'ban-inline-helpers-in-test-scenarios': ReturnType<
      typeof ruleBanInlineHelpersInTestScenariosBroker
    >;
    readonly 'ban-silent-catch': ReturnType<typeof ruleBanSilentCatchBroker>;
    readonly 'ban-wait-for-timeout': ReturnType<typeof ruleBanWaitForTimeoutBroker>;
    readonly 'ban-page-route-in-e2e': ReturnType<typeof ruleBanPageRouteInE2eBroker>;
    readonly 'enforce-e2e-base-import': ReturnType<typeof ruleEnforceE2eBaseImportBroker>;
    readonly 'ban-not-to-throw': ReturnType<typeof ruleBanNotToThrowBroker>;
    readonly 'ban-weak-existence-matchers': ReturnType<typeof ruleBanWeakExistenceMatchersBroker>;
    readonly 'ban-typeof-assertions': ReturnType<typeof ruleBanTypeofAssertionsBroker>;
    readonly 'enforce-test-name-prefix': ReturnType<typeof ruleEnforceTestNamePrefixBroker>;
    readonly 'ban-unanchored-to-match': ReturnType<typeof ruleBanUnanchoredToMatchBroker>;
    readonly 'enforce-testid-queries': ReturnType<typeof ruleEnforceTestidQueriesBroker>;
    readonly 'ban-playwright-evaluate-for-styles': ReturnType<
      typeof ruleBanPlaywrightEvaluateForStylesBroker
    >;
    readonly 'ban-playwright-extract-then-assert': ReturnType<
      typeof ruleBanPlaywrightExtractThenAssertBroker
    >;
    readonly 'ban-negated-matchers': ReturnType<typeof ruleBanNegatedMatchersBroker>;
    readonly 'ban-tautological-assertions': ReturnType<typeof ruleBanTautologicalAssertionsBroker>;
    readonly 'ban-object-keys-in-expect': ReturnType<typeof ruleBanObjectKeysInExpectBroker>;
    readonly 'ban-string-includes-in-expect': ReturnType<
      typeof ruleBanStringIncludesInExpectBroker
    >;
    readonly 'ban-weak-asymmetric-matchers': ReturnType<typeof ruleBanWeakAsymmetricMatchersBroker>;
    readonly 'no-bare-process-cwd': ReturnType<typeof ruleNoBareProcessCwdBroker>;
    readonly 'ban-reflect-outside-guards': ReturnType<typeof ruleBanReflectOutsideGuardsBroker>;
    readonly 'ban-require-in-source': ReturnType<typeof ruleBanRequireInSourceBroker>;
    readonly 'ban-unknown-payload-in-discriminated-union': ReturnType<
      typeof ruleBanUnknownPayloadInDiscriminatedUnionBroker
    >;
    readonly 'require-validation-on-untyped-property-access': ReturnType<
      typeof ruleRequireValidationOnUntypedPropertyAccessBroker
    >;
    readonly 'enforce-proxy-param-binding': ReturnType<typeof ruleEnforceProxyParamBindingBroker>;
    readonly 'ban-flattened-contract-params': ReturnType<
      typeof ruleBanFlattenedContractParamsBroker
    >;
    readonly 'ban-anonymous-jsx-in-map': ReturnType<typeof ruleBanAnonymousJsxInMapBroker>;
    readonly 'ban-dom-handles-in-ingredients': ReturnType<
      typeof ruleBanDomHandlesInIngredientsBroker
    >;
    readonly 'ban-nondeterminism-in-ingredients': ReturnType<
      typeof ruleBanNondeterminismInIngredientsBroker
    >;
    readonly 'raw-import-ban': ReturnType<typeof ruleRawImportBanBroker>;
    readonly 'platform-globals-ban': ReturnType<typeof rulePlatformGlobalsBanBroker>;
    readonly 'bin-program-spawn-ban': ReturnType<typeof ruleBinProgramSpawnBanBroker>;
    readonly 'require-contract-parse': ReturnType<typeof ruleRequireContractParseBroker>;
    readonly 'enforce-unique-contract-names': ReturnType<
      typeof ruleEnforceUniqueContractNamesBroker
    >;
    readonly 'enforce-owner-field-reuse': ReturnType<typeof ruleEnforceOwnerFieldReuseBroker>;
    readonly 'gateway-import-boundary': ReturnType<typeof ruleGatewayImportBoundaryBroker>;
    readonly 'gateway-colocation': ReturnType<typeof ruleGatewayColocationBroker>;
    readonly 'gateway-layout': ReturnType<typeof ruleGatewayLayoutBroker>;
    readonly 'gateway-dependency-declared': ReturnType<typeof ruleGatewayDependencyDeclaredBroker>;
    readonly 'gateway-return-unknown-not-caller-type': ReturnType<
      typeof ruleGatewayReturnUnknownNotCallerTypeBroker
    >;
    readonly 'gateway-schema-brand': ReturnType<typeof ruleGatewaySchemaBrandBroker>;
    readonly 'ban-gateway-export': ReturnType<typeof ruleBanGatewayExportBroker>;
    readonly 'enforce-gateway-restricted-to': ReturnType<
      typeof ruleEnforceGatewayRestrictedToBroker
    >;
    readonly 'enforce-gateway-config-names-exist': ReturnType<
      typeof ruleEnforceGatewayConfigNamesExistBroker
    >;
    readonly 'ban-workspace-export-mocks': ReturnType<typeof ruleBanWorkspaceExportMocksBroker>;
    readonly 'ban-proxy-catch-all-defaults': ReturnType<typeof ruleBanProxyCatchAllDefaultsBroker>;
    readonly 'ban-proxy-empty-called-with': ReturnType<typeof ruleBanProxyEmptyCalledWithBroker>;
    readonly 'ban-invented-failures': ReturnType<typeof ruleBanInventedFailuresBroker>;
    readonly 'enforce-gateway-schema-fields': ReturnType<
      typeof ruleEnforceGatewaySchemaFieldsBroker
    >;
    readonly 'ban-contract-type-predicates': ReturnType<typeof ruleBanContractTypePredicatesBroker>;
    readonly 'require-object-contract-brands': ReturnType<
      typeof ruleRequireObjectContractBrandsBroker
    >;
    readonly 'require-object-contract-brands-indexed': ReturnType<
      typeof ruleRequireObjectContractBrandsIndexedBroker
    >;
    readonly 'ban-type-aliases': ReturnType<typeof ruleBanTypeAliasesBroker>;
    readonly 'ban-test-support-in-production': ReturnType<
      typeof ruleBanTestSupportInProductionBroker
    >;
    readonly 'ban-join-id-beside-child': ReturnType<typeof ruleBanJoinIdBesideChildBroker>;
  };
  readonly configs: {
    readonly dungeonmaster: ReturnType<typeof configDungeonmasterBroker>;
    readonly dungeonmasterTest: ReturnType<typeof configDungeonmasterBroker>;
  };
} =>
  ({
    rules: {
      'ban-adhoc-types': ruleBanAdhocTypesBroker(),
      'ban-primitives': ruleBanPrimitivesBroker(),
      'enforce-contract-usage-in-tests': ruleEnforceContractUsageInTestsBroker(),
      'ban-jest-mock-in-tests': ruleBanJestMockInTestsBroker(),
      'ban-jsx-outside-widgets-and-flows': ruleBanJsxOutsideWidgetsAndFlowsBroker(),
      'require-zod-on-primitives': ruleRequireZodOnPrimitivesBroker(),
      'enforce-project-structure': ruleEnforceProjectStructureBroker(),
      'enforce-import-dependencies': ruleEnforceImportDependenciesBroker(),
      'enforce-jest-mocked-usage': ruleEnforceJestMockedUsageBroker(),
      'enforce-magic-arrays': ruleEnforceMagicArraysBroker(),
      'enforce-object-destructuring-params': ruleEnforceObjectDestructuringParamsBroker(),
      'enforce-optional-guard-params': ruleEnforceOptionalGuardParamsBroker(),
      'enforce-stub-patterns': ruleEnforceStubPatternsBroker(),
      'enforce-stub-usage': ruleEnforceStubUsageBroker(),
      'enforce-proxy-child-creation': ruleEnforceProxyChildCreationBroker(),
      'enforce-proxy-patterns': ruleEnforceProxyPatternsBroker(),
      'enforce-test-colocation': ruleEnforceTestColocationBroker(),
      'enforce-test-creation-of-proxy': ruleEnforceTestCreationOfProxyBroker(),
      'enforce-test-proxy-imports': ruleEnforceTestProxyImportsBroker(),
      'enforce-hydration-recipes-structure': ruleEnforceHydrationRecipesStructureBroker(),
      'enforce-implementation-colocation': ruleEnforceImplementationColocationBroker(),
      'forbid-non-exported-functions': ruleForbidNonExportedFunctionsBroker(),
      'forbid-type-reexport': ruleForbidTypeReexportBroker(),
      'jest-mocked-must-import': ruleJestMockedMustImportBroker(),
      'no-mutable-state-in-proxy-factory': ruleNoMutableStateInProxyFactoryBroker(),
      'require-contract-validation': ruleRequireContractValidationBroker(),
      'no-multiple-property-assertions': ruleNoMultiplePropertyAssertionsBroker(),
      'forbid-todo-skip': ruleForbidTodoSkipBroker(),
      'enforce-regex-usage': ruleEnforceRegexUsageBroker(),
      'enforce-file-metadata': ruleEnforceFileMetadataBroker(),
      'enforce-folder-return-types': ruleEnforceFolderReturnTypesBroker(),
      'ban-fetch-in-proxies': ruleBanFetchInProxiesBroker(),
      'ban-startup-branching': ruleBanStartupBranchingBroker(),
      'ban-jest-mock-in-proxies': ruleBanJestMockInProxiesBroker(),
      'enforce-harness-patterns': ruleEnforceHarnessPatternsBroker(),
      'ban-node-builtins-in-test-scenarios': ruleBanNodeBuiltinsInTestScenariosBroker(),
      'ban-inline-helpers-in-test-scenarios': ruleBanInlineHelpersInTestScenariosBroker(),
      'ban-silent-catch': ruleBanSilentCatchBroker(),
      'ban-wait-for-timeout': ruleBanWaitForTimeoutBroker(),
      'ban-page-route-in-e2e': ruleBanPageRouteInE2eBroker(),
      'enforce-e2e-base-import': ruleEnforceE2eBaseImportBroker(),
      'ban-not-to-throw': ruleBanNotToThrowBroker(),
      'ban-weak-existence-matchers': ruleBanWeakExistenceMatchersBroker(),
      'ban-typeof-assertions': ruleBanTypeofAssertionsBroker(),
      'enforce-test-name-prefix': ruleEnforceTestNamePrefixBroker(),
      'ban-unanchored-to-match': ruleBanUnanchoredToMatchBroker(),
      'enforce-testid-queries': ruleEnforceTestidQueriesBroker(),
      'ban-playwright-evaluate-for-styles': ruleBanPlaywrightEvaluateForStylesBroker(),
      'ban-playwright-extract-then-assert': ruleBanPlaywrightExtractThenAssertBroker(),
      'ban-negated-matchers': ruleBanNegatedMatchersBroker(),
      'ban-tautological-assertions': ruleBanTautologicalAssertionsBroker(),
      'ban-object-keys-in-expect': ruleBanObjectKeysInExpectBroker(),
      'ban-string-includes-in-expect': ruleBanStringIncludesInExpectBroker(),
      'ban-weak-asymmetric-matchers': ruleBanWeakAsymmetricMatchersBroker(),
      'no-bare-process-cwd': ruleNoBareProcessCwdBroker(),
      'ban-reflect-outside-guards': ruleBanReflectOutsideGuardsBroker(),
      'ban-require-in-source': ruleBanRequireInSourceBroker(),
      'ban-unknown-payload-in-discriminated-union':
        ruleBanUnknownPayloadInDiscriminatedUnionBroker(),
      'require-validation-on-untyped-property-access':
        ruleRequireValidationOnUntypedPropertyAccessBroker(),
      'enforce-proxy-param-binding': ruleEnforceProxyParamBindingBroker(),
      'ban-flattened-contract-params': ruleBanFlattenedContractParamsBroker(),
      'ban-anonymous-jsx-in-map': ruleBanAnonymousJsxInMapBroker(),
      'ban-dom-handles-in-ingredients': ruleBanDomHandlesInIngredientsBroker(),
      'ban-nondeterminism-in-ingredients': ruleBanNondeterminismInIngredientsBroker(),
      'raw-import-ban': ruleRawImportBanBroker(),
      'platform-globals-ban': rulePlatformGlobalsBanBroker(),
      'bin-program-spawn-ban': ruleBinProgramSpawnBanBroker(),
      'require-contract-parse': ruleRequireContractParseBroker(),
      'enforce-unique-contract-names': ruleEnforceUniqueContractNamesBroker(),
      'enforce-owner-field-reuse': ruleEnforceOwnerFieldReuseBroker(),
      'gateway-import-boundary': ruleGatewayImportBoundaryBroker(),
      'gateway-colocation': ruleGatewayColocationBroker(),
      'gateway-layout': ruleGatewayLayoutBroker(),
      'gateway-dependency-declared': ruleGatewayDependencyDeclaredBroker(),
      'gateway-return-unknown-not-caller-type': ruleGatewayReturnUnknownNotCallerTypeBroker(),
      'gateway-schema-brand': ruleGatewaySchemaBrandBroker(),
      'ban-gateway-export': ruleBanGatewayExportBroker(),
      'enforce-gateway-restricted-to': ruleEnforceGatewayRestrictedToBroker(),
      'enforce-gateway-config-names-exist': ruleEnforceGatewayConfigNamesExistBroker(),
      'ban-workspace-export-mocks': ruleBanWorkspaceExportMocksBroker(),
      'ban-proxy-catch-all-defaults': ruleBanProxyCatchAllDefaultsBroker(),
      'ban-proxy-empty-called-with': ruleBanProxyEmptyCalledWithBroker(),
      'ban-invented-failures': ruleBanInventedFailuresBroker(),
      'enforce-gateway-schema-fields': ruleEnforceGatewaySchemaFieldsBroker(),
      'ban-contract-type-predicates': ruleBanContractTypePredicatesBroker(),
      'require-object-contract-brands': ruleRequireObjectContractBrandsBroker(),
      'require-object-contract-brands-indexed': ruleRequireObjectContractBrandsIndexedBroker(),
      'ban-type-aliases': ruleBanTypeAliasesBroker(),
      'ban-test-support-in-production': ruleBanTestSupportInProductionBroker(),
      'ban-join-id-beside-child': ruleBanJoinIdBesideChildBroker(),
    },
    configs: {
      dungeonmaster: configDungeonmasterBroker(),
      dungeonmasterTest: configDungeonmasterBroker({ forTesting: true }),
    },
  }) as const;
