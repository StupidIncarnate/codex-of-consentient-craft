import { runSpiritmenderLayerBroker } from './run-spiritmender-layer-broker';

describe('runSpiritmenderLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runSpiritmenderLayerBroker).toBe('function');
    });
  });
});
