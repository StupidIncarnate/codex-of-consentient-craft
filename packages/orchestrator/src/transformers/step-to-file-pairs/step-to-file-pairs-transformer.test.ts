import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { stepToFilePairsTransformer } from './step-to-file-pairs-transformer';

describe('stepToFilePairsTransformer', () => {
  describe('pairing implementation with test files', () => {
    it('VALID: {step with impl and test file} => returns paired tuple', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: [
            'src/brokers/user/fetch/user-fetch-broker.ts',
            'src/brokers/user/fetch/user-fetch-broker.test.ts',
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

    it('VALID: {step with impl only, no test} => returns solo tuple', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: ['src/statics/config/config-statics.ts'],
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
          filesToCreate: [
            'src/brokers/user/fetch/user-fetch-broker.ts',
            'src/brokers/user/fetch/user-fetch-broker.test.ts',
            'src/brokers/user/fetch/user-fetch-broker.proxy.ts',
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

    it('VALID: {step with only stub file} => returns empty array', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: ['src/contracts/user/user.stub.ts'],
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
          filesToCreate: [
            'src/brokers/user/fetch/user-fetch-broker.ts',
            'src/brokers/user/fetch/user-fetch-broker.test.ts',
          ],
        }),
        DependencyStepStub({
          id: 'f5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          filesToCreate: [
            'src/statics/config/config-statics.ts',
            'src/guards/is-valid/is-valid-guard.ts',
            'src/guards/is-valid/is-valid-guard.test.ts',
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
          filesToCreate: ['src/brokers/user/fetch/user-fetch-broker.ts'],
        }),
        DependencyStepStub({
          id: 'f5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          filesToCreate: [
            'src/brokers/user/fetch/user-fetch-broker.ts',
            'src/brokers/user/fetch/user-fetch-broker.test.ts',
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
  });

  describe('standalone companion files', () => {
    it('EDGE: {step with only a .test.ts file and no matching impl} => skipped, returns empty array', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: ['src/brokers/user/fetch/user-fetch-broker.test.ts'],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('filesToModify exclusion', () => {
    it('EDGE: {step with filesToModify only} => filesToModify files are not included, returns empty array', () => {
      const steps = [
        DependencyStepStub({
          filesToCreate: [],
          filesToModify: ['src/brokers/index.ts', 'src/brokers/user/user-broker.ts'],
        }),
      ];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {no steps} => returns empty array', () => {
      const result = stepToFilePairsTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps with no filesToCreate} => returns empty array', () => {
      const steps = [DependencyStepStub({ filesToCreate: [] })];

      const result = stepToFilePairsTransformer({ steps });

      expect(result).toStrictEqual([]);
    });
  });
});
