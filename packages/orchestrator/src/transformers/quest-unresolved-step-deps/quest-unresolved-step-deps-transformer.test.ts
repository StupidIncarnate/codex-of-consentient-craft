import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { questUnresolvedStepDepsTransformer } from './quest-unresolved-step-deps-transformer';

describe('questUnresolvedStepDepsTransformer', () => {
  describe('all deps resolved', () => {
    it('VALID: {step with resolved dep} => returns []', () => {
      const a = DependencyStepStub({ id: 'a' as never });
      const b = DependencyStepStub({
        id: 'b' as never,
        dependsOn: ['a' as never],
      });

      const result = questUnresolvedStepDepsTransformer({ steps: [a, b] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {step with no deps} => returns []', () => {
      const a = DependencyStepStub({ id: 'a' as never });

      const result = questUnresolvedStepDepsTransformer({ steps: [a] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('unresolved deps', () => {
    it('INVALID: {step depends on unknown step} => returns description', () => {
      const a = DependencyStepStub({
        id: 'a' as never,
        dependsOn: ['ghost' as never],
      });

      const result = questUnresolvedStepDepsTransformer({ steps: [a] });

      expect(result).toStrictEqual(["step 'a' depends on unknown step 'ghost'"]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {steps: undefined} => returns []', () => {
      const result = questUnresolvedStepDepsTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
