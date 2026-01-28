import { renderCapabilitiesContract } from './render-capabilities-contract';
import { RenderCapabilitiesStub } from './render-capabilities.stub';

describe('renderCapabilitiesContract', () => {
  describe('valid input', () => {
    it('VALID: {writeStdin, getFrame, unmount} => parses successfully', () => {
      const input = RenderCapabilitiesStub();

      const result = renderCapabilitiesContract.parse(input);

      expect(typeof result.writeStdin).toBe('function');
      expect(typeof result.getFrame).toBe('function');
      expect(typeof result.unmount).toBe('function');
    });
  });
});
