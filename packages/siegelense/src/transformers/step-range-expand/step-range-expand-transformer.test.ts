import { StepRangeStub } from '../../contracts/step-range/step-range.stub';
import { stepRangeExpandTransformer } from './step-range-expand-transformer';

describe('stepRangeExpandTransformer', () => {
  it('VALID: {range: "6-8"} => expands to [6, 7, 8]', () => {
    const range = StepRangeStub({ value: '6-8' });

    const result = stepRangeExpandTransformer({ range });

    expect(result).toStrictEqual([6, 7, 8]);
  });

  it('VALID: {range: "7-7"} => a single-step range expands to [7]', () => {
    const range = StepRangeStub({ value: '7-7' });

    const result = stepRangeExpandTransformer({ range });

    expect(result).toStrictEqual([7]);
  });

  it('EDGE: {range: "9-6"} => a reversed range expands to an empty array rather than throwing', () => {
    const range = StepRangeStub({ value: '9-6' });

    const result = stepRangeExpandTransformer({ range });

    expect(result).toStrictEqual([]);
  });
});
