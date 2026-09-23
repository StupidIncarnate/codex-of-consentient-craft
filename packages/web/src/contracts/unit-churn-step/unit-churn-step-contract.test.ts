import { DisplayLabelStub } from '../display-label/display-label.stub';
import { unitChurnStepContract } from './unit-churn-step-contract';
import { UnitChurnStepStub } from './unit-churn-step.stub';

describe('unitChurnStepContract', () => {
  describe('valid steps', () => {
    it.each(['met', 'cant-meet', 'unmet'] as const)(
      'VALID: {mark: %s} => parses to itself',
      (mark) => {
        expect(UnitChurnStepStub({ mark }).mark).toBe(mark);
      },
    );

    it('VALID: {workItemLabel: "review"} => parses to itself', () => {
      expect(
        UnitChurnStepStub({ workItemLabel: DisplayLabelStub({ value: 'review' }) }).workItemLabel,
      ).toBe('review');
    });
  });

  describe('invalid steps', () => {
    it('INVALID: {mark: "unmarked"} => throws — that state is unit-mark-readout only, never a real observation', () => {
      expect(() =>
        unitChurnStepContract.parse({ mark: 'unmarked', workItemLabel: 'work' }),
      ).toThrow(/Invalid/u);
    });
  });
});
