import { startupFilesFindLayerBroker } from './startup-files-find-layer-broker';
import { startupFilesFindLayerBrokerProxy } from './startup-files-find-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('startupFilesFindLayerBroker', () => {
  describe('startup files found', () => {
    it('VALID: {single start-*.ts file} => returns one startup file path', () => {
      const proxy = startupFilesFindLayerBrokerProxy();
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      proxy.setupFiles({ names: ['start-server.ts'] });

      const result = startupFilesFindLayerBroker({ packageSrcPath });

      expect(result).toStrictEqual([
        AbsoluteFilePathStub({ value: '/repo/packages/server/src/startup/start-server.ts' }),
      ]);
    });

    it('VALID: {multiple start-*.ts files} => returns all startup file paths', () => {
      const proxy = startupFilesFindLayerBrokerProxy();
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      proxy.setupFiles({ names: ['start-server.ts', 'start-other.ts'] });

      const result = startupFilesFindLayerBroker({ packageSrcPath });

      expect(result).toStrictEqual([
        AbsoluteFilePathStub({ value: '/repo/packages/server/src/startup/start-server.ts' }),
        AbsoluteFilePathStub({ value: '/repo/packages/server/src/startup/start-other.ts' }),
      ]);
    });
  });

  describe('filtering', () => {
    it('VALID: {test file in startup/} => filters out test files', () => {
      const proxy = startupFilesFindLayerBrokerProxy();
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      proxy.setupFiles({ names: ['start-server.ts', 'start-server.test.ts'] });

      const result = startupFilesFindLayerBroker({ packageSrcPath });

      expect(result).toStrictEqual([
        AbsoluteFilePathStub({ value: '/repo/packages/server/src/startup/start-server.ts' }),
      ]);
    });

    it('VALID: {non-startup file in startup/} => filters out non-matching files', () => {
      const proxy = startupFilesFindLayerBrokerProxy();
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      proxy.setupFiles({ names: ['start-server.ts', 'config.ts'] });

      const result = startupFilesFindLayerBroker({ packageSrcPath });

      expect(result).toStrictEqual([
        AbsoluteFilePathStub({ value: '/repo/packages/server/src/startup/start-server.ts' }),
      ]);
    });
  });

  describe('empty directory', () => {
    it('EMPTY: {missing startup directory} => returns empty array', () => {
      const proxy = startupFilesFindLayerBrokerProxy();
      const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });
      proxy.setupEmpty();

      const result = startupFilesFindLayerBroker({ packageSrcPath });

      expect(result).toStrictEqual([]);
    });
  });
});
