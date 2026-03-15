import { runCodeweaverLayerBroker } from './run-codeweaver-layer-broker';

describe('runCodeweaverLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runCodeweaverLayerBroker).toBe('function');
    });
  });
});
