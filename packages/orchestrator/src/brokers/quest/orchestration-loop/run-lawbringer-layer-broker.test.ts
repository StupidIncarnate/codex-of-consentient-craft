import { runLawbringerLayerBroker } from './run-lawbringer-layer-broker';

describe('runLawbringerLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runLawbringerLayerBroker).toBe('function');
    });
  });
});
