import { filePathToProjectRelativeTransformer } from './file-path-to-project-relative-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = AbsoluteFilePathStub({ value: '/repo' });

describe('filePathToProjectRelativeTransformer', () => {
  describe('path within packages/', () => {
    it('VALID: {orchestrator state file} => returns pkgName/folder/file without extension', () => {
      const filePath = AbsoluteFilePathStub({
        value:
          '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
      });

      const result = filePathToProjectRelativeTransformer({ filePath, projectRoot: PROJECT_ROOT });

      expect(result).toBe(
        ContentTextStub({
          value: 'orchestrator/state/orchestration-events/orchestration-events-state',
        }),
      );
    });

    it('VALID: {server adapter file} => returns pkgName/adapters/... without extension', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/adapters/orchestrator/events-on/events-on-adapter.ts',
      });

      const result = filePathToProjectRelativeTransformer({ filePath, projectRoot: PROJECT_ROOT });

      expect(result).toBe(
        ContentTextStub({ value: 'server/adapters/orchestrator/events-on/events-on-adapter' }),
      );
    });

    it('VALID: {file without src/ segment} => returns pkgName/rest without extension', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/shared/brokers.ts',
      });

      const result = filePathToProjectRelativeTransformer({ filePath, projectRoot: PROJECT_ROOT });

      expect(result).toBe(ContentTextStub({ value: 'shared/brokers' }));
    });
  });

  describe('path outside packages/', () => {
    it('EDGE: {path not under projectRoot/packages} => returns raw path unchanged', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/other/location/some-file.ts',
      });

      const result = filePathToProjectRelativeTransformer({ filePath, projectRoot: PROJECT_ROOT });

      expect(result).toBe(ContentTextStub({ value: '/other/location/some-file.ts' }));
    });
  });

  describe('package root only', () => {
    it('EDGE: {path is just packageName with no slash} => returns packageName as-is', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/shared',
      });

      const result = filePathToProjectRelativeTransformer({ filePath, projectRoot: PROJECT_ROOT });

      expect(result).toBe(ContentTextStub({ value: 'shared' }));
    });
  });
});
