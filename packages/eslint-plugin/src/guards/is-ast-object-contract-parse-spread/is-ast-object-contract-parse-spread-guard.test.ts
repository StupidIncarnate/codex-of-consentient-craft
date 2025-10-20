import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstObjectContractParseSpreadGuard } from './is-ast-object-contract-parse-spread-guard';

describe('isAstObjectContractParseSpreadGuard', () => {
  it('VALID: {ObjectExpression with ...contract.parse()} => returns true', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [
        TsestreeStub({
          type: 'SpreadElement',
          argument: TsestreeStub({
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
          }),
        }),
      ],
    });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(true);
  });

  it('VALID: {ObjectExpression with multiple properties including ...contract.parse()} => returns true', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [
        TsestreeStub({
          type: 'Property',
          key: TsestreeStub({
            type: 'Identifier',
            name: 'foo',
          }),
        }),
        TsestreeStub({
          type: 'SpreadElement',
          argument: TsestreeStub({
            type: 'CallExpression',
            callee: TsestreeStub({
              type: 'MemberExpression',
              object: TsestreeStub({
                type: 'Identifier',
                name: 'dataContract',
              }),
              property: TsestreeStub({
                type: 'Identifier',
                name: 'parse',
              }),
            }),
          }),
        }),
      ],
    });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(true);
  });

  it('INVALID: {ObjectExpression with ...nonContract.parse()} => returns false', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [
        TsestreeStub({
          type: 'SpreadElement',
          argument: TsestreeStub({
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
          }),
        }),
      ],
    });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {ObjectExpression with spread but no contract.parse()} => returns false', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [
        TsestreeStub({
          type: 'SpreadElement',
          argument: TsestreeStub({
            type: 'Identifier',
            name: 'someVariable',
          }),
        }),
      ],
    });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {ObjectExpression with no spread} => returns false', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [
        TsestreeStub({
          type: 'Property',
          key: TsestreeStub({
            type: 'Identifier',
            name: 'foo',
          }),
        }),
      ],
    });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {non-ObjectExpression node} => returns false', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      name: 'test',
    });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstObjectContractParseSpreadGuard({})).toBe(false);
  });

  it('EMPTY: {ObjectExpression with no properties} => returns false', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [],
    });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });

  it('EMPTY: {ObjectExpression with properties: undefined} => returns false', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: undefined,
    });

    expect(isAstObjectContractParseSpreadGuard({ node })).toBe(false);
  });
});
