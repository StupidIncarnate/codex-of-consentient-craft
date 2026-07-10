import { topologicalDepthContract } from './topological-depth-contract';
import { TopologicalDepthStub } from './topological-depth.stub';

describe('topologicalDepthContract', () => {
  describe('valid depths', () => {
    it('VALID: {value: 0} => parses zero depth', () => {
      const result = topologicalDepthContract.parse(TopologicalDepthStub({ value: 0 }));

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => parses positive depth', () => {
      const result = topologicalDepthContract.parse(TopologicalDepthStub({ value: 5 }));

      expect(result).toBe(5);
    });
  });

  describe('invalid depths', () => {
    it('INVALID: {value: -1} => throws validation error', () => {
      expect(() => topologicalDepthContract.parse(-1)).toThrow(/too_small/u);
    });
  });
});
