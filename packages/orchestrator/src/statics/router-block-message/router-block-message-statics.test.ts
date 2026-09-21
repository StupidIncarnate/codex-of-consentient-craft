import { routerBlockMessageStatics } from './router-block-message-statics';

describe('routerBlockMessageStatics', () => {
  describe('limits', () => {
    it('VALID: {limits} => caps the unit-id list a block message carries at 15', () => {
      expect(routerBlockMessageStatics).toStrictEqual({ limits: { maxUnitIds: 15 } });
    });
  });
});
