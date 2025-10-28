import { TypeNameStub } from './type-name.stub';

describe('typeNameContract', () => {
  it('VALID: {value: "string"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'string' });

    expect(result).toBe('string');
  });

  it('VALID: {value: "MyCustomType"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'MyCustomType' });

    expect(result).toBe('MyCustomType');
  });

  it('VALID: {value: "number"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'number' });

    expect(result).toBe('number');
  });

  it('VALID: {value: "Array<string>"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Array<string>' });

    expect(result).toBe('Array<string>');
  });

  it('VALID: {value: "Map<K, V>"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Map<K, V>' });

    expect(result).toBe('Map<K, V>');
  });

  it('VALID: {value: "Promise<void>"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Promise<void>' });

    expect(result).toBe('Promise<void>');
  });

  it('VALID: {value: "Record<string, unknown>"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Record<string, unknown>' });

    expect(result).toBe('Record<string, unknown>');
  });

  it('VALID: {value: "() => void"} => parses successfully', () => {
    const result = TypeNameStub({ value: '() => void' });

    expect(result).toBe('() => void');
  });

  it('VALID: {value: "a"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'a' });

    expect(result).toBe('a');
  });

  it('VALID: {value: "VeryLongTypeNameWithManyCharactersToTestLongerStrings"} => parses successfully', () => {
    const result = TypeNameStub({
      value: 'VeryLongTypeNameWithManyCharactersToTestLongerStrings',
    });

    expect(result).toBe('VeryLongTypeNameWithManyCharactersToTestLongerStrings');
  });

  it('VALID: {value: "Type_With_Underscores"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Type_With_Underscores' });

    expect(result).toBe('Type_With_Underscores');
  });

  it('VALID: {value: "Type123WithNumbers"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Type123WithNumbers' });

    expect(result).toBe('Type123WithNumbers');
  });

  it('VALID: {value: "Type-With-Dashes"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Type-With-Dashes' });

    expect(result).toBe('Type-With-Dashes');
  });

  it('VALID: {value: "Type.With.Dots"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Type.With.Dots' });

    expect(result).toBe('Type.With.Dots');
  });

  it('VALID: {value: "Type|Union|Types"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Type|Union|Types' });

    expect(result).toBe('Type|Union|Types');
  });

  it('VALID: {value: "Type & Intersection"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Type & Intersection' });

    expect(result).toBe('Type & Intersection');
  });

  it('VALID: {value: "Type with spaces"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Type with spaces' });

    expect(result).toBe('Type with spaces');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = TypeNameStub({ value: '' });

    expect(result).toBe('');
  });

  it('VALID: {value: "типСКириллицей"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'типСКириллицей' });

    expect(result).toBe('типСКириллицей');
  });

  it('VALID: {value: "类型中文"} => parses successfully', () => {
    const result = TypeNameStub({ value: '类型中文' });

    expect(result).toBe('类型中文');
  });

  it('VALID: {value: "Type🚀WithEmoji"} => parses successfully', () => {
    const result = TypeNameStub({ value: 'Type🚀WithEmoji' });

    expect(result).toBe('Type🚀WithEmoji');
  });
});
