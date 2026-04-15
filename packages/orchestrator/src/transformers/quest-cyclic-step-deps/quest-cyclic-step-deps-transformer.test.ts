import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { questCyclicStepDepsTransformer } from './quest-cyclic-step-deps-transformer';

describe('questCyclicStepDepsTransformer', () => {
  describe('acyclic graphs', () => {
    it('VALID: {a -> b, no cycle} => returns []', () => {
      const a = DependencyStepStub({ id: 'a' as never });
      const b = DependencyStepStub({
        id: 'b' as never,
        dependsOn: ['a' as never],
      });

      const result = questCyclicStepDepsTransformer({ steps: [a, b] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {step with no deps} => returns []', () => {
      const a = DependencyStepStub({ id: 'a' as never });

      const result = questCyclicStepDepsTransformer({ steps: [a] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('cyclic graphs', () => {
    it('INVALID: {a -> b -> a} => returns cycle description', () => {
      const a = DependencyStepStub({
        id: 'a' as never,
        dependsOn: ['b' as never],
      });
      const b = DependencyStepStub({
        id: 'b' as never,
        dependsOn: ['a' as never],
      });

      const result = questCyclicStepDepsTransformer({ steps: [a, b] });

      expect(result).toStrictEqual(["cycle in step dependsOn: 'a' -> 'b' -> 'a'"]);
    });

    it('INVALID: {a -> a (self-loop)} => returns cycle description', () => {
      const a = DependencyStepStub({
        id: 'a' as never,
        dependsOn: ['a' as never],
      });

      const result = questCyclicStepDepsTransformer({ steps: [a] });

      expect(result).toStrictEqual(["cycle in step dependsOn: 'a' -> 'a'"]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {steps: undefined} => returns []', () => {
      const result = questCyclicStepDepsTransformer({});

      expect(result).toStrictEqual([]);
    });
  });
});
