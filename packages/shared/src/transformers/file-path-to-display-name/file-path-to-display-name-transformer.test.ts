import { filePathToDisplayNameTransformer } from './file-path-to-display-name-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('filePathToDisplayNameTransformer', () => {
  describe('strip prefix and .ts extension', () => {
    it('VALID: {flow file} => returns relative path without extension', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const result = filePathToDisplayNameTransformer({ filePath, packageSrcPath });

      expect(result).toBe(ContentTextStub({ value: 'flows/quest/quest-flow' }));
    });

    it('VALID: {startup file} => returns relative path without extension', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const result = filePathToDisplayNameTransformer({ filePath, packageSrcPath });

      expect(result).toBe(ContentTextStub({ value: 'startup/start-server' }));
    });

    it('VALID: {responder file} => returns relative path without extension', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const result = filePathToDisplayNameTransformer({ filePath, packageSrcPath });

      expect(result).toBe(
        ContentTextStub({ value: 'responders/quest/start/quest-start-responder' }),
      );
    });
  });

  describe('file outside package src path', () => {
    it('EDGE: {file outside src prefix} => returns file path without .ts', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/other/packages/shared/src/adapters/foo/foo-adapter.ts',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const result = filePathToDisplayNameTransformer({ filePath, packageSrcPath });

      expect(result).toBe(
        ContentTextStub({ value: '/other/packages/shared/src/adapters/foo/foo-adapter' }),
      );
    });
  });

  describe('file without .ts extension', () => {
    it('EDGE: {non-ts file} => returns path as-is relative to src', () => {
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/quest/quest-flow.js',
      });
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      const result = filePathToDisplayNameTransformer({ filePath, packageSrcPath });

      expect(result).toBe(ContentTextStub({ value: 'flows/quest/quest-flow.js' }));
    });
  });
});
