import { ExtractedMetadataStub } from './extracted-metadata.stub';

describe('extractedMetadataContract', () => {
  it('VALID: {complete metadata with multiple related files} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Fetches user data',
      usage: 'const user = await userFetchBroker({ userId });',
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Fetches user data',
      usage: 'const user = await userFetchBroker({ userId });',
      metadata: {},
    });
  });

  it('VALID: {empty strings} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: '',
      usage: '',
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: '',
      usage: '',
      metadata: {},
    });
  });

  it('VALID: {long purpose string} => parses successfully', () => {
    const longPurpose = 'A'.repeat(1000);
    const result = ExtractedMetadataStub({
      purpose: longPurpose,
      usage: 'fn();',
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: longPurpose,
      usage: 'fn();',
      metadata: {},
    });
  });

  it('VALID: {long usage string} => parses successfully', () => {
    const longUsage = 'B'.repeat(1000);
    const result = ExtractedMetadataStub({
      purpose: 'Function',
      usage: longUsage,
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Function',
      usage: longUsage,
      metadata: {},
    });
  });

  it('VALID: {special characters in purpose} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Purpose with !@#$%^&*() characters',
      usage: 'fn();',
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Purpose with !@#$%^&*() characters',
      usage: 'fn();',
      metadata: {},
    });
  });

  it('VALID: {special characters in usage} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Function',
      usage: 'const result = fn({ param: "value", special: !@#$ });',
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Function',
      usage: 'const result = fn({ param: "value", special: !@#$ });',
      metadata: {},
    });
  });

  it('VALID: {unicode characters in purpose} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: '目的 🎯',
      usage: 'fn();',
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: '目的 🎯',
      usage: 'fn();',
      metadata: {},
    });
  });

  it('VALID: {unicode characters in usage} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Function',
      usage: '使用例: const result = 関数();',
      metadata: {},
    });

    expect(result).toStrictEqual({
      purpose: 'Function',
      usage: '使用例: const result = 関数();',
      metadata: {},
    });
  });
});
