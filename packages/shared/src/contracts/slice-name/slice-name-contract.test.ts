import { sliceNameContract } from './slice-name-contract';
import { SliceNameStub } from './slice-name.stub';

describe('sliceNameContract', () => {
  it('VALID: {value: "backend"} => parses successfully', () => {
    const name = SliceNameStub({ value: 'backend' });

    expect(name).toBe('backend');
  });

  it('VALID: {default value} => uses default kebab-case', () => {
    const name = SliceNameStub();

    expect(name).toBe('backend');
  });

  it('VALID: {value: "frontend-widgets"} => parses multi-token kebab-case', () => {
    const name = SliceNameStub({ value: 'frontend-widgets' });

    expect(name).toBe('frontend-widgets');
  });

  it('INVALID: {value: "Not-Kebab"} => throws validation error', () => {
    expect(() => {
      return sliceNameContract.parse('Not-Kebab');
    }).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return sliceNameContract.parse('');
    }).toThrow(/too_small/u);
  });

  it('INVALID: {value: "with_underscore"} => throws validation error', () => {
    expect(() => {
      return sliceNameContract.parse('with_underscore');
    }).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: 123} => throws validation error', () => {
    expect(() => {
      return sliceNameContract.parse(123);
    }).toThrow(/Expected string/u);
  });
});
