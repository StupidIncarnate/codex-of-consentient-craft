import { DependencyStepStub, FolderTypeGroupsStub } from '@dungeonmaster/shared/contracts';

import { stepsToBatchChunksTransformer } from './steps-to-batch-chunks-transformer';

describe('stepsToBatchChunksTransformer', () => {
  describe('empty batchGroups', () => {
    it('VALID: {batchGroups: []} => every step stays solo (regression parity)', () => {
      const stepA = DependencyStepStub({
        id: 'step-a',
        focusFile: { path: 'src/contracts/a/a-contract.ts' },
      });
      const stepB = DependencyStepStub({
        id: 'step-b',
        focusFile: { path: 'src/brokers/x/y/x-y-broker.ts' },
      });

      const result = stepsToBatchChunksTransformer({
        steps: [stepA, stepB],
        batchGroups: FolderTypeGroupsStub({ value: [] }),
      });

      expect(result).toStrictEqual([[stepA], [stepB]]);
    });
  });

  describe('grouped folder types', () => {
    it('VALID: two contracts steps with [[contracts]] => one batch of two', () => {
      const stepA = DependencyStepStub({
        id: 'step-a',
        focusFile: { path: 'src/contracts/a/a-contract.ts' },
      });
      const stepB = DependencyStepStub({
        id: 'step-b',
        focusFile: { path: 'src/contracts/b/b-contract.ts' },
      });

      const result = stepsToBatchChunksTransformer({
        steps: [stepA, stepB],
        batchGroups: FolderTypeGroupsStub({ value: [['contracts']] }),
      });

      expect(result).toStrictEqual([[stepA, stepB]]);
    });

    it('VALID: mixed folder types in one group => one batch spans both', () => {
      const contractStep = DependencyStepStub({
        id: 'c',
        focusFile: { path: 'src/contracts/a/a-contract.ts' },
      });
      const staticStep = DependencyStepStub({
        id: 's',
        focusFile: { path: 'src/statics/a/a-statics.ts' },
      });

      const result = stepsToBatchChunksTransformer({
        steps: [contractStep, staticStep],
        batchGroups: FolderTypeGroupsStub({ value: [['contracts', 'statics']] }),
      });

      expect(result).toStrictEqual([[contractStep, staticStep]]);
    });
  });

  describe('solo + grouped mixed', () => {
    it('VALID: two contracts + one broker with [[contracts]] => one batch + one solo', () => {
      const contractA = DependencyStepStub({
        id: 'a',
        focusFile: { path: 'src/contracts/a/a-contract.ts' },
      });
      const contractB = DependencyStepStub({
        id: 'b',
        focusFile: { path: 'src/contracts/b/b-contract.ts' },
      });
      const brokerStep = DependencyStepStub({
        id: 'broker',
        focusFile: { path: 'src/brokers/x/y/x-y-broker.ts' },
      });

      const result = stepsToBatchChunksTransformer({
        steps: [contractA, contractB, brokerStep],
        batchGroups: FolderTypeGroupsStub({ value: [['contracts']] }),
      });

      // Solo emitted in encounter order; grouped flushed at end in group-index order
      expect(result).toStrictEqual([[brokerStep], [contractA, contractB]]);
    });

    it('VALID: multiple groups => flushed in group-index order', () => {
      const contractStep = DependencyStepStub({
        id: 'c',
        focusFile: { path: 'src/contracts/a/a-contract.ts' },
      });
      const guardStep = DependencyStepStub({
        id: 'g',
        focusFile: { path: 'src/guards/is-x/is-x-guard.ts' },
      });
      const transformerStep = DependencyStepStub({
        id: 't',
        focusFile: { path: 'src/transformers/a-to-b/a-to-b-transformer.ts' },
      });

      const result = stepsToBatchChunksTransformer({
        steps: [guardStep, contractStep, transformerStep],
        batchGroups: FolderTypeGroupsStub({
          value: [['contracts'], ['guards', 'transformers']],
        }),
      });

      expect(result).toStrictEqual([[contractStep], [guardStep, transformerStep]]);
    });
  });

  describe('unbatchable steps', () => {
    it('VALID: step with no focusFile => solo batch', () => {
      const focusActionStep = DependencyStepStub({
        id: 'action',
        focusFile: undefined,
        focusAction: { kind: 'verification', description: 'check' },
      });

      const result = stepsToBatchChunksTransformer({
        steps: [focusActionStep],
        batchGroups: FolderTypeGroupsStub({ value: [['contracts']] }),
      });

      expect(result).toStrictEqual([[focusActionStep]]);
    });

    it('VALID: step with unknown folder-type path => solo batch', () => {
      const weirdStep = DependencyStepStub({
        id: 'weird',
        focusFile: { path: 'src/unknown-folder/something/somefile.ts' },
      });

      const result = stepsToBatchChunksTransformer({
        steps: [weirdStep],
        batchGroups: FolderTypeGroupsStub({ value: [['contracts']] }),
      });

      expect(result).toStrictEqual([[weirdStep]]);
    });

    it('VALID: folder type not in any group => solo batch', () => {
      const brokerStep = DependencyStepStub({
        id: 'b',
        focusFile: { path: 'src/brokers/x/y/x-y-broker.ts' },
      });

      const result = stepsToBatchChunksTransformer({
        steps: [brokerStep],
        batchGroups: FolderTypeGroupsStub({ value: [['contracts']] }),
      });

      expect(result).toStrictEqual([[brokerStep]]);
    });
  });

  describe('empty steps', () => {
    it('EMPTY: {steps: []} => returns []', () => {
      const result = stepsToBatchChunksTransformer({
        steps: [],
        batchGroups: FolderTypeGroupsStub({ value: [['contracts']] }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
