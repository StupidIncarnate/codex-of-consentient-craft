import { DependencyStepStub, StepFileReferenceStub } from '@dungeonmaster/shared/contracts';

import { questIntegrationStepsMissingPackageDepsTransformer } from './quest-integration-steps-missing-package-deps-transformer';

describe('questIntegrationStepsMissingPackageDepsTransformer', () => {
  describe('empty / skip cases', () => {
    it('EMPTY: {steps: undefined} => returns []', () => {
      const result = questIntegrationStepsMissingPackageDepsTransformer({});

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps: []} => returns []', () => {
      const result = questIntegrationStepsMissingPackageDepsTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {no integration steps, all brokers} => returns []', () => {
      const a = DependencyStepStub({
        id: 'a' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/brokers/user/create/user-create-broker.ts' as never,
        }),
      });
      const b = DependencyStepStub({
        id: 'b' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/brokers/user/update/user-update-broker.ts' as never,
        }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({ steps: [a, b] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {all steps use focusAction, none file-anchored} => returns []', () => {
      const a = DependencyStepStub({
        id: 'a' as never,
        focusFile: undefined,
        focusAction: {
          kind: 'verification' as never,
          description: 'Run something' as never,
        },
      });
      const b = DependencyStepStub({
        id: 'b' as never,
        focusFile: undefined,
        focusAction: {
          kind: 'verification' as never,
          description: 'Run something else' as never,
        },
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({ steps: [a, b] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {integration step alongside focusAction-only steps} => ignores action steps, returns []', () => {
      const brokerStep = DependencyStepStub({
        id: 'broker' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/brokers/x/y/x-y-broker.ts' as never,
        }),
      });
      const flowStep = DependencyStepStub({
        id: 'flow' as never,
        dependsOn: ['broker' as never],
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/flows/install/install-flow.ts' as never,
        }),
      });
      const actionStep = DependencyStepStub({
        id: 'verify' as never,
        focusFile: undefined,
        focusAction: {
          kind: 'verification' as never,
          description: 'Confirm ward passes' as never,
        },
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({
        steps: [brokerStep, flowStep, actionStep],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('integration steps that cover all peers', () => {
    it('VALID: {flow step directly depends on every peer in same package} => returns []', () => {
      const broker = DependencyStepStub({
        id: 'broker' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/brokers/x/y/x-y-broker.ts' as never,
        }),
      });
      const transformer = DependencyStepStub({
        id: 'transformer' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/transformers/foo/foo-transformer.ts' as never,
        }),
      });
      const flow = DependencyStepStub({
        id: 'flow' as never,
        dependsOn: ['broker' as never, 'transformer' as never],
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/flows/install/install-flow.ts' as never,
        }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({
        steps: [broker, transformer, flow],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {flow step transitively covers peers via chain A -> B -> C} => returns []', () => {
      const transformer = DependencyStepStub({
        id: 'transformer' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/transformers/foo/foo-transformer.ts' as never,
        }),
      });
      const broker = DependencyStepStub({
        id: 'broker' as never,
        dependsOn: ['transformer' as never],
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/brokers/x/y/x-y-broker.ts' as never,
        }),
      });
      const flow = DependencyStepStub({
        id: 'flow' as never,
        dependsOn: ['broker' as never],
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/flows/install/install-flow.ts' as never,
        }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({
        steps: [transformer, broker, flow],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {integration step with peers in different /src/ scope} => returns [] (cross-package peers are not required)', () => {
      const otherPackageBroker = DependencyStepStub({
        id: 'other-broker' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/web/src/brokers/foo/bar/foo-bar-broker.ts' as never,
        }),
      });
      const flow = DependencyStepStub({
        id: 'flow' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/flows/install/install-flow.ts' as never,
        }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({
        steps: [otherPackageBroker, flow],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('integration steps missing peer coverage', () => {
    it('INVALID: {flow step missing one same-package peer} => returns single offender', () => {
      const broker = DependencyStepStub({
        id: 'broker' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/brokers/x/y/x-y-broker.ts' as never,
        }),
      });
      const flow = DependencyStepStub({
        id: 'flow' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/flows/install/install-flow.ts' as never,
        }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({
        steps: [broker, flow],
      });

      expect(result).toStrictEqual([
        "step 'flow' creates an integration file but does not (transitively) depend on step 'broker' in the same package scope",
      ]);
    });

    it('INVALID: {flow step missing two same-package peers} => returns two offenders', () => {
      const broker = DependencyStepStub({
        id: 'broker' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/brokers/x/y/x-y-broker.ts' as never,
        }),
      });
      const transformer = DependencyStepStub({
        id: 'transformer' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/transformers/foo/foo-transformer.ts' as never,
        }),
      });
      const flow = DependencyStepStub({
        id: 'flow' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/flows/install/install-flow.ts' as never,
        }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({
        steps: [broker, transformer, flow],
      });

      expect(result).toStrictEqual([
        "step 'flow' creates an integration file but does not (transitively) depend on step 'broker' in the same package scope",
        "step 'flow' creates an integration file but does not (transitively) depend on step 'transformer' in the same package scope",
      ]);
    });

    it('INVALID: {two integration steps each missing their own peer} => returns offenders for each', () => {
      const broker = DependencyStepStub({
        id: 'broker' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/brokers/x/y/x-y-broker.ts' as never,
        }),
      });
      const flowOne = DependencyStepStub({
        id: 'flow-one' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/flows/install/install-flow.ts' as never,
        }),
      });
      const startup = DependencyStepStub({
        id: 'startup' as never,
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/startup/start-orchestrator.ts' as never,
        }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({
        steps: [broker, flowOne, startup],
      });

      expect(result).toStrictEqual([
        "step 'flow-one' creates an integration file but does not (transitively) depend on step 'broker' in the same package scope",
        "step 'flow-one' creates an integration file but does not (transitively) depend on step 'startup' in the same package scope",
        "step 'startup' creates an integration file but does not (transitively) depend on step 'broker' in the same package scope",
        "step 'startup' creates an integration file but does not (transitively) depend on step 'flow-one' in the same package scope",
      ]);
    });
  });

  describe('path layout edge cases', () => {
    it('VALID: {flat-repo src/ path, flow covers peer} => returns []', () => {
      const broker = DependencyStepStub({
        id: 'broker' as never,
        focusFile: StepFileReferenceStub({
          path: 'src/brokers/x/y/x-y-broker.ts' as never,
        }),
      });
      const flow = DependencyStepStub({
        id: 'flow' as never,
        dependsOn: ['broker' as never],
        focusFile: StepFileReferenceStub({
          path: 'src/flows/install/install-flow.ts' as never,
        }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({
        steps: [broker, flow],
      });

      expect(result).toStrictEqual([]);
    });

    it('INVALID: {flat-repo src/ path, flow missing peer} => peers in src/... share scope and are required', () => {
      const broker = DependencyStepStub({
        id: 'broker' as never,
        focusFile: StepFileReferenceStub({
          path: 'src/brokers/x/y/x-y-broker.ts' as never,
        }),
      });
      const flow = DependencyStepStub({
        id: 'flow' as never,
        focusFile: StepFileReferenceStub({
          path: 'src/flows/install/install-flow.ts' as never,
        }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({
        steps: [broker, flow],
      });

      expect(result).toStrictEqual([
        "step 'flow' creates an integration file but does not (transitively) depend on step 'broker' in the same package scope",
      ]);
    });

    it('EDGE: {path with no /src/ segment} => uses dirname fallback', () => {
      // When the path has no /src/ segment, scope falls back to dirname. The broker's path is
      // "some/folder/broker.ts" (dirname "some/folder/"). The flow step is at the same dirname
      // AND its path doesn't match any folder-type regex anchored by /src/ — so folderType is
      // undefined and the integration check doesn't fire. This test exercises the no-/src/
      // dirname-fallback branch while still being deterministic: the transformer returns [].
      const broker = DependencyStepStub({
        id: 'broker' as never,
        focusFile: StepFileReferenceStub({
          path: 'weird/layout/broker.ts' as never,
        }),
      });
      const flow = DependencyStepStub({
        id: 'flow' as never,
        focusFile: StepFileReferenceStub({
          path: 'weird/layout/flow.ts' as never,
        }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({
        steps: [broker, flow],
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {path is bare filename, no slash} => uses empty-string dirname fallback, returns []', () => {
      // Bare filenames (no slash, no /src/) fall into the "lastSlash === -1" branch and get the
      // empty-string scope key. Neither path matches a folder type so nothing is an integration
      // step. This exercises the no-slash branch of the dirname fallback.
      const a = DependencyStepStub({
        id: 'a' as never,
        focusFile: StepFileReferenceStub({ path: 'orphan.ts' as never }),
      });
      const b = DependencyStepStub({
        id: 'b' as never,
        focusFile: StepFileReferenceStub({ path: 'other.ts' as never }),
      });

      const result = questIntegrationStepsMissingPackageDepsTransformer({ steps: [a, b] });

      expect(result).toStrictEqual([]);
    });
  });
});
