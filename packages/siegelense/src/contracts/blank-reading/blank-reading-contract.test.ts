import { blankReadingContract } from './blank-reading-contract';
import { BlankReadingStub } from './blank-reading.stub';

describe('blankReadingContract', () => {
  describe('valid readings', () => {
    it('VALID: {blank: true, colour: "#0d0907"} => parses the complete blank reading', () => {
      const result = blankReadingContract.parse(
        BlankReadingStub({ blank: true, colour: '#0d0907' }),
      );

      expect(result).toStrictEqual({ blank: true, colour: '#0d0907' });
    });

    it('VALID: {blank: false, colour: null} => a non-blank frame carries no colour', () => {
      const result = blankReadingContract.parse(BlankReadingStub({ blank: false, colour: null }));

      expect(result).toStrictEqual({ blank: false, colour: null });
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {missing blank} => throws validation error', () => {
      expect(() =>
        blankReadingContract.parse({
          colour: null,
        } as never),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a blank reading with the app background colour', () => {
      const result = BlankReadingStub();

      expect(result).toStrictEqual({ blank: true, colour: '#0d0907' });
    });
  });
});
