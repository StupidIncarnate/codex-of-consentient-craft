import { unitMarkReadoutContract } from './unit-mark-readout-contract';
import { UnitMarkReadoutStub } from './unit-mark-readout.stub';

describe('unitMarkReadoutContract', () => {
  describe('valid marks', () => {
    it.each(['met', 'cant-meet', 'unmet', 'unmarked'] as const)(
      'VALID: {mark: %s} => parses to itself',
      (mark) => {
        expect(UnitMarkReadoutStub({ mark }).mark).toBe(mark);
      },
    );
  });

  describe('invalid marks', () => {
    it('INVALID: {mark: "confirmed"} => throws', () => {
      expect(() =>
        unitMarkReadoutContract.parse({
          unitId: 'send-flow:observable:check-badge-count-text',
          mark: 'confirmed',
        }),
      ).toThrow(/Invalid/u);
    });
  });

  describe('invalid unitId', () => {
    it('INVALID: {unitId: "not-shaped-right"} => throws', () => {
      expect(() =>
        unitMarkReadoutContract.parse({ unitId: 'not-shaped-right', mark: 'met' }),
      ).toThrow(/Invalid/u);
    });
  });
});
