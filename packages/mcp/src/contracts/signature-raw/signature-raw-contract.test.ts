import { SignatureRawStub } from './signature-raw.stub';

describe('signatureRawContract', () => {
  it('VALID: {value: "({ x }: { x: number }): string"} => parses successfully', () => {
    const result = SignatureRawStub({ value: '({ x }: { x: number }): string' });

    expect(result).toBe('({ x }: { x: number }): string');
  });

  it('VALID: {value: "(x: number): string"} => parses successfully', () => {
    const result = SignatureRawStub({ value: '(x: number): string' });

    expect(result).toBe('(x: number): string');
  });

  it('VALID: {value: "(): void"} => parses successfully', () => {
    const result = SignatureRawStub({ value: '(): void' });

    expect(result).toBe('(): void');
  });

  it('VALID: {value: "(a: string, b: number, c?: boolean): Promise<void>"} => parses successfully', () => {
    const result = SignatureRawStub({
      value: '(a: string, b: number, c?: boolean): Promise<void>',
    });

    expect(result).toBe('(a: string, b: number, c?: boolean): Promise<void>');
  });

  it('VALID: {value: "<T>(items: T[]): T | undefined"} => parses successfully', () => {
    const result = SignatureRawStub({ value: '<T>(items: T[]): T | undefined' });

    expect(result).toBe('<T>(items: T[]): T | undefined');
  });

  it('VALID: {value: "<T extends string, U extends number>(a: T, b: U): [T, U]"} => parses successfully', () => {
    const result = SignatureRawStub({
      value: '<T extends string, U extends number>(a: T, b: U): [T, U]',
    });

    expect(result).toBe('<T extends string, U extends number>(a: T, b: U): [T, U]');
  });

  it('VALID: {value: "async (id: string): Promise<User>"} => parses successfully', () => {
    const result = SignatureRawStub({ value: 'async (id: string): Promise<User>' });

    expect(result).toBe('async (id: string): Promise<User>');
  });

  it('VALID: {value: "(...args: unknown[]): void"} => parses successfully', () => {
    const result = SignatureRawStub({ value: '(...args: unknown[]): void' });

    expect(result).toBe('(...args: unknown[]): void');
  });

  it('VALID: {value: "({ user, options }: { user: User; options?: Options }): Result"} => parses successfully', () => {
    const result = SignatureRawStub({
      value: '({ user, options }: { user: User; options?: Options }): Result',
    });

    expect(result).toBe('({ user, options }: { user: User; options?: Options }): Result');
  });

  it('VALID: {value: "(callback: (error: Error | null, data?: string) => void): void"} => parses successfully', () => {
    const result = SignatureRawStub({
      value: '(callback: (error: Error | null, data?: string) => void): void',
    });

    expect(result).toBe('(callback: (error: Error | null, data?: string) => void): void');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = SignatureRawStub({ value: '' });

    expect(result).toBe('');
  });
});
