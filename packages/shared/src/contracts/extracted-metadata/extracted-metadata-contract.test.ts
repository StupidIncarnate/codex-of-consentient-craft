import { extractedMetadataContract as _extractedMetadataContract } from './extracted-metadata-contract';
import { ExtractedMetadataStub } from './extracted-metadata.stub';

describe('extractedMetadataContract', () => {
  it('VALID: {custom values} => creates metadata with overrides', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Test purpose',
      usage: 'test()',
    });

    const { purpose, usage } = result;

    expect(purpose).toBe('Test purpose');
    expect(usage).toBe('test()');
  });

  it('VALID: {default values} => creates metadata with defaults', () => {
    const result = ExtractedMetadataStub();

    const { purpose, usage } = result;

    expect(purpose).toBe('Default test purpose');
    expect(usage).toBe('defaultTest()');
  });
});
