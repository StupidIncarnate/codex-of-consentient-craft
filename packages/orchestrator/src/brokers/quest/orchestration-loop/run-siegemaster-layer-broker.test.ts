import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';

describe('runSiegemasterLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runSiegemasterLayerBroker).toBe('function');
    });
  });
});
