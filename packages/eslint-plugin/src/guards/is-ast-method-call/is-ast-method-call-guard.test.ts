import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstMethodCallGuard } from './is-ast-method-call-guard';

describe('isAstMethodCallGuard', () => {
  it('VALID: {object: "jest", method: "spyOn", node: jest.spyOn()} => returns true', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'jest',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'spyOn',
        }),
      }),
    });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(true);
  });

  it('VALID: {object: "console", method: "log", node: console.log()} => returns true', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'console',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'log',
        }),
      }),
    });

    expect(isAstMethodCallGuard({ node, object: 'console', method: 'log' })).toBe(true);
  });

  it('INVALID_OBJECT: {object: "jest", method: "spyOn", node: foo.spyOn()} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'foo',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'spyOn',
        }),
      }),
    });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('INVALID_METHOD: {object: "jest", method: "spyOn", node: jest.mock()} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'jest',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'mock',
        }),
      }),
    });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('INVALID_CALLEE: {node without callee} => returns false', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      callee: undefined,
    });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('INVALID_CALLEE_TYPE: {callee is not MemberExpression} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'Identifier',
        name: 'jest',
      }),
    });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('INVALID_OBJECT_TYPE: {callee.object is not Identifier} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Literal',
          value: 'jest',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'spyOn',
        }),
      }),
    });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('INVALID_PROPERTY_TYPE: {callee.property is not Identifier} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'jest',
        }),
        property: TsestreeStub({
          type: 'Literal',
          value: 'spyOn',
        }),
      }),
    });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('EMPTY: {callee.object has no name} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: undefined,
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'spyOn',
        }),
      }),
    });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('EMPTY: {callee.property has no name} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'jest',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: undefined,
        }),
      }),
    });

    expect(isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('EMPTY: {node omitted} => returns false', () => {
    expect(isAstMethodCallGuard({ object: 'jest', method: 'spyOn' })).toBe(false);
  });

  it('EMPTY: {object omitted} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'jest',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'spyOn',
        }),
      }),
    });

    expect(isAstMethodCallGuard({ node, method: 'spyOn' })).toBe(false);
  });

  it('EMPTY: {method omitted} => returns false', () => {
    const node = TsestreeStub({
      type: 'CallExpression',
      callee: TsestreeStub({
        type: 'MemberExpression',
        object: TsestreeStub({
          type: 'Identifier',
          name: 'jest',
        }),
        property: TsestreeStub({
          type: 'Identifier',
          name: 'spyOn',
        }),
      }),
    });

    expect(isAstMethodCallGuard({ node, object: 'jest' })).toBe(false);
  });
});
