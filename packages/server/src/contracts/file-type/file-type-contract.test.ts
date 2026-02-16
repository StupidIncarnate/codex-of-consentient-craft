import { fileTypeContract as _fileTypeContract } from './file-type-contract';
import { FileTypeStub } from './file-type.stub';

describe('fileTypeContract', () => {
  it('VALID: {value: "broker"} => parses successfully', () => {
    const result = FileTypeStub({ value: 'broker' });

    expect(result).toBe('broker');
  });

  it('VALID: {value: "adapter"} => parses successfully', () => {
    const result = FileTypeStub({ value: 'adapter' });

    expect(result).toBe('adapter');
  });

  it('VALID: {value: "guard"} => parses successfully', () => {
    const result = FileTypeStub({ value: 'guard' });

    expect(result).toBe('guard');
  });

  it('VALID: {value: "transformer"} => parses successfully', () => {
    const result = FileTypeStub({ value: 'transformer' });

    expect(result).toBe('transformer');
  });

  it('VALID: {value: "contract"} => parses successfully', () => {
    const result = FileTypeStub({ value: 'contract' });

    expect(result).toBe('contract');
  });

  it('VALID: {value: "stub"} => parses successfully', () => {
    const result = FileTypeStub({ value: 'stub' });

    expect(result).toBe('stub');
  });

  it('VALID: {value: "proxy"} => parses successfully', () => {
    const result = FileTypeStub({ value: 'proxy' });

    expect(result).toBe('proxy');
  });

  it('VALID: {value: "test"} => parses successfully', () => {
    const result = FileTypeStub({ value: 'test' });

    expect(result).toBe('test');
  });

  it('VALID: {value: empty string} => parses successfully', () => {
    const result = FileTypeStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: custom type} => parses successfully', () => {
    const result = FileTypeStub({ value: 'custom-file-type' });

    expect(result).toBe('custom-file-type');
  });
});
