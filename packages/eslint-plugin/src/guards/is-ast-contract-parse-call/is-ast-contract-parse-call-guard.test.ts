import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstContractParseCallGuard } from './is-ast-contract-parse-call-guard';

describe('isAstContractParseCallGuard', () => {
  it('VALID: {CallExpression with contract.parse()} => returns true', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'userContract',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'parse',
        }),
      }),
    });

    expect(isAstContractParseCallGuard({ node })).toBe(true);
  });

  it('VALID: {CallExpression with anyContract.parse()} => returns true', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'someOtherContract',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'parse',
        }),
      }),
    });

    expect(isAstContractParseCallGuard({ node })).toBe(true);
  });

  it('INVALID: {CallExpression with non-contract.parse()} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'someObject',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'parse',
        }),
      }),
    });

    expect(isAstContractParseCallGuard({ node })).toBe(false);
  });

  it('INVALID: {CallExpression with contract.validate()} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'userContract',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'validate',
        }),
      }),
    });

    expect(isAstContractParseCallGuard({ node })).toBe(false);
  });

  it('INVALID: {CallExpression with non-MemberExpression callee} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'Identifier',
        name: 'someFunction',
      }),
    });

    expect(isAstContractParseCallGuard({ node })).toBe(false);
  });

  it('INVALID: {non-CallExpression node} => returns false', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      name: 'test',
    });

    expect(isAstContractParseCallGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstContractParseCallGuard({})).toBe(false);
  });

  it('EMPTY: {CallExpression with no callee} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: undefined,
    });

    expect(isAstContractParseCallGuard({ node })).toBe(false);
  });
});
