import { QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

import { questContractSourceResolutionTransformer } from './quest-contract-source-resolution-transformer';

describe('questContractSourceResolutionTransformer', () => {
  describe("status: 'new'", () => {
    it('VALID: {new contract, source absent on disk} => returns []', () => {
      const contract = QuestContractEntryStub({
        status: 'new',
        source: 'packages/shared/src/contracts/new-thing/new-thing-contract.ts' as never,
      });

      const result = questContractSourceResolutionTransformer({
        contracts: [contract],
        resolvedSources: new Set(),
      });

      expect(result).toStrictEqual([]);
    });

    it("INVALID: {new contract, source resolves on disk} => returns 'already resolves' error", () => {
      const contract = QuestContractEntryStub({
        status: 'new',
        name: 'AlreadyThere' as never,
        source: 'packages/shared/src/contracts/already-there/already-there-contract.ts' as never,
      });

      const result = questContractSourceResolutionTransformer({
        contracts: [contract],
        resolvedSources: new Set([
          'packages/shared/src/contracts/already-there/already-there-contract.ts',
        ]),
      });

      expect(result).toStrictEqual([
        "Contract 'AlreadyThere' has status 'new' but source 'packages/shared/src/contracts/already-there/already-there-contract.ts' already resolves on disk. Set status to 'existing' or 'modified', change the source path, or drop the entry.",
      ]);
    });
  });

  describe("status: 'existing'", () => {
    it('VALID: {existing contract, source resolves on disk} => returns []', () => {
      const contract = QuestContractEntryStub({
        status: 'existing',
        source: 'packages/shared/src/contracts/here/here-contract.ts' as never,
      });

      const result = questContractSourceResolutionTransformer({
        contracts: [contract],
        resolvedSources: new Set(['packages/shared/src/contracts/here/here-contract.ts']),
      });

      expect(result).toStrictEqual([]);
    });

    it("INVALID: {existing contract, source absent on disk} => returns 'does not resolve' error", () => {
      const contract = QuestContractEntryStub({
        status: 'existing',
        name: 'Missing' as never,
        source: 'packages/shared/src/contracts/missing/missing-contract.ts' as never,
      });

      const result = questContractSourceResolutionTransformer({
        contracts: [contract],
        resolvedSources: new Set(),
      });

      expect(result).toStrictEqual([
        "Contract 'Missing' has status 'existing' but source 'packages/shared/src/contracts/missing/missing-contract.ts' does not resolve on disk. Set status to 'new', or correct the source path.",
      ]);
    });
  });

  describe("status: 'modified'", () => {
    it('VALID: {modified contract, source resolves on disk} => returns []', () => {
      const contract = QuestContractEntryStub({
        status: 'modified',
        source: 'packages/shared/src/contracts/here/here-contract.ts' as never,
      });

      const result = questContractSourceResolutionTransformer({
        contracts: [contract],
        resolvedSources: new Set(['packages/shared/src/contracts/here/here-contract.ts']),
      });

      expect(result).toStrictEqual([]);
    });

    it("INVALID: {modified contract, source absent on disk} => returns 'does not resolve' error", () => {
      const contract = QuestContractEntryStub({
        status: 'modified',
        name: 'GhostMod' as never,
        source: 'packages/shared/src/contracts/ghost-mod/ghost-mod-contract.ts' as never,
      });

      const result = questContractSourceResolutionTransformer({
        contracts: [contract],
        resolvedSources: new Set(),
      });

      expect(result).toStrictEqual([
        "Contract 'GhostMod' has status 'modified' but source 'packages/shared/src/contracts/ghost-mod/ghost-mod-contract.ts' does not resolve on disk. Set status to 'new', or correct the source path.",
      ]);
    });
  });

  describe('mixed batch', () => {
    it('VALID: {one new + one existing, both consistent with disk} => returns []', () => {
      const a = QuestContractEntryStub({
        status: 'new',
        name: 'Fresh' as never,
        source: 'packages/shared/src/contracts/fresh/fresh-contract.ts' as never,
      });
      const b = QuestContractEntryStub({
        status: 'existing',
        name: 'Settled' as never,
        source: 'packages/shared/src/contracts/settled/settled-contract.ts' as never,
      });

      const result = questContractSourceResolutionTransformer({
        contracts: [a, b],
        resolvedSources: new Set(['packages/shared/src/contracts/settled/settled-contract.ts']),
      });

      expect(result).toStrictEqual([]);
    });

    it('INVALID: {two contradictions} => returns both errors', () => {
      const a = QuestContractEntryStub({
        status: 'new',
        name: 'A' as never,
        source: 'a.ts' as never,
      });
      const b = QuestContractEntryStub({
        status: 'existing',
        name: 'B' as never,
        source: 'b.ts' as never,
      });

      const result = questContractSourceResolutionTransformer({
        contracts: [a, b],
        resolvedSources: new Set(['a.ts']),
      });

      expect(result).toStrictEqual([
        "Contract 'A' has status 'new' but source 'a.ts' already resolves on disk. Set status to 'existing' or 'modified', change the source path, or drop the entry.",
        "Contract 'B' has status 'existing' but source 'b.ts' does not resolve on disk. Set status to 'new', or correct the source path.",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {contracts: undefined} => returns []', () => {
      const result = questContractSourceResolutionTransformer({
        resolvedSources: new Set(),
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {contracts: []} => returns []', () => {
      const result = questContractSourceResolutionTransformer({
        contracts: [],
        resolvedSources: new Set(),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
