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

  it('VALID: {export const with no parameters} => extracts signature', () => {
    const fileContents = FileContentsStub({
      value: 'export const typescriptEslintEslintPluginLoadAdapter = (): EslintPlugin => {};',
    });

    const result = signatureExtractorTransformer({ fileContents });

    expect(result?.returnType).toBe('EslintPlugin');
    expect(result?.parameters).toStrictEqual([]);
  });

  it('VALID: {export const async with no parameters} => extracts signature', () => {
    const fileContents = FileContentsStub({
      value: 'export const fetchDataBroker = async (): Promise<Data> => {};',
    });

    const result = signatureExtractorTransformer({ fileContents });

    expect(result?.returnType).toBe('Promise<Data>');
    expect(result?.parameters).toStrictEqual([]);
  });

  it('EMPTY: {no export const} => returns null', () => {
    const fileContents = FileContentsStub({
      value: 'const internal = () => {};',
    });

    const result = signatureExtractorTransformer({ fileContents });

    expect(result).toBeNull();
  });
});
