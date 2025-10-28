import { signatureExtractorTransformer } from './signature-extractor-transformer';
import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';

describe('signatureExtractorTransformer', () => {
  it('VALID: {export const with object destructuring} => extracts signature', () => {
    const fileContents = FileContentsStub({
      value:
        'export const userFetchBroker = async ({ userId }: { userId: UserId }): Promise<User> => {};',
    });

    const result = signatureExtractorTransformer({ fileContents });

    expect(result?.returnType).toBe('Promise<User>');
    expect(result?.parameters).toHaveLength(1);
  });

  it('EMPTY: {no export const} => returns null', () => {
    const fileContents = FileContentsStub({
      value: 'const internal = () => {};',
    });

    const result = signatureExtractorTransformer({ fileContents });

    expect(result).toBeNull();
  });
});
