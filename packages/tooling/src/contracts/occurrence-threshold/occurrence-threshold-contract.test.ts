import { OccurrenceThresholdStub } from './occurrence-threshold.stub';

describe('occurrenceThresholdContract', () => {
  it('VALID: {value: 3} => parses successfully', () => {
    const result = OccurrenceThresholdStub({ value: 3 });

    expect(result).toBe(3);
  });

  it('VALID: {value: 2} => parses successfully', () => {
    const result = OccurrenceThresholdStub({ value: 2 });

    expect(result).toBe(2);
  });

  it('VALID: {value: 10} => parses successfully', () => {
    const result = OccurrenceThresholdStub({ value: 10 });

    expect(result).toBe(10);
  });

  it('VALID: {value: 1000000} => parses successfully', () => {
    const result = OccurrenceThresholdStub({ value: 1000000 });

    expect(result).toBe(1000000);
  });

  it('VALID: {value: MAX_SAFE_INTEGER} => parses successfully', () => {
    const result = OccurrenceThresholdStub({ value: Number.MAX_SAFE_INTEGER });

    expect(result).toBe(Number.MAX_SAFE_INTEGER);
  });
});
