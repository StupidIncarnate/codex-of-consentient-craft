import { unitChurnContract } from './unit-churn-contract';
import { UnitChurnStub } from './unit-churn.stub';

describe('unitChurnContract', () => {
  describe('valid churn', () => {
    it('VALID: {marks: two steps} => parses, preserving sequence order', () => {
      const churn = UnitChurnStub({
        marks: [
          { mark: 'unmet', workItemLabel: 'work' },
          { mark: 'met', workItemLabel: 'review' },
        ],
      });

      expect(churn.marks.map((step) => step.mark)).toStrictEqual(['unmet', 'met']);
    });

    it('VALID: {marks: four steps} => parses a longer back-and-forth sequence', () => {
      const churn = UnitChurnStub({
        marks: [
          { mark: 'unmet', workItemLabel: 'work' },
          { mark: 'met', workItemLabel: 'work' },
          { mark: 'unmet', workItemLabel: 'review' },
          { mark: 'met', workItemLabel: 'work' },
        ],
      });

      expect(churn.marks.map((step) => step.mark)).toStrictEqual(['unmet', 'met', 'unmet', 'met']);
    });
  });

  describe('invalid churn', () => {
    it('INVALID: {marks: one step} => throws — one mark is not churn', () => {
      expect(() =>
        unitChurnContract.parse({
          unitId: 'send-flow:observable:scan-finds-every-path',
          marks: [{ mark: 'unmet', workItemLabel: 'work' }],
        }),
      ).toThrow(/at least 2/u);
    });

    it('EMPTY: {marks: []} => throws', () => {
      expect(() =>
        unitChurnContract.parse({
          unitId: 'send-flow:observable:scan-finds-every-path',
          marks: [],
        }),
      ).toThrow(/at least 2/u);
    });
  });
});
