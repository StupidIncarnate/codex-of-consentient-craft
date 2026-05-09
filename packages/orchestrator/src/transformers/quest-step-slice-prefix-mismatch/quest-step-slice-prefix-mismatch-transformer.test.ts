import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { questStepSlicePrefixMismatchTransformer } from './quest-step-slice-prefix-mismatch-transformer';

describe('questStepSlicePrefixMismatchTransformer', () => {
  describe('all prefixes match', () => {
    it('VALID: {step id starts with slice-} => returns []', () => {
      const step = DependencyStepStub({
        id: 'backend-create-login-api' as never,
        slice: 'backend' as never,
      });

      const result = questStepSlicePrefixMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {multiple steps across slices} => returns []', () => {
      const backendStep = DependencyStepStub({
        id: 'backend-create-login-api' as never,
        slice: 'backend' as never,
      });
      const frontendStep = DependencyStepStub({
        id: 'frontend-render-login-form' as never,
        slice: 'frontend' as never,
      });

      const result = questStepSlicePrefixMismatchTransformer({
        steps: [backendStep, frontendStep],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('prefix mismatch', () => {
    it('INVALID: {step id missing slice prefix} => returns description', () => {
      const step = DependencyStepStub({
        id: 'create-login-api' as never,
        slice: 'backend' as never,
      });

      const result = questStepSlicePrefixMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([
        "step 'create-login-api' has slice 'backend' but id does not start with 'backend-'",
      ]);
    });

    it('INVALID: {step id has wrong slice prefix} => returns description', () => {
      const step = DependencyStepStub({
        id: 'frontend-render-login-form' as never,
        slice: 'backend' as never,
      });

      const result = questStepSlicePrefixMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([
        "step 'frontend-render-login-form' has slice 'backend' but id does not start with 'backend-'",
      ]);
    });

    it('INVALID: {step id equals slice with no dash suffix} => returns description', () => {
      const step = DependencyStepStub({
        id: 'backend' as never,
        slice: 'backend' as never,
      });

      const result = questStepSlicePrefixMismatchTransformer({ steps: [step] });

      expect(result).toStrictEqual([
        "step 'backend' has slice 'backend' but id does not start with 'backend-'",
      ]);
    });

    it('INVALID: {two steps mismatch} => returns one description per offender', () => {
      const a = DependencyStepStub({
        id: 'create-login-api' as never,
        slice: 'backend' as never,
      });
      const b = DependencyStepStub({
        id: 'render-login-form' as never,
        slice: 'frontend' as never,
      });

      const result = questStepSlicePrefixMismatchTransformer({ steps: [a, b] });

      expect(result).toStrictEqual([
        "step 'create-login-api' has slice 'backend' but id does not start with 'backend-'",
        "step 'render-login-form' has slice 'frontend' but id does not start with 'frontend-'",
      ]);
    });

    it('INVALID: {one match and one mismatch} => returns only the mismatch', () => {
      const good = DependencyStepStub({
        id: 'backend-create-login-api' as never,
        slice: 'backend' as never,
      });
      const bad = DependencyStepStub({
        id: 'render-login-form' as never,
        slice: 'frontend' as never,
      });

      const result = questStepSlicePrefixMismatchTransformer({ steps: [good, bad] });

      expect(result).toStrictEqual([
        "step 'render-login-form' has slice 'frontend' but id does not start with 'frontend-'",
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {steps: undefined} => returns []', () => {
      const result = questStepSlicePrefixMismatchTransformer({});

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps: []} => returns []', () => {
      const result = questStepSlicePrefixMismatchTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
