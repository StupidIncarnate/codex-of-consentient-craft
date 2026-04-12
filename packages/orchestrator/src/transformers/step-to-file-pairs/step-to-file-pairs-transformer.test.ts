import { DependencyStepStub, StepFocusActionStub } from '@dungeonmaster/shared/contracts';

import { stepToFilePairsTransformer } from './step-to-file-pairs-transformer';

describe('stepToFilePairsTransformer', () => {
  describe('pairing implementation with test files', () => {
    it('VALID: {step with impl focusFile and test accompanyingFile} => returns paired tuple', () => {
      const steps = [
        DependencyStepStub({
          focusFile: { path: 'src/brokers/user/fetch/user-fetch-broker.ts' },
          accompanyingFiles: [{ path: 'src/brokers/user/fetch/user-fetch-broker.test.ts' }],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([
        [
          'src/brokers/user/fetch/user-fetch-broker.ts',
          'src/brokers/user/fetch/user-fetch-broker.test.ts',
        ],
      ]);
    });

    it('VALID: {step with impl only, no test} => returns solo tuple', () => {
      const steps = [
        DependencyStepStub({
          focusFile: { path: 'src/statics/config/config-statics.ts' },
          accompanyingFiles: [],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([['src/statics/config/config-statics.ts']]);
    });
  });

  describe('skipping companion files', () => {
    it('VALID: {step with test, proxy, and stub files} => skips standalone companions', () => {
      const steps = [
        DependencyStepStub({
          focusFile: { path: 'src/brokers/user/fetch/user-fetch-broker.ts' },
          accompanyingFiles: [
            { path: 'src/brokers/user/fetch/user-fetch-broker.test.ts' },
            { path: 'src/brokers/user/fetch/user-fetch-broker.proxy.ts' },
          ],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([
        [
          'src/brokers/user/fetch/user-fetch-broker.ts',
          'src/brokers/user/fetch/user-fetch-broker.test.ts',
        ],
      ]);
    });

    it('VALID: {step with only stub focusFile} => returns empty array', () => {
      const steps = [
        DependencyStepStub({
          focusFile: { path: 'src/contracts/user/user.stub.ts' },
          accompanyingFiles: [],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('multiple steps', () => {
    it('VALID: {multiple steps with files} => aggregates all files and pairs them', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: { path: 'src/brokers/user/fetch/user-fetch-broker.ts' },
          accompanyingFiles: [{ path: 'src/brokers/user/fetch/user-fetch-broker.test.ts' }],
        }),
        DependencyStepStub({
          id: 'f5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: { path: 'src/statics/config/config-statics.ts' },
          accompanyingFiles: [
            { path: 'src/guards/is-valid/is-valid-guard.ts' },
            { path: 'src/guards/is-valid/is-valid-guard.test.ts' },
          ],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([
        [
          'src/brokers/user/fetch/user-fetch-broker.ts',
          'src/brokers/user/fetch/user-fetch-broker.test.ts',
        ],
        ['src/statics/config/config-statics.ts'],
        ['src/guards/is-valid/is-valid-guard.ts', 'src/guards/is-valid/is-valid-guard.test.ts'],
      ]);
    });
  });

  describe('deduplication across steps', () => {
    it('VALID: {same file in multiple steps} => deduplicates before pairing', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: { path: 'src/brokers/user/fetch/user-fetch-broker.ts' },
          accompanyingFiles: [],
        }),
        DependencyStepStub({
          id: 'f5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: { path: 'src/brokers/user/fetch/user-fetch-broker.ts' },
          accompanyingFiles: [{ path: 'src/brokers/user/fetch/user-fetch-broker.test.ts' }],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([
        [
          'src/brokers/user/fetch/user-fetch-broker.ts',
          'src/brokers/user/fetch/user-fetch-broker.test.ts',
        ],
      ]);
    });
  });

  describe('standalone companion files', () => {
    it('EDGE: {step with only a .test.ts focusFile and no matching impl} => skipped, returns empty array', () => {
      const steps = [
        DependencyStepStub({
          focusFile: {
            path: 'src/brokers/user/fetch/user-fetch-broker.test.ts',
          },
          accompanyingFiles: [],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('focusAction-only steps', () => {
    it('VALID: {focusAction-only step with accompanyingFiles} => includes accompanying files with no focus pair', () => {
      const steps = [
        DependencyStepStub({
          focusFile: undefined,
          focusAction: StepFocusActionStub({
            kind: 'verification',
            description: 'Run ward and assert zero failures',
          }),
          accompanyingFiles: [{ path: 'src/existing.ts' }],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([['src/existing.ts']]);
    });

    it('VALID: {mixed file-anchored step and focusAction step each with accompanying} => produces union correctly', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          focusFile: { path: 'src/brokers/user/fetch/user-fetch-broker.ts' },
          accompanyingFiles: [{ path: 'src/brokers/user/fetch/user-fetch-broker.test.ts' }],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          focusFile: undefined,
          focusAction: StepFocusActionStub({
            kind: 'command',
            description: 'Run npm run build',
          }),
          accompanyingFiles: [{ path: 'src/guards/is-valid/is-valid-guard.ts' }],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([
        [
          'src/brokers/user/fetch/user-fetch-broker.ts',
          'src/brokers/user/fetch/user-fetch-broker.test.ts',
        ],
        ['src/guards/is-valid/is-valid-guard.ts'],
      ]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {no steps} => returns empty array', () => {
      const result = stepToFilePairsTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps with no accompanying files} => returns focusFile solo tuple', () => {
      const steps = [
        DependencyStepStub({
          focusFile: { path: 'src/brokers/user/fetch/user-fetch-broker.ts' },
          accompanyingFiles: [],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([['src/brokers/user/fetch/user-fetch-broker.ts']]);
    });
  });
});
