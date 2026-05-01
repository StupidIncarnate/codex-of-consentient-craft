import { stateDirsFindLayerBroker } from './state-dirs-find-layer-broker';
import { stateDirsFindLayerBrokerProxy } from './state-dirs-find-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('stateDirsFindLayerBroker', () => {
  describe('state directory with subdirs', () => {
    it('VALID: {state dir with two stores} => returns their names as ContentText[]', () => {
      const proxy = stateDirsFindLayerBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/orchestrator' });

      proxy.setupStateDirs({ names: ['design-process', 'quest-execution-queue'] });

      const result = stateDirsFindLayerBroker({ packageRoot });

      expect(result).toStrictEqual(['design-process', 'quest-execution-queue']);
    });
  });

  describe('empty state directory', () => {
    it('EMPTY: {state dir with no subdirs} => returns empty array', () => {
      const proxy = stateDirsFindLayerBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/server' });

      proxy.setupEmpty();

      const result = stateDirsFindLayerBroker({ packageRoot });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing state directory', () => {
    it('ERROR: {no state dir exists} => returns empty array', () => {
      const proxy = stateDirsFindLayerBrokerProxy();
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/shared' });

      proxy.setupMissing();

      const result = stateDirsFindLayerBroker({ packageRoot });

      expect(result).toStrictEqual([]);
    });
  });
});
