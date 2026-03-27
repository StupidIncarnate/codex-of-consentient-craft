import { StepFileReferenceStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { pathToFolderTypeTransformer } from './path-to-folder-type-transformer';

describe('pathToFolderTypeTransformer', () => {
  describe('valid paths', () => {
    it('VALID: {path with guards folder} => returns guards', () => {
      const ref = StepFileReferenceStub({
        path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
      });

      const result = pathToFolderTypeTransformer({
        filePath: ref.path,
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe('guards');
    });

    it('VALID: {path with brokers folder} => returns brokers', () => {
      const ref = StepFileReferenceStub({
        path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
      });

      const result = pathToFolderTypeTransformer({
        filePath: ref.path,
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe('brokers');
    });

    it('VALID: {path with contracts folder} => returns contracts', () => {
      const ref = StepFileReferenceStub({
        path: 'packages/shared/src/contracts/user/user-contract.ts',
      });

      const result = pathToFolderTypeTransformer({
        filePath: ref.path,
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBe('contracts');
    });
  });

  describe('invalid paths', () => {
    it('INVALID_PATH: {path with unknown folder} => returns undefined', () => {
      const ref = StepFileReferenceStub({
        path: 'packages/orchestrator/src/unknown-folder/some-file.ts',
      });

      const result = pathToFolderTypeTransformer({
        filePath: ref.path,
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBeUndefined();
    });

    it('INVALID_PATH: {path without src segment} => returns undefined', () => {
      const ref = StepFileReferenceStub({
        path: 'packages/orchestrator/guards/some-file.ts',
      });

      const result = pathToFolderTypeTransformer({
        filePath: ref.path,
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBeUndefined();
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {filePath: undefined} => returns undefined', () => {
      const result = pathToFolderTypeTransformer({
        folderConfigs: folderConfigStatics,
      });

      expect(result).toBeUndefined();
    });

    it('EMPTY: {folderConfigs: undefined} => returns undefined', () => {
      const ref = StepFileReferenceStub({
        path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
      });

      const result = pathToFolderTypeTransformer({
        filePath: ref.path,
      });

      expect(result).toBeUndefined();
    });
  });
});
