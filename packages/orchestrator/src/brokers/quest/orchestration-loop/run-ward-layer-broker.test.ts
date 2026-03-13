import { runWardLayerBroker } from './run-ward-layer-broker';

describe('runWardLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runWardLayerBroker).toBe('function');
    });
  });
});
