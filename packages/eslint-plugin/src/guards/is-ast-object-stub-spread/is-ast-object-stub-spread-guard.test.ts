import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstObjectStubSpreadGuard } from './is-ast-object-stub-spread-guard';

describe('isAstObjectStubSpreadGuard', () => {
  it('VALID: {ObjectExpression with only ...WalkFactsStub()} => returns true', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [
        TsestreeStub({
          type: 'SpreadElement',
          argument: TsestreeStub({
            type: 'CallExpression',
            callee: TsestreeStub({
              type: 'Identifier',
              name: 'WalkFactsStub',
            }),
          }),
        }),
      ],
    });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(true);
  });

  it('VALID: {ObjectExpression with two stub spreads} => returns true', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [
        TsestreeStub({
          type: 'SpreadElement',
          argument: TsestreeStub({
            type: 'CallExpression',
            callee: TsestreeStub({
              type: 'Identifier',
              name: 'UserStub',
            }),
          }),
        }),
        TsestreeStub({
          type: 'SpreadElement',
          argument: TsestreeStub({
            type: 'CallExpression',
            callee: TsestreeStub({
              type: 'Identifier',
              name: 'AddressStub',
            }),
          }),
        }),
      ],
    });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(true);
  });

  it('INVALID: {ObjectExpression with stub spread plus a hand-written property} => returns false', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [
        TsestreeStub({
          type: 'SpreadElement',
          argument: TsestreeStub({
            type: 'CallExpression',
            callee: TsestreeStub({
              type: 'Identifier',
              name: 'UserStub',
            }),
          }),
        }),
        TsestreeStub({
          type: 'Property',
          key: TsestreeStub({
            type: 'Identifier',
            name: 'name',
          }),
        }),
      ],
    });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {ObjectExpression spreading a non-stub call} => returns false', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [
        TsestreeStub({
          type: 'SpreadElement',
          argument: TsestreeStub({
            type: 'CallExpression',
            callee: TsestreeStub({
              type: 'Identifier',
              name: 'buildUser',
            }),
          }),
        }),
      ],
    });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {ObjectExpression spreading a variable} => returns false', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [
        TsestreeStub({
          type: 'SpreadElement',
          argument: TsestreeStub({
            type: 'Identifier',
            name: 'baseUser',
          }),
        }),
      ],
    });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {ObjectExpression spreading a member call} => returns false', () => {
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
                name: 'stubs',
              }),
              property: TsestreeStub({
                type: 'Identifier',
                name: 'UserStub',
              }),
            }),
          }),
        }),
      ],
    });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('INVALID: {non-ObjectExpression node} => returns false', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      name: 'test',
    });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstObjectStubSpreadGuard({})).toBe(false);
  });

  it('EMPTY: {ObjectExpression with no properties} => returns false', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: [],
    });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });

  it('EMPTY: {ObjectExpression with properties: undefined} => returns false', () => {
    const node = TsestreeStub({
      type: 'ObjectExpression',
      properties: undefined,
    });

    expect(isAstObjectStubSpreadGuard({ node })).toBe(false);
  });
});
