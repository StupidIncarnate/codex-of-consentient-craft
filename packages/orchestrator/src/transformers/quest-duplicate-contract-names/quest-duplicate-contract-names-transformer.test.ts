import { QuestContractEntryStub } from '@dungeonmaster/shared/contracts/quest-contract-entry/quest-contract-entry.stub';

import { questDuplicateContractNamesTransformer } from './quest-duplicate-contract-names-transformer';

describe('questDuplicateContractNamesTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique names} => returns []', () => {
      const contracts = [
        QuestContractEntryStub({ id: 'a', name: 'First' }),
        QuestContractEntryStub({ id: 'b', name: 'Second' }),
      ];

      const result = questDuplicateContractNamesTransformer({ contracts });

      expect(result).toStrictEqual([]);
    });
  });

  describe('duplicates present', () => {
    it('INVALID: {two contracts share name} => returns reconciliation hint citing first entry source', () => {
      const contracts = [
        QuestContractEntryStub({
          id: 'a',
          name: 'LoginCredentials',
          source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
        }),
        QuestContractEntryStub({
          id: 'b',
          name: 'LoginCredentials',
          source: 'packages/web/src/contracts/login-credentials/login-credentials-contract.ts',
        }),
      ];

      const result = questDuplicateContractNamesTransformer({ contracts });

      expect(result).toStrictEqual([
        'Contract `LoginCredentials` already declared with source `packages/shared/src/contracts/login-credentials/login-credentials-contract.ts`. Either remove your write, change source to a shared path, or rename your contract.',
      ]);
    });

    it('INVALID: {three contracts share name} => reports the duplicate name only once with the first entry source', () => {
      const contracts = [
        QuestContractEntryStub({
          id: 'a',
          name: 'MantineNotificationId',
          source:
            'packages/web/src/contracts/mantine-notification-id/mantine-notification-id-contract.ts',
        }),
        QuestContractEntryStub({
          id: 'b',
          name: 'MantineNotificationId',
          source:
            'packages/server/src/contracts/mantine-notification-id/mantine-notification-id-contract.ts',
        }),
        QuestContractEntryStub({
          id: 'c',
          name: 'MantineNotificationId',
          source:
            'packages/orchestrator/src/contracts/mantine-notification-id/mantine-notification-id-contract.ts',
        }),
      ];

      const result = questDuplicateContractNamesTransformer({ contracts });

      expect(result).toStrictEqual([
        'Contract `MantineNotificationId` already declared with source `packages/web/src/contracts/mantine-notification-id/mantine-notification-id-contract.ts`. Either remove your write, change source to a shared path, or rename your contract.',
      ]);
    });

    it('INVALID: {two distinct duplicate names} => reports both with their respective first-entry sources', () => {
      const contracts = [
        QuestContractEntryStub({
          id: 'a',
          name: 'First',
          source: 'packages/shared/src/contracts/first/first-contract.ts',
        }),
        QuestContractEntryStub({
          id: 'b',
          name: 'Second',
          source: 'packages/web/src/contracts/second/second-contract.ts',
        }),
        QuestContractEntryStub({
          id: 'c',
          name: 'First',
          source: 'packages/server/src/contracts/first/first-contract.ts',
        }),
        QuestContractEntryStub({
          id: 'd',
          name: 'Second',
          source: 'packages/orchestrator/src/contracts/second/second-contract.ts',
        }),
      ];

      const result = questDuplicateContractNamesTransformer({ contracts });

      expect(result).toStrictEqual([
        'Contract `First` already declared with source `packages/shared/src/contracts/first/first-contract.ts`. Either remove your write, change source to a shared path, or rename your contract.',
        'Contract `Second` already declared with source `packages/web/src/contracts/second/second-contract.ts`. Either remove your write, change source to a shared path, or rename your contract.',
      ]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {duplicate name with distinct nested source paths} => embeds the existing entry source verbatim in the error message', () => {
      const existingSource =
        'packages/shared/src/contracts/mantine-notification-id/mantine-notification-id-contract.ts';
      const conflictingSource =
        'packages/web/src/contracts/mantine-notification-id/mantine-notification-id-contract.ts';
      const contracts = [
        QuestContractEntryStub({
          id: 'a',
          name: 'MantineNotificationId',
          source: existingSource,
        }),
        QuestContractEntryStub({
          id: 'b',
          name: 'MantineNotificationId',
          source: conflictingSource,
        }),
      ];

      const result = questDuplicateContractNamesTransformer({ contracts });

      expect(result).toStrictEqual([
        `Contract \`MantineNotificationId\` already declared with source \`${existingSource}\`. Either remove your write, change source to a shared path, or rename your contract.`,
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {contracts: undefined} => returns []', () => {
      const result = questDuplicateContractNamesTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
