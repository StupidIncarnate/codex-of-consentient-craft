import { stepRefStatics } from './step-ref-statics';

describe('stepRefStatics', () => {
  it('VALID: {} => holds a three-segment grammar and the two-segment mistake', () => {
    expect(stepRefStatics).toStrictEqual({
      grammar: { segmentCount: 3 },
      mistakes: { stepFieldSegmentCount: 2 },
    });
  });
});
