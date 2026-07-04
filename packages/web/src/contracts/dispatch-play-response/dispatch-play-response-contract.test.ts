import { DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { dispatchPlayResponseContract } from './dispatch-play-response-contract';
import { DispatchPlayResponseStub } from './dispatch-play-response.stub';

describe('dispatchPlayResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {allowed: true, state} => parses successfully', () => {
      const result = DispatchPlayResponseStub();

      expect(result).toStrictEqual({
        allowed: true,
        state: DispatchStateStub({ mode: 'node-playing' }),
      });
    });

    it('VALID: {allowed: false, reason, state} => parses denial shape', () => {
      const result = DispatchPlayResponseStub({
        allowed: false,
        reason: 'A /dumpster-launch loop owns the queue' as never,
        state: DispatchStateStub({ mode: 'paused' }),
      });

      expect(result).toStrictEqual({
        allowed: false,
        reason: 'A /dumpster-launch loop owns the queue',
        state: DispatchStateStub({ mode: 'paused' }),
      });
    });
  });

  describe('invalid responses', () => {
    it('INVALID: {missing state} => throws validation error', () => {
      expect(() => dispatchPlayResponseContract.parse({ allowed: true })).toThrow(/invalid_type/u);
    });

    it('INVALID: {reason: ""} => throws too_small validation error', () => {
      expect(() => DispatchPlayResponseStub({ reason: '' as never })).toThrow(/too_small/u);
    });
  });
});
