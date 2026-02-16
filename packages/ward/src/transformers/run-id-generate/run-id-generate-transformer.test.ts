import { RunIdStub } from '../../contracts/run-id/run-id.stub';
import { runIdGenerateTransformer } from './run-id-generate-transformer';
import { runIdGenerateTransformerProxy } from './run-id-generate-transformer.proxy';

describe('runIdGenerateTransformer', () => {
  describe('valid generation', () => {
    it('VALID: {deterministic Date.now and Math.random} => returns RunId with timestamp-hex format', () => {
      runIdGenerateTransformerProxy();

      const result = runIdGenerateTransformer();

      expect(result).toBe(RunIdStub({ value: '1739625600000-a38e' }));
    });
  });
});
