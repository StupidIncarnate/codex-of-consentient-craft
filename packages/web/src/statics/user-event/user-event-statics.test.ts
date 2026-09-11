import { userEventStatics } from './user-event-statics';

describe('userEventStatics', () => {
  describe('options', () => {
    it('VALID: {options} => delay is null, so user-event waits on no timer between events', () => {
      expect(userEventStatics.options).toStrictEqual({ delay: null });
    });
  });
});
