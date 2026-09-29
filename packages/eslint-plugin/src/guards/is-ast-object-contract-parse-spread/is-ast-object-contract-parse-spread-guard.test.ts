import { ObjectExpressionStub } from '#gateway/npm/typescript-eslint__utils/object-expression/object-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { isAstObjectContractParseSpreadGuard } from './is-ast-object-contract-parse-spread-guard';

describe('isAstObjectContractParseSpreadGuard', () => {
  it('VALID: {ObjectExpression with ...contract.parse()} => returns true', () => {
    const node = ObjectExpressionStub({ code: 'const o = { ...userContract.parse() };' });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(true);
  });

  it('VALID: {ObjectExpression with multiple properties including ...contract.parse()} => returns true', () => {
    const node = ObjectExpressionStub({ code: 'const o = { foo: v, ...dataContract.parse() };' });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(true);
  });

  it('INVALID: {ObjectExpression with ...nonContract.parse()} => returns false', () => {
    const node = ObjectExpressionStub({ code: 'const o = { ...someObject.parse() };' });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {ObjectExpression with spread but no contract.parse()} => returns false', () => {
    const node = ObjectExpressionStub({ code: 'const o = { ...someVariable };' });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {ObjectExpression with no spread} => returns false', () => {
    const node = ObjectExpressionStub({ code: 'const o = { foo: v };' });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {non-ObjectExpression node} => returns false', () => {
    const node = IdentifierStub({ code: 'test;' });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstObjectContractParseSpreadGuard({})).toBe(false);
  });

  it('EMPTY: {ObjectExpression with no properties} => returns false', () => {
    const node = ObjectExpressionStub({ code: 'const o = {  };' });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });
});
