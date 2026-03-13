import { writeExecutionLogLayerBroker } from './write-execution-log-layer-broker';

describe('writeExecutionLogLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof writeExecutionLogLayerBroker).toBe('function');
    });
  });
});
