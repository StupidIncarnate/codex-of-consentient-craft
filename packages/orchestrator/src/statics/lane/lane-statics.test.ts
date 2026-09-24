import { laneStatics } from './lane-statics';

describe('laneStatics', () => {
  describe('defaults.specName', () => {
    it('VALID: {} => is the browsered spec, stack', () => {
      expect(laneStatics.defaults.specName).toBe('stack');
    });
  });
});
