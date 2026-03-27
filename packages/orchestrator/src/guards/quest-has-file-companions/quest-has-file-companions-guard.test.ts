import {
  DependencyStepStub,
  ObservableIdStub,
  StepFileReferenceStub,
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
            path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            action: 'create',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.test.ts',
              action: 'create',
            }),
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.proxy.ts',
              action: 'create',
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
            action: 'create',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts',
              action: 'create',
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
            action: 'create',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/contracts/user/user-contract.test.ts',
              action: 'create',
            }),
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/contracts/user/user.stub.ts',
              action: 'create',
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

    it('VALID: {focusFile action is modify} => skips companion check, returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            action: 'modify',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {statics file with testType none} => no test required, returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/shared/src/statics/config/config-statics.ts',
            action: 'create',
          }),
          accompanyingFiles: [],
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
            action: 'create',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts',
              action: 'create',
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
            action: 'create',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/web/src/widgets/quest-chat/quest-chat-widget.test.tsx',
              action: 'create',
            }),
            StepFileReferenceStub({
              path: 'packages/web/src/widgets/quest-chat/quest-chat-widget.proxy.tsx',
              action: 'create',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });
  });

  describe('missing companions', () => {
    it('INVALID_COMPANION: {broker without test} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            action: 'create',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.proxy.ts',
              action: 'create',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID_COMPANION: {broker without proxy} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            action: 'create',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.test.ts',
              action: 'create',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID_COMPANION: {contract without stub} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/contracts/user/user-contract.ts',
            action: 'create',
          }),
          accompanyingFiles: [
            StepFileReferenceStub({
              path: 'packages/orchestrator/src/contracts/user/user-contract.test.ts',
              action: 'create',
            }),
          ],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID_COMPANION: {guard without test} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            action: 'create',
          }),
          accompanyingFiles: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID_COMPANION: {flow without integration test} => returns false', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          focusFile: StepFileReferenceStub({
            path: 'packages/mcp/src/flows/mcp-server/mcp-server-flow.ts',
            action: 'create',
          }),
          accompanyingFiles: [],
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
            action: 'create',
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
