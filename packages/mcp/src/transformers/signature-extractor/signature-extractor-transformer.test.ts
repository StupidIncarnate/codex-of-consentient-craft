import { signatureExtractorTransformer } from './signature-extractor-transformer';
import { FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('signatureExtractorTransformer', () => {
  it('VALID: {export const with object destructuring} => extracts signature', () => {
    const fileContents = FileContentsStub({
      value:
        'export const userFetchBroker = async ({ userId }: { userId: UserId }): Promise<User> => {};',
    });

    const result = signatureExtractorTransformer({ fileContents });

    expect(result?.returnType).toBe('Promise<User>');
    expect(result?.parameters).toStrictEqual([
      {
        name: 'destructured object',
        type: { userId: 'UserId' },
      },
    ]);
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

    expect(result).toBe(null);
  });

  describe('generics', () => {
    it('VALID: {generic function with destructured params} => extracts signature with return type', () => {
      const fileContents = FileContentsStub({
        value: 'export const identityBroker = <T>({ value }: { value: T }): T => value;',
      });

      const result = signatureExtractorTransformer({ fileContents });

      expect(result?.returnType).toBe('T');
    });

    it('VALID: {generic function with destructured params} => extracts parameter type', () => {
      const fileContents = FileContentsStub({
        value: 'export const identityBroker = <T>({ value }: { value: T }): T => value;',
      });

      const result = signatureExtractorTransformer({ fileContents });

      expect(result?.parameters).toStrictEqual([
        {
          name: 'destructured object',
          type: { value: 'T' },
        },
      ]);
    });

    it('VALID: {generic with constraint} => extracts return type', () => {
      const fileContents = FileContentsStub({
        value:
          'export const wrapBroker = <T extends object>({ item }: { item: T }): { wrapped: T } => ({ wrapped: item });',
      });

      const result = signatureExtractorTransformer({ fileContents });

      expect(result?.returnType).toBe('{ wrapped: T }');
    });

    it('VALID: {generic with no params} => extracts signature', () => {
      const fileContents = FileContentsStub({
        value: 'export const emptyBroker = <T>(): T[] => [];',
      });

      const result = signatureExtractorTransformer({ fileContents });

      expect(result?.returnType).toBe('T[]');
    });
  });

  describe('nested braces in parameter types', () => {
    it('VALID: {one-level nested object type} => extracts the nested parameter', () => {
      const fileContents = FileContentsStub({
        value:
          'export const nestedBroker = ({ config }: { config: { apiKey: ApiKey; timeout: Milliseconds } }): void => {};',
      });

      const result = signatureExtractorTransformer({ fileContents });

      expect(result?.parameters).toStrictEqual([
        {
          name: 'destructured object',
          type: { config: '{ apiKey: ApiKey; timeout: Milliseconds }' },
        },
      ]);
    });

    it('VALID: {one-level nested object type} => extracts the return type', () => {
      const fileContents = FileContentsStub({
        value:
          'export const nestedBroker = ({ config }: { config: { apiKey: ApiKey; timeout: Milliseconds } }): void => {};',
      });

      const result = signatureExtractorTransformer({ fileContents });

      expect(result?.returnType).toBe('void');
    });

    it('VALID: {two params with one nested type} => extracts both params', () => {
      const fileContents = FileContentsStub({
        value:
          'export const multiBroker = ({ user, opts }: { user: User; opts: { timeout: Ms } }): Promise<Result> => Promise.resolve({} as Result);',
      });

      const result = signatureExtractorTransformer({ fileContents });

      expect(result?.parameters).toStrictEqual([
        {
          name: 'destructured object',
          type: { user: 'User', opts: '{ timeout: Ms }' },
        },
      ]);
    });
  });

  describe('return type with nested generics', () => {
    it('VALID: {Record<string, T[]> return type} => extracts full return type', () => {
      const fileContents = FileContentsStub({
        value:
          'export const mapBroker = ({ keys }: { keys: string[] }): Record<string, number[]> => ({});',
      });

      const result = signatureExtractorTransformer({ fileContents });

      expect(result?.returnType).toBe('Record<string, number[]>');
    });
  });
});
