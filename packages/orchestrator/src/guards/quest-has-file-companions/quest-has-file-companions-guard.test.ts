import { DependencyStepStub, ObservableIdStub } from '@dungeonmaster/shared/contracts';

import { questHasFileCompanionsGuard } from './quest-has-file-companions-guard';

describe('questHasFileCompanionsGuard', () => {
  describe('valid companions', () => {
    it('VALID: {broker with test and proxy} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          filesToCreate: [
            'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.test.ts',
            'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.proxy.ts',
          ],
          filesToModify: [],
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
          filesToCreate: [
            'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            'packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts',
          ],
          filesToModify: [],
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
          filesToCreate: [
            'packages/orchestrator/src/contracts/user/user-contract.ts',
            'packages/orchestrator/src/contracts/user/user-contract.test.ts',
            'packages/orchestrator/src/contracts/user/user.stub.ts',
          ],
          filesToModify: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {companions spread across steps} => returns true', () => {
      const obsId1 = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const obsId2 = ObservableIdStub({ value: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' });
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          observablesSatisfied: [obsId1],
          filesToCreate: ['packages/orchestrator/src/guards/is-valid/is-valid-guard.ts'],
          filesToModify: [],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          observablesSatisfied: [obsId2],
          filesToCreate: ['packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts'],
          filesToModify: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {empty steps} => returns true', () => {
      const result = questHasFileCompanionsGuard({ steps: [] });

      expect(result).toBe(true);
    });

    it('VALID: {steps with no filesToCreate} => returns true', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const steps = [
        DependencyStepStub({
          observablesSatisfied: [obsId],
          filesToCreate: [],
          filesToModify: ['packages/orchestrator/src/startup/start-mcp-server.ts'],
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
          filesToCreate: [
            'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.proxy.ts',
          ],
          filesToModify: [],
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
          filesToCreate: [
            'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.test.ts',
          ],
          filesToModify: [],
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
          filesToCreate: [
            'packages/orchestrator/src/contracts/user/user-contract.ts',
            'packages/orchestrator/src/contracts/user/user-contract.test.ts',
          ],
          filesToModify: [],
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
          filesToCreate: ['packages/orchestrator/src/guards/is-valid/is-valid-guard.ts'],
          filesToModify: [],
        }),
      ];

      const result = questHasFileCompanionsGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questHasFileCompanionsGuard({});

      expect(result).toBe(false);
    });
  });
});
