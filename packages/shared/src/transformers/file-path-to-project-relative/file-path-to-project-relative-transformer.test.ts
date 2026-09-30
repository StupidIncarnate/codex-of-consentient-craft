import { filePathToProjectRelativeTransformer } from './file-path-to-project-relative-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

const PROJECT_ROOT = '/repo';

describe('filePathToProjectRelativeTransformer', () => {
  describe('path within packages/', () => {
    it('VALID: {orchestrator state file} => returns pkgName/folder/file without extension', () => {
      const filePath = '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts';

      const result = filePathToProjectRelativeTransformer({ filePath, projectRoot: PROJECT_ROOT });

      expect(result).toBe(
        ContentTextStub({
          value: 'orchestrator/state/orchestration-events/orchestration-events-state',
        }),
      );
    });

    it('VALID: {server adapter file} => returns pkgName/adapters/... without extension', () => {
      const filePath = '/repo/packages/server/src/adapters/orchestrator/events-on/events-on-adapter.ts';

      const result = filePathToProjectRelativeTransformer({ filePath, projectRoot: PROJECT_ROOT });

      expect(result).toBe(
        ContentTextStub({ value: 'server/adapters/orchestrator/events-on/events-on-adapter' }),
      );
    });

    it('VALID: {file without src/ segment} => returns pkgName/rest without extension', () => {
      const filePath = '/repo/packages/shared/brokers.ts';

      const result = filePathToProjectRelativeTransformer({ filePath, projectRoot: PROJECT_ROOT });

      expect(result).toBe(ContentTextStub({ value: 'shared/brokers' }));
    });
  });

  describe('path outside packages/', () => {
    it('EDGE: {path not under projectRoot/packages} => returns raw path unchanged', () => {
      const filePath = '/other/location/some-file.ts';

      const result = filePathToProjectRelativeTransformer({ filePath, projectRoot: PROJECT_ROOT });

      expect(result).toBe(ContentTextStub({ value: '/other/location/some-file.ts' }));
    });
  });

  describe('package root only', () => {
    it('EDGE: {path is just packageName with no slash} => returns packageName as-is', () => {
      const filePath = '/repo/packages/shared';

      const result = filePathToProjectRelativeTransformer({ filePath, projectRoot: PROJECT_ROOT });

      expect(result).toBe(ContentTextStub({ value: 'shared' }));
    });
  });
});
