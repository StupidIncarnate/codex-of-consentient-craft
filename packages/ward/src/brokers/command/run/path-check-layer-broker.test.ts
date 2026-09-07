import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { pathCheckLayerBroker } from './path-check-layer-broker';
import { pathCheckLayerBrokerProxy } from './path-check-layer-broker.proxy';

describe('pathCheckLayerBroker', () => {
  describe('no passthrough', () => {
    it('EMPTY: {passthrough undefined} => returns no missing paths and asks disk nothing', () => {
      pathCheckLayerBrokerProxy();

      const { passthrough } = WardConfigStub({ only: ['lint'] });

      const result = pathCheckLayerBroker({
        passthrough,
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('every path resolves', () => {
    it('VALID: {two paths on disk} => returns no missing paths', () => {
      const proxy = pathCheckLayerBrokerProxy();
      proxy.setupExistingPath({
        filePath: FilePathStub({ value: '/project/packages/ward/src/a.ts' }),
      });
      proxy.setupExistingPath({
        filePath: FilePathStub({ value: '/project/packages/ward/src/b.ts' }),
      });

      const { passthrough } = WardConfigStub({
        passthrough: ['packages/ward/src/a.ts', 'packages/ward/src/b.ts'],
      });

      const result = pathCheckLayerBroker({
        passthrough,
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a path is not on disk', () => {
    // The broker joins `rootPath` to the repo-relative arg before it asks, so the address the test
    // stages is the absolute one. Staging the relative form would never match and the case would
    // pass for the wrong reason.
    it('ERROR: {one path missing} => returns exactly that path', () => {
      const proxy = pathCheckLayerBrokerProxy();
      proxy.setupExistingPath({
        filePath: FilePathStub({ value: '/project/packages/ward/src/a.ts' }),
      });
      proxy.setupMissingPath({
        filePath: FilePathStub({ value: '/project/packages/wardd/src/typo.ts' }),
      });

      const { passthrough } = WardConfigStub({
        passthrough: ['packages/ward/src/a.ts', 'packages/wardd/src/typo.ts'],
      });

      const result = pathCheckLayerBroker({
        passthrough,
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(['packages/wardd/src/typo.ts']);
    });

    it('ERROR: {every path missing} => returns all of them in order', () => {
      const proxy = pathCheckLayerBrokerProxy();
      proxy.setupMissingPath({ filePath: FilePathStub({ value: '/project/one.ts' }) });
      proxy.setupMissingPath({ filePath: FilePathStub({ value: '/project/two.ts' }) });

      const { passthrough } = WardConfigStub({ passthrough: ['one.ts', 'two.ts'] });

      const result = pathCheckLayerBroker({
        passthrough,
        rootPath: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(['one.ts', 'two.ts']);
    });
  });
});
