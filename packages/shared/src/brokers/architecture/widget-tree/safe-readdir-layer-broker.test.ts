import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('safeReaddirLayerBroker', () => {
  describe('successful reads', () => {
    it('VALID: {directory with files} => returns entry list', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.setupFiles({ names: ['quest-chat-widget.tsx', 'user-card-widget.tsx'] });

      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets' });
      const result = safeReaddirLayerBroker({ dirPath });

      expect(result.map((e) => e.name)).toStrictEqual([
        'quest-chat-widget.tsx',
        'user-card-widget.tsx',
      ]);
    });

    it('EMPTY: {empty directory} => returns empty array', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.setupEmpty();

      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets' });
      const result = safeReaddirLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {directory does not exist} => returns empty array instead of throwing', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.setupImplementation({
        fn: () => {
          throw new Error('ENOENT');
        },
      });

      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/missing' });
      const result = safeReaddirLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
