import { fileDescriptorContract } from './file-descriptor-contract';
import { FileDescriptorStub } from './file-descriptor.stub';

describe('fileDescriptorContract', () => {
  it('VALID: {value: 3} => parses and returns branded FileDescriptor', () => {
    const result = FileDescriptorStub({ value: 3 });

    expect(result).toBe(3);
  });

  it('EDGE: {value: 0} => parses the zero boundary, since fd 0 is stdin', () => {
    const result = FileDescriptorStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('INVALID: {value: -1} => throws for a negative descriptor', () => {
    expect(() => fileDescriptorContract.parse(-1)).toThrow(
      /Number must be greater than or equal to 0/u,
    );
  });

  it('INVALID: {value: 1.5} => throws for a non-integer', () => {
    expect(() => fileDescriptorContract.parse(1.5)).toThrow(/Expected integer, received float/u);
  });
});
