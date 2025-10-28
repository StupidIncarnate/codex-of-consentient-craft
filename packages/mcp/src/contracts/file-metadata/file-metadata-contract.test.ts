import { FileMetadataStub } from './file-metadata.stub';

describe('fileMetadataContract', () => {
  it('VALID: {complete metadata} => parses successfully', () => {
    const result = FileMetadataStub({
      name: 'testBroker',
      path: '/test/brokers/test-broker.ts',
      fileType: 'broker',
      purpose: 'Test purpose',
      signature: {
        raw: '(): void',
        parameters: [],
        returnType: 'void',
      },
      usage: 'testBroker();',
      related: ['otherBroker'],
    });

    expect(result.name).toBe('testBroker');
    expect(result.path).toBe('/test/brokers/test-broker.ts');
    expect(result.fileType).toBe('broker');
  });

  it('VALID: {with optional metadata field} => parses successfully', () => {
    const result = FileMetadataStub({
      metadata: {
        whenToUse: 'Use when you need X',
        whenNotToUse: 'Do not use when Y',
      },
    });

    expect(result.metadata).toStrictEqual({
      whenToUse: 'Use when you need X',
      whenNotToUse: 'Do not use when Y',
    });
  });
});
