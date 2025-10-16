import { TsestreeStub } from './tsestree.stub';

describe('TsestreeStub', () => {
  it('VALID: {} => returns default Tsestree', () => {
    const result = TsestreeStub();

    expect(result.type).toBe('Identifier');
    expect(result.parent).toBeNull();
  });

  it('VALID: {type: "CallExpression"} => returns Tsestree with custom type', () => {
    const result = TsestreeStub({
      type: 'CallExpression',
    });

    expect(result.type).toBe('CallExpression');
  });

  it('VALID: {parent: node} => returns Tsestree with parent', () => {
    const parent = TsestreeStub({ type: 'Program' });
    const result = TsestreeStub({
      type: 'Identifier',
      parent,
    });

    expect(result.parent).toBe(parent);
    expect(result.parent?.type).toBe('Program');
  });

  it('INVALID_TYPE: {type: ""} => throws ZodError', () => {
    expect(() => {
      TsestreeStub({
        type: '',
      });
    }).toThrow('String must contain at least 1 character(s)');
  });
});
