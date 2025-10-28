import { ExtractedMetadataStub } from './extracted-metadata.stub';

describe('extractedMetadataContract', () => {
  it('VALID: {complete metadata with multiple related files} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Fetches user data',
      usage: 'const user = await userFetchBroker({ userId });',
      related: ['userCreateBroker', 'userUpdateBroker'],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Fetches user data',
      usage: 'const user = await userFetchBroker({ userId });',
      related: ['userCreateBroker', 'userUpdateBroker'],
      metadata: {},
    });
  });

  it('VALID: {empty related array} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Test function',
      usage: 'testFunction();',
      related: [],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Test function',
      usage: 'testFunction();',
      related: [],
      metadata: {},
    });
  });

  it('VALID: {single related file} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Utility function',
      usage: 'const result = utilityFunction();',
      related: ['helperFunction'],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Utility function',
      usage: 'const result = utilityFunction();',
      related: ['helperFunction'],
      metadata: {},
    });
  });

  it('VALID: {many related files} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Complex function',
      usage: 'complexFunction();',
      related: ['file1', 'file2', 'file3', 'file4', 'file5'],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Complex function',
      usage: 'complexFunction();',
      related: ['file1', 'file2', 'file3', 'file4', 'file5'],
      metadata: {},
    });
  });

  it('VALID: {empty strings} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: '',
      usage: '',
      related: [],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: '',
      usage: '',
      related: [],
      metadata: {},
    });
  });

  it('VALID: {long purpose string} => parses successfully', () => {
    const longPurpose = 'A'.repeat(1000);
    const result = ExtractedMetadataStub({
      purpose: longPurpose,
      usage: 'fn();',
      related: [],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: longPurpose,
      usage: 'fn();',
      related: [],
      metadata: {},
    });
  });

  it('VALID: {long usage string} => parses successfully', () => {
    const longUsage = 'B'.repeat(1000);
    const result = ExtractedMetadataStub({
      purpose: 'Function',
      usage: longUsage,
      related: [],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Function',
      usage: longUsage,
      related: [],
      metadata: {},
    });
  });

  it('VALID: {special characters in purpose} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Purpose with !@#$%^&*() characters',
      usage: 'fn();',
      related: [],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Purpose with !@#$%^&*() characters',
      usage: 'fn();',
      related: [],
      metadata: {},
    });
  });

  it('VALID: {special characters in usage} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Function',
      usage: 'const result = fn({ param: "value", special: !@#$ });',
      related: [],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Function',
      usage: 'const result = fn({ param: "value", special: !@#$ });',
      related: [],
      metadata: {},
    });
  });

  it('VALID: {special characters in related files} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Function',
      usage: 'fn();',
      related: ['file-with-dashes', 'file_with_underscores', 'file.with.dots'],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Function',
      usage: 'fn();',
      related: ['file-with-dashes', 'file_with_underscores', 'file.with.dots'],
      metadata: {},
    });
  });

  it('VALID: {unicode characters in purpose} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: '目的 🎯',
      usage: 'fn();',
      related: [],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: '目的 🎯',
      usage: 'fn();',
      related: [],
      metadata: {},
    });
  });

  it('VALID: {unicode characters in usage} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Function',
      usage: '使用例: const result = 関数();',
      related: [],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Function',
      usage: '使用例: const result = 関数();',
      related: [],
      metadata: {},
    });
  });

  it('VALID: {unicode characters in related files} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Function',
      usage: 'fn();',
      related: ['関連ファイル', '相关文件'],
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Function',
      usage: 'fn();',
      related: ['関連ファイル', '相关文件'],
      metadata: {},
    });
  });
});
