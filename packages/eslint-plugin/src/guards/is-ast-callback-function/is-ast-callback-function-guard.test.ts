import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstCallbackFunctionGuard } from './is-ast-callback-function-guard';

describe('isAstCallbackFunctionGuard', () => {
  it('VALID: {funcNode: arrow function inside CallExpression} => returns true', () => {
    const callExpression = TsestreeStub({
      type: 'CallExpression',
    });

    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      parent: callExpression,
    });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode: function expression inside CallExpression} => returns true', () => {
    const callExpression = TsestreeStub({
      type: 'CallExpression',
    });

    const funcNode = TsestreeStub({
      type: 'FunctionExpression',
      parent: callExpression,
    });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(true);
  });

  it('VALID: {funcNode: function declaration inside CallExpression} => returns true', () => {
    const callExpression = TsestreeStub({
      type: 'CallExpression',
    });

    const funcNode = TsestreeStub({
      type: 'FunctionDeclaration',
      parent: callExpression,
    });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(true);
  });

  it('INVALID_PARENT: {funcNode: arrow function inside BlockStatement} => returns false', () => {
    const blockStatement = TsestreeStub({
      type: 'BlockStatement',
    });

    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      parent: blockStatement,
    });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(false);
  });

  it('INVALID_PARENT: {funcNode: function with no parent} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      parent: null,
    });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(false);
  });

  it('INVALID_PARENT: {funcNode: function inside VariableDeclarator} => returns false', () => {
    const variableDeclarator = TsestreeStub({
      type: 'VariableDeclarator',
    });

    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      parent: variableDeclarator,
    });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(false);
  });

  it('INVALID_PARENT: {funcNode: function inside ExportDefaultDeclaration} => returns false', () => {
    const exportDeclaration = TsestreeStub({
      type: 'ExportDefaultDeclaration',
    });

    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      parent: exportDeclaration,
    });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(false);
  });

  it('EMPTY: {funcNode omitted} => returns false', () => {
    expect(isAstCallbackFunctionGuard({})).toBe(false);
  });

  it('EMPTY: {funcNode with undefined parent} => returns false', () => {
    const funcNode = TsestreeStub({
      type: 'ArrowFunctionExpression',
      parent: undefined,
    });

    expect(isAstCallbackFunctionGuard({ funcNode })).toBe(false);
  });
});
