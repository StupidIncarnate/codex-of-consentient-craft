import { DependencyStepStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { mergeCyclicStepChunksTransformer } from './merge-cyclic-step-chunks-transformer';

describe('mergeCyclicStepChunksTransformer', () => {
  describe('acyclic chunk graphs', () => {
    it('EMPTY: {no chunks} => returns []', () => {
      const result = mergeCyclicStepChunksTransformer({ chunks: [] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {chunk B depends on chunk A only} => returns chunks unchanged in order', () => {
      const stepA = DependencyStepStub({ id: StepIdStub({ value: 'step-a' }), dependsOn: [] });
      const stepB = DependencyStepStub({
        id: StepIdStub({ value: 'step-b' }),
        dependsOn: [StepIdStub({ value: 'step-a' })],
      });

      const result = mergeCyclicStepChunksTransformer({ chunks: [[stepA], [stepB]] });

      expect(result).toStrictEqual([[stepA], [stepB]]);
    });
  });

  describe('cyclic chunk graphs', () => {
    it('EDGE: {two chunks mutually dependent} => merges into one chunk preserving member order', () => {
      const stepP = DependencyStepStub({
        id: StepIdStub({ value: 'step-p' }),
        dependsOn: [StepIdStub({ value: 'step-q' })],
      });
      const stepQ = DependencyStepStub({
        id: StepIdStub({ value: 'step-q' }),
        dependsOn: [StepIdStub({ value: 'step-p' })],
      });

      const result = mergeCyclicStepChunksTransformer({ chunks: [[stepP], [stepQ]] });

      expect(result).toStrictEqual([[stepP, stepQ]]);
    });

    it('EDGE: {three chunks in a cycle} => merges all three into one chunk in index order', () => {
      const step0 = DependencyStepStub({
        id: StepIdStub({ value: 'step-0' }),
        dependsOn: [StepIdStub({ value: 'step-2' })],
      });
      const step1 = DependencyStepStub({
        id: StepIdStub({ value: 'step-1' }),
        dependsOn: [StepIdStub({ value: 'step-0' })],
      });
      const step2 = DependencyStepStub({
        id: StepIdStub({ value: 'step-2' }),
        dependsOn: [StepIdStub({ value: 'step-1' })],
      });

      const result = mergeCyclicStepChunksTransformer({ chunks: [[step0], [step1], [step2]] });

      expect(result).toStrictEqual([[step0, step1, step2]]);
    });

    it('VALID: {one cyclic pair + one independent chunk} => merges the pair, keeps the other, preserves order', () => {
      const stepX = DependencyStepStub({
        id: StepIdStub({ value: 'step-x' }),
        dependsOn: [StepIdStub({ value: 'step-y' })],
      });
      const stepY = DependencyStepStub({
        id: StepIdStub({ value: 'step-y' }),
        dependsOn: [StepIdStub({ value: 'step-x' })],
      });
      const stepZ = DependencyStepStub({
        id: StepIdStub({ value: 'step-z' }),
        dependsOn: [StepIdStub({ value: 'step-x' })],
      });

      const result = mergeCyclicStepChunksTransformer({ chunks: [[stepX], [stepY], [stepZ]] });

      expect(result).toStrictEqual([[stepX, stepY], [stepZ]]);
    });

    it('VALID: {multi-step chunks bracket a solo chunk in a cycle} => merges concatenating each chunk in order', () => {
      const headStepOne = DependencyStepStub({
        id: StepIdStub({ value: 'head-1' }),
        dependsOn: [],
      });
      const headStepTwo = DependencyStepStub({
        id: StepIdStub({ value: 'head-2' }),
        dependsOn: [StepIdStub({ value: 'solo-1' })],
      });
      const soloStep = DependencyStepStub({
        id: StepIdStub({ value: 'solo-1' }),
        dependsOn: [StepIdStub({ value: 'head-1' })],
      });

      const result = mergeCyclicStepChunksTransformer({
        chunks: [[headStepOne, headStepTwo], [soloStep]],
      });

      expect(result).toStrictEqual([[headStepOne, headStepTwo, soloStep]]);
    });
  });
});
