import { duplicateDetectionArgsContract } from './duplicate-detection-args-contract';
import { DuplicateDetectionArgsStub } from './duplicate-detection-args.stub';

describe('duplicateDetectionArgsContract', () => {
  it('VALID: {defaults} => threshold 3', () => {
    const result = DuplicateDetectionArgsStub();

    expect(result).toStrictEqual({ threshold: 3 });
  });

  it('VALID: {threshold: 2} => the lowest accepted threshold', () => {
    const result = duplicateDetectionArgsContract.parse({ threshold: 2 });

    expect(result).toStrictEqual({ threshold: 2 });
  });

  it('VALID: {threshold: MAX_SAFE_INTEGER} => parses', () => {
    const result = duplicateDetectionArgsContract.parse({ threshold: Number.MAX_SAFE_INTEGER });

    expect(result).toStrictEqual({ threshold: Number.MAX_SAFE_INTEGER });
  });

  it('INVALID: {threshold: 1} => throws a too-small error', () => {
    expect(() => duplicateDetectionArgsContract.parse({ threshold: 1 })).toThrow(
      /^[\s\S]*>=2[\s\S]*$/u,
    );
  });

  it('INVALID: {threshold: 2.5} => throws an integer error', () => {
    expect(() => duplicateDetectionArgsContract.parse({ threshold: 2.5 })).toThrow(
      /^[\s\S]*expected int[\s\S]*$/u,
    );
  });
});
