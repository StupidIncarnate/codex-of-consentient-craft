import { ReturnTypeStub } from './return-type.stub';

describe('returnTypeContract', () => {
  it('VALID: {value: "string"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'string' });

    expect(result).toBe('string');
  });

  it('VALID: {value: "void"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'void' });

    expect(result).toBe('void');
  });

  it('VALID: {value: "number"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'number' });

    expect(result).toBe('number');
  });

  it('VALID: {value: "boolean"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'boolean' });

    expect(result).toBe('boolean');
  });

  it('VALID: {value: "User"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'User' });

    expect(result).toBe('User');
  });

  it('VALID: {value: "User[]"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'User[]' });

    expect(result).toBe('User[]');
  });

  it('VALID: {value: "Promise<User>"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'Promise<User>' });

    expect(result).toBe('Promise<User>');
  });

  it('VALID: {value: "Record<string, unknown>"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'Record<string, unknown>' });

    expect(result).toBe('Record<string, unknown>');
  });

  it('VALID: {value: "string | null"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'string | null' });

    expect(result).toBe('string | null');
  });

  it('VALID: {value: "{id: string; name: string}"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: '{id: string; name: string}' });

    expect(result).toBe('{id: string; name: string}');
  });

  it('VALID: {value: "(user: User) => void"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: '(user: User) => void' });

    expect(result).toBe('(user: User) => void');
  });

  it('VALID: {value: "Map<string, User>"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'Map<string, User>' });

    expect(result).toBe('Map<string, User>');
  });

  it('VALID: {value: "Array<string | number>"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'Array<string | number>' });

    expect(result).toBe('Array<string | number>');
  });

  it('VALID: {value: "readonly string[]"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'readonly string[]' });

    expect(result).toBe('readonly string[]');
  });

  it('VALID: {value: "never"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'never' });

    expect(result).toBe('never');
  });

  it('VALID: {value: "unknown"} => parses successfully', () => {
    const result = ReturnTypeStub({ value: 'unknown' });

    expect(result).toBe('unknown');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = ReturnTypeStub({ value: '' });

    expect(result).toBe('');
  });
});
