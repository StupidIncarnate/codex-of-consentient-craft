import { LineIndexStub } from './line-index.stub';

describe('lineIndexContract', () => {
  it('VALID: {value: 0} => parses successfully', () => {
    const result = LineIndexStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('VALID: {value: 1} => parses successfully', () => {
    const result = LineIndexStub({ value: 1 });

    expect(result).toBe(1);
  });

  it('VALID: {value: 100} => parses successfully', () => {
    const result = LineIndexStub({ value: 100 });

    expect(result).toBe(100);
  });

  it('VALID: {value: 999999} => parses successfully', () => {
    const result = LineIndexStub({ value: 999999 });

    expect(result).toBe(999999);
  });
});
