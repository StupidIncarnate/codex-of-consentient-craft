import { runPathseekerLayerBroker } from './run-pathseeker-layer-broker';

describe('runPathseekerLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runPathseekerLayerBroker).toBe('function');
    });
  });
});
