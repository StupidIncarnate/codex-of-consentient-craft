import { dispatchHoldContract } from './dispatch-hold-contract';
import { DispatchHoldStub } from './dispatch-hold.stub';

describe('dispatchHoldContract', () => {
  describe('valid input', () => {
    it('VALID: {approaching-limit on seven-day} => contract parses the complete hold', () => {
      const hold = dispatchHoldContract.parse({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93%',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-13T06:00:00.000Z',
      });

      expect(hold).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93%',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-13T06:00:00.000Z',
      });
    });

    it('VALID: {default stub} => parses an approaching-limit hold on the seven-day window', () => {
      const hold = DispatchHoldStub();

      expect(hold).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93%',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-13T06:00:00.000Z',
      });
    });

    it('VALID: {rejected on five-hour} => parses a hold raised by a 429 rather than a percentage', () => {
      const hold = DispatchHoldStub({
        reason: 'rejected',
        window: 'five-hour',
        detail: 'API refused with 429 on the 5h window',
        resumeAt: '2026-09-13T05:19:29.242Z',
      });

      expect(hold).toStrictEqual({
        reason: 'rejected',
        window: 'five-hour',
        detail: 'API refused with 429 on the 5h window',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-13T05:19:29.242Z',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {reason: "throttled"} => throws on a reason outside the enum', () => {
      expect(() => DispatchHoldStub({ reason: 'throttled' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {window: "one-hour"} => throws on a window outside the enum', () => {
      expect(() => DispatchHoldStub({ window: 'one-hour' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('EMPTY: {detail: ""} => throws, because the queue UI renders this string verbatim', () => {
      expect(() => DispatchHoldStub({ detail: '' as never })).toThrow(
        /String must contain at least 1/u,
      );
    });

    it('INVALID: {resumeAt: "soon"} => throws on a non-ISO resumeAt', () => {
      expect(() => DispatchHoldStub({ resumeAt: 'soon' as never })).toThrow(/Invalid datetime/u);
    });

    it('INVALID: {heldAt: "yesterday"} => throws on a non-ISO heldAt', () => {
      expect(() => DispatchHoldStub({ heldAt: 'yesterday' as never })).toThrow(/Invalid datetime/u);
    });
  });
});
