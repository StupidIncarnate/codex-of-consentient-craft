import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { isAstFunctionUsesContractParseGuard } from './is-ast-function-uses-contract-parse-guard';

describe('isAstFunctionUsesContractParseGuard', () => {
  // Arrow function with expression body: () => contract.parse({})
  it('VALID: {arrow function with direct contract.parse() call} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => userContract.parse();' });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Arrow function with object expression body: () => ({ ...contract.parse({}) })
  it('VALID: {arrow function with object spread contract.parse()} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({
      code: 'const f = () => ({ ...dataContract.parse() });',
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Block statement with return contract.parse()
  it('VALID: {function with return contract.parse()} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({
      code: 'const f = () => { return userContract.parse(); };',
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Block statement with return { ...contract.parse() }
  it('VALID: {function with return spread contract.parse()} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({
      code: 'const f = () => { return { ...dataContract.parse() }; };',
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Variable declaration with contract.parse()
  it('VALID: {function with variable declaration using contract.parse()} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({
      code: 'const f = () => { const x = userContract.parse(); };',
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Multiple statements with contract.parse() in variable declaration
  it('VALID: {function with multiple statements including contract.parse()} => returns true', () => {
    const funcNode = ArrowFunctionExpressionStub({
      code: 'const f = () => { x; const x = dataContract.parse(); };',
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(true);
  });

  // Invalid cases
  it('INVALID: {arrow function without contract.parse()} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => someFunction();' });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {function with return non-contract.parse()} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => { return {  }; };' });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {function with variable declaration without contract.parse()} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({
      code: 'const f = () => { const x = "test"; };',
    });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('INVALID: {object expression without contract.parse() spread} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => ({ foo: v });' });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  // Empty cases
  it('EMPTY: {funcNode: undefined} => returns false', () => {
    expect(isAstFunctionUsesContractParseGuard({})).toBe(false);
  });

  it('EMPTY: {function with empty block statement} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => {  };' });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {variable declaration with no init} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => { const x; };' });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {return statement with no argument} => returns false', () => {
    const funcNode = ArrowFunctionExpressionStub({ code: 'const f = () => { return; };' });

    expect(isAstFunctionUsesContractParseGuard({ funcNode })).toBe(false);
  });
});
