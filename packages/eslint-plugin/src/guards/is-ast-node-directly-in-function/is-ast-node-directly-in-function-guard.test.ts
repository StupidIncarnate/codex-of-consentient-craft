import { ArrowFunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/arrow-function-expression/arrow-function-expression.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { ReturnStatementStub } from '#gateway/npm/typescript-eslint__utils/return-statement/return-statement.stub';
import { ObjectExpressionStub } from '#gateway/npm/typescript-eslint__utils/object-expression/object-expression.stub';
import { SpreadElementStub } from '#gateway/npm/typescript-eslint__utils/spread-element/spread-element.stub';
import { PropertyStub } from '#gateway/npm/typescript-eslint__utils/property/property.stub';
import { FunctionExpressionStub } from '#gateway/npm/typescript-eslint__utils/function-expression/function-expression.stub';
import { FunctionDeclarationStub } from '#gateway/npm/typescript-eslint__utils/function-declaration/function-declaration.stub';
import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { isAstNodeDirectlyInFunctionGuard } from './is-ast-node-directly-in-function-guard';

// A guard that compares `.parent` to a function node by reference needs the very object it was
// handed. Real ESLint sets `.parent` by MUTATING an already-constructed node, so these tests link
// parents by direct assignment after each stub is built, which mirrors production exactly.
describe('isAstNodeDirectlyInFunctionGuard', () => {
  describe('node directly inside functionNode', () => {
    it('VALID: {node is immediate child of functionNode} => returns true', () => {
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const node = CallExpressionStub({ code: 'f();' });
      Object.assign(node, { parent: functionNode });

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(true);
    });

    it('VALID: {node reaches functionNode through non-function ancestors} => returns true', () => {
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const returnStatement = ReturnStatementStub({ code: 'return;' });
      Object.assign(returnStatement, { parent: functionNode });
      const objectExpression = ObjectExpressionStub({ code: 'const o = {  };' });
      Object.assign(objectExpression, { parent: returnStatement });
      const spreadElement = SpreadElementStub({ code: 'f(...x);' });
      Object.assign(spreadElement, { parent: objectExpression });
      const node = CallExpressionStub({ code: 'f();' });
      Object.assign(node, { parent: spreadElement });

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(true);
    });
  });

  describe('node nested inside a different function', () => {
    it('INVALID: {node inside a nested ArrowFunctionExpression} => returns false', () => {
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const returnStatement = ReturnStatementStub({ code: 'return;' });
      Object.assign(returnStatement, { parent: functionNode });
      const objectExpression = ObjectExpressionStub({ code: 'const o = {  };' });
      Object.assign(objectExpression, { parent: returnStatement });
      const property = PropertyStub({ code: 'const o = { a: v };' });
      Object.assign(property, { parent: objectExpression });
      const nestedFunction = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      Object.assign(nestedFunction, { parent: property });
      const node = CallExpressionStub({ code: 'f();' });
      Object.assign(node, { parent: nestedFunction });

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(false);
    });

    it('INVALID: {node inside a nested FunctionExpression} => returns false', () => {
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const nestedFunction = FunctionExpressionStub({ code: 'const f = function () {};' });
      Object.assign(nestedFunction, { parent: functionNode });
      const node = CallExpressionStub({ code: 'f();' });
      Object.assign(node, { parent: nestedFunction });

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(false);
    });

    it('INVALID: {node inside a nested FunctionDeclaration} => returns false', () => {
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const nestedFunction = FunctionDeclarationStub({ code: 'function f() {}' });
      Object.assign(nestedFunction, { parent: functionNode });
      const node = CallExpressionStub({ code: 'f();' });
      Object.assign(node, { parent: nestedFunction });

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(false);
    });
  });

  describe('parent chain never reaches functionNode', () => {
    it('EDGE: {parent chain ends at Program without reaching functionNode} => returns false', () => {
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const program = ProgramStub({ code: '' });
      const node = CallExpressionStub({ code: 'f();' });
      Object.assign(node, { parent: program });

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });

      expect(isAstNodeDirectlyInFunctionGuard({ node: undefined, functionNode })).toBe(false);
    });

    it('EMPTY: {functionNode: undefined} => returns false', () => {
      const node = CallExpressionStub({ code: 'f();' });

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode: undefined })).toBe(false);
    });

    it('EMPTY: {node without parent} => returns false', () => {
      const functionNode = ArrowFunctionExpressionStub({ code: 'const f = () => {};' });
      const node = CallExpressionStub({ code: 'f();' });

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(false);
    });
  });
});
