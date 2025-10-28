import { FileTypeStub } from './file-type.stub';

describe('fileTypeContract', () => {
  it('VALID: {value: "broker"} => parses successfully', () => {
    const result = FileTypeStub({ value: 'broker' });

    expect(result).toBe('broker');
  });
});
