import { DependencyStepStub, QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

import { questUnresolvedStepContractRefsTransformer } from './quest-unresolved-step-contract-refs-transformer';

describe('questUnresolvedStepContractRefsTransformer', () => {
  describe('all references resolved', () => {
    it('VALID: {step refs match contract names} => returns []', () => {
      const step = DependencyStepStub({
        id: 'a' as never,
        inputContracts: ['LoginCredentials' as never],
        outputContracts: ['AuthToken' as never],
      });
      const contracts = [
        QuestContractEntryStub({ id: 'c1' as never, name: 'LoginCredentials' as never }),
        QuestContractEntryStub({ id: 'c2' as never, name: 'AuthToken' as never }),
      ];

      const result = questUnresolvedStepContractRefsTransformer({
        steps: [step],
        contracts,
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {step inputs/outputs are Void} => returns []', () => {
      const step = DependencyStepStub({
        id: 'a' as never,
        inputContracts: ['Void' as never],
        outputContracts: ['Void' as never],
      });

      const result = questUnresolvedStepContractRefsTransformer({
        steps: [step],
        contracts: [],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {Void mixed with resolved name} => returns []', () => {
      const step = DependencyStepStub({
        id: 'a' as never,
        inputContracts: ['Void' as never, 'LoginCredentials' as never],
        outputContracts: ['Void' as never],
      });
      const contracts = [
        QuestContractEntryStub({ id: 'c1' as never, name: 'LoginCredentials' as never }),
      ];

      const result = questUnresolvedStepContractRefsTransformer({
        steps: [step],
        contracts,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('unresolved references', () => {
    it('INVALID: {step inputContracts references unknown contract} => returns description', () => {
      const step = DependencyStepStub({
        id: 'a' as never,
        inputContracts: ['GhostContract' as never],
        outputContracts: ['Void' as never],
      });

      const result = questUnresolvedStepContractRefsTransformer({
        steps: [step],
        contracts: [],
      });

      expect(result).toStrictEqual([
        "step 'a' inputContracts references unknown contract 'GhostContract'",
      ]);
    });

    it('INVALID: {step outputContracts references unknown contract} => returns description', () => {
      const step = DependencyStepStub({
        id: 'a' as never,
        inputContracts: ['Void' as never],
        outputContracts: ['GhostContract' as never],
      });

      const result = questUnresolvedStepContractRefsTransformer({
        steps: [step],
        contracts: [],
      });

      expect(result).toStrictEqual([
        "step 'a' outputContracts references unknown contract 'GhostContract'",
      ]);
    });

    it('INVALID: {both inputs and outputs unresolved} => returns both descriptions', () => {
      const step = DependencyStepStub({
        id: 'a' as never,
        inputContracts: ['MissingIn' as never],
        outputContracts: ['MissingOut' as never],
      });

      const result = questUnresolvedStepContractRefsTransformer({
        steps: [step],
        contracts: [],
      });

      expect(result).toStrictEqual([
        "step 'a' inputContracts references unknown contract 'MissingIn'",
        "step 'a' outputContracts references unknown contract 'MissingOut'",
      ]);
    });

    it('INVALID: {one resolved, one unresolved input} => returns only the unresolved description', () => {
      const step = DependencyStepStub({
        id: 'a' as never,
        inputContracts: ['LoginCredentials' as never, 'GhostContract' as never],
        outputContracts: ['Void' as never],
      });
      const contracts = [
        QuestContractEntryStub({ id: 'c1' as never, name: 'LoginCredentials' as never }),
      ];

      const result = questUnresolvedStepContractRefsTransformer({
        steps: [step],
        contracts,
      });

      expect(result).toStrictEqual([
        "step 'a' inputContracts references unknown contract 'GhostContract'",
      ]);
    });

    it('INVALID: {multiple steps with unresolved refs} => returns descriptions for each step', () => {
      const stepA = DependencyStepStub({
        id: 'a' as never,
        inputContracts: ['MissingA' as never],
        outputContracts: ['Void' as never],
      });
      const stepB = DependencyStepStub({
        id: 'b' as never,
        inputContracts: ['Void' as never],
        outputContracts: ['MissingB' as never],
      });

      const result = questUnresolvedStepContractRefsTransformer({
        steps: [stepA, stepB],
        contracts: [],
      });

      expect(result).toStrictEqual([
        "step 'a' inputContracts references unknown contract 'MissingA'",
        "step 'b' outputContracts references unknown contract 'MissingB'",
      ]);
    });

    it('INVALID: {contracts undefined and ref non-Void} => returns description', () => {
      const step = DependencyStepStub({
        id: 'a' as never,
        inputContracts: ['SomeContract' as never],
        outputContracts: ['Void' as never],
      });

      const result = questUnresolvedStepContractRefsTransformer({
        steps: [step],
      });

      expect(result).toStrictEqual([
        "step 'a' inputContracts references unknown contract 'SomeContract'",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {steps: undefined} => returns []', () => {
      const result = questUnresolvedStepContractRefsTransformer({});

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps: []} => returns []', () => {
      const result = questUnresolvedStepContractRefsTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
