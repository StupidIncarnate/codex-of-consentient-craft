import { RecoverGuildLayerResponder } from './recover-guild-layer-responder';

describe('RecoverGuildLayerResponder', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof RecoverGuildLayerResponder).toBe('function');
    });
  });
});
