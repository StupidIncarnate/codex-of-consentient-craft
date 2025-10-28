import { ExtractedMetadataStub } from './extracted-metadata.stub';

describe('extractedMetadataContract', () => {
  it('VALID: {complete metadata} => parses successfully', () => {
    const result = ExtractedMetadataStub({
      purpose: 'Fetches user data',
      usage: 'const user = await userFetchBroker({ userId });',
      related: ['userCreateBroker', 'userUpdateBroker'],
      metadata: {},
    });

    expect(result.purpose).toBe('Fetches user data');
    expect(result.related).toStrictEqual(['userCreateBroker', 'userUpdateBroker']);
  });
});
