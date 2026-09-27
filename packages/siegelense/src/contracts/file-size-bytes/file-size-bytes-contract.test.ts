import { fileSizeBytesContract } from './file-size-bytes-contract';
import { FileSizeBytesStub } from './file-size-bytes.stub';

describe('fileSizeBytesContract', () => {
  it('VALID: {value: 2048} => parses and returns branded FileSizeBytes', () => {
    const result = FileSizeBytesStub({ value: 2048 });

    expect(result).toBe(2048);
  });

  it('INVALID: {value: -1} => throws for a negative size', () => {
    expect(() => fileSizeBytesContract.parse(-1)).toThrow(/expected number to be >=0/u);
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => fileSizeBytesContract.parse(1.5)).toThrow(/expected int, received number/u);
  });

  it('EDGE: {value: 0} => parses an empty file', () => {
    const result = FileSizeBytesStub({ value: 0 });

    expect(result).toBe(0);
  });
});
