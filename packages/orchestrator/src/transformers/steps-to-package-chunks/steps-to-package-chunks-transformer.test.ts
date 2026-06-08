import { DependencyStepStub, StepFileReferenceStub } from '@dungeonmaster/shared/contracts';

import { stepsToPackageChunksTransformer } from './steps-to-package-chunks-transformer';

describe('stepsToPackageChunksTransformer', () => {
  describe('per-package grouping', () => {
    it('VALID: {steps across two packages} => one chunk per package', () => {
      const webStep = DependencyStepStub({
        focusFile: StepFileReferenceStub({ path: 'packages/web/src/brokers/a/a-broker.ts' }),
      });
      const orchStep = DependencyStepStub({
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/guards/b/b-guard.ts',
        }),
      });

      const result = stepsToPackageChunksTransformer({ steps: [webStep, orchStep] });

      expect(result).toStrictEqual([[webStep], [orchStep]]);
    });

    it('VALID: {two steps in same package} => collapse into one chunk', () => {
      const stepA = DependencyStepStub({
        focusFile: StepFileReferenceStub({ path: 'packages/web/src/brokers/a/a-broker.ts' }),
      });
      const stepB = DependencyStepStub({
        focusFile: StepFileReferenceStub({ path: 'packages/web/src/guards/b/b-guard.ts' }),
      });

      const result = stepsToPackageChunksTransformer({ steps: [stepA, stepB] });

      expect(result).toStrictEqual([[stepA, stepB]]);
    });
  });

  describe('flow/startup exclusion', () => {
    it('VALID: {flows + startup + broker steps} => excludes flows and startup, keeps broker', () => {
      const flowStep = DependencyStepStub({
        focusFile: StepFileReferenceStub({ path: 'packages/web/src/flows/x/x-flow.ts' }),
      });
      const startupStep = DependencyStepStub({
        focusFile: StepFileReferenceStub({ path: 'packages/web/src/startup/x/start-x.ts' }),
      });
      const brokerStep = DependencyStepStub({
        focusFile: StepFileReferenceStub({ path: 'packages/web/src/brokers/y/y-broker.ts' }),
      });

      const result = stepsToPackageChunksTransformer({
        steps: [flowStep, startupStep, brokerStep],
      });

      expect(result).toStrictEqual([[brokerStep]]);
    });

    it('EMPTY: {only flows + startup steps} => returns no chunks', () => {
      const flowStep = DependencyStepStub({
        focusFile: StepFileReferenceStub({ path: 'packages/web/src/flows/x/x-flow.ts' }),
      });
      const startupStep = DependencyStepStub({
        focusFile: StepFileReferenceStub({
          path: 'packages/orchestrator/src/startup/x/start-x.ts',
        }),
      });

      const result = stepsToPackageChunksTransformer({ steps: [flowStep, startupStep] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('solo chunks', () => {
    it('VALID: {step with path outside packages/} => emits solo chunk', () => {
      const rootStep = DependencyStepStub({
        focusFile: StepFileReferenceStub({ path: 'src/brokers/x/x-broker.ts' }),
      });

      const result = stepsToPackageChunksTransformer({ steps: [rootStep] });

      expect(result).toStrictEqual([[rootStep]]);
    });
  });

  describe('cap split', () => {
    it('EDGE: {21 steps in one package} => splits into a chunk of 20 and a chunk of 1', () => {
      const steps = Array.from({ length: 21 }, (_unused, index) =>
        DependencyStepStub({
          focusFile: StepFileReferenceStub({
            path: `packages/web/src/brokers/b${String(index)}/b${String(index)}-broker.ts`,
          }),
        }),
      );

      const result = stepsToPackageChunksTransformer({ steps });

      expect(result.flat()).toStrictEqual(steps);
      expect(result.map((chunk) => chunk.length)).toStrictEqual([20, 1]);
    });
  });
});
