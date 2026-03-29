import { tsestreeContract } from './tsestree-contract';
import { TsestreeStub, TsestreeNodeType } from './tsestree.stub';

describe('TsestreeStub', () => {
  it('VALID: {} => returns default Tsestree', () => {
    const result = TsestreeStub();

    expect(result).toStrictEqual({
      type: TsestreeNodeType.Identifier,
      parent: null,
    });

    // Validate contract parsing
    const parsed = tsestreeContract.parse(result);

    expect(parsed.type).toBe(TsestreeNodeType.Identifier);
  });

  it('VALID: {type: TsestreeNodeType.CallExpression} => returns Tsestree with custom type', () => {
    const result = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
    });

    expect(result.type).toBe(TsestreeNodeType.CallExpression);
  });

  it('VALID: {parent: node} => returns Tsestree with parent', () => {
    const parent = TsestreeStub({ type: TsestreeNodeType.Program });
    const result = TsestreeStub({
      type: TsestreeNodeType.Identifier,
      parent,
    });

    expect(result.parent).toStrictEqual(parent);
    expect(result.parent?.type).toBe(TsestreeNodeType.Program);
  });

  it('INVALID: {type: ""} => throws ZodError for invalid enum value', () => {
    expect(() => {
      TsestreeStub({
        type: '' as unknown as typeof TsestreeNodeType.Identifier,
      });
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {type: "InvalidNodeType"} => throws ZodError for invalid enum value', () => {
    expect(() => {
      TsestreeStub({
        type: 'InvalidNodeType' as unknown as typeof TsestreeNodeType.Identifier,
      });
    }).toThrow(/Invalid enum value/u);
  });

  it('VALID: {type: UnaryExpression, operator: "typeof"} => returns Tsestree with operator', () => {
    const result = TsestreeStub({
      type: TsestreeNodeType.UnaryExpression,
      operator: 'typeof',
    });

    expect(result).toStrictEqual({
      type: TsestreeNodeType.UnaryExpression,
      operator: 'typeof',
      parent: null,
    });

    // Validate contract parsing
    const parsed = tsestreeContract.parse(result);

    expect(parsed.type).toBe(TsestreeNodeType.UnaryExpression);
  });
});
