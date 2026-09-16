import { shotOpenReasonContract } from './shot-open-reason-contract';
import { ShotOpenReasonStub } from './shot-open-reason.stub';

describe('shotOpenReasonContract', () => {
  describe('valid members', () => {
    it.each(shotOpenReasonContract.unwrap().options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const shotOpenReason = ShotOpenReasonStub({ value });

        const result = shotOpenReasonContract.parse(shotOpenReason);

        expect(result).toBe(value);
      },
    );

    it('VALID: {.options} => the five members are listed in PRECEDENCE order, the data shotOpenDecideTransformer reads rather than re-encodes', () => {
      const result = shotOpenReasonContract.unwrap().options;

      expect(result).toStrictEqual(['blank', 'failed', 'start', 'end', 'changed']);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "skipped"} => an unlisted string throws validation error', () => {
      expect(() => {
        ShotOpenReasonStub({ value: 'skipped' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "START"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => {
        shotOpenReasonContract.parse('START');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
