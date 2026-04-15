import {
  DependencyStepStub,
  ObservableIdStub,
  StepFileReferenceStub,
  StepFocusActionStub,
} from '@dungeonmaster/shared/contracts';

import { questHasFileCompanionsGuard } from './quest-has-file-companions-guard';

describe('questHasFileCompanionsGuard', () => {
  describe('valid companions', () => {
    it('VALID: {broker with test and proxy in accompanyingFiles} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.test.ts',
            }),
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.proxy.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {guard with test, no proxy needed} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {contract with test and stub} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/contracts/user/user-contract.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/contracts/user/user-contract.test.ts',
            }),
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/contracts/user/user.stub.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {empty steps} => returns true', () => {
      const result = questHasFileCompanionsGuard({ steps: [] });

      expect(result).toBe(true);
    });

    it('VALID: {statics file with test} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/shared/src/statics/config/config-statics.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/shared/src/statics/config/config-statics.test.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {flow with integration test} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/mcp/src/flows/mcp-server/mcp-server-flow.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {widget tsx with .test.tsx and .proxy.tsx} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx',
            }),
            StepFileReferenceStub({
              path: 'packages/web/src/widgets/quest-chat/quest-chat-widget.proxy.tsx',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {modify step with required companions listed} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.test.ts',
            }),
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.proxy.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });
  });

  describe('missing companions', () => {
    it('INVALID: {broker without test} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.proxy.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {broker without proxy} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.test.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {contract without stub} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/contracts/user/user-contract.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/contracts/user/user-contract.test.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {guard without test} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {flow without integration test} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/mcp/src/flows/mcp-server/mcp-server-flow.ts',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {statics without test} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/shared/src/statics/config/config-statics.ts',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {modify broker without companions} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('extra companions', () => {
    it('INVALID: {guard with test and unexpected proxy} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts',
            }),
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.proxy.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {statics with test and unexpected proxy} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/shared/src/statics/config/config-statics.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/shared/src/statics/config/config-statics.test.ts',
            }),
            StepFileReferenceStub({
              path: 'packages/shared/src/statics/config/config-statics.proxy.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID: {flow with unit test instead of integration test} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/mcp/src/flows/mcp-server/mcp-server-flow.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/mcp/src/flows/mcp-server/mcp-server-flow.test.ts',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {focusFile path has no recognizable folder type} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/unknown-folder/some-file.ts',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {mixed steps with focusAction-only step} => focusAction step filtered, file-anchored step drives outcome', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          id: 'file-anchored-broker',
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.test.ts',
            }),
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.proxy.ts',
            }),
          ],
        }),
        DependencyStepStub({
          id: 'focus-action-verification',
          observablesSatisfied: [obsId],
          focusFile: undefined,
          focusAction: StepFocusActionStub({
            kind: 'verification',
            description: 'Run ward and assert zero failures',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questHasFileCompanionsGuard({});

      expect(result).toBe(false);
    });
  });
});
