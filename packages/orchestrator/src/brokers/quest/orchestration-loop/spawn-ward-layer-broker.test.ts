import { spawnWardLayerBroker } from './spawn-ward-layer-broker';

describe('spawnWardLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof spawnWardLayerBroker).toBe('function');
    });
  });
});
