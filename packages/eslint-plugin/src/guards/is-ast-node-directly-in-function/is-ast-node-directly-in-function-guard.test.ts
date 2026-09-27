import { isAstNodeDirectlyInFunctionGuard } from './is-ast-node-directly-in-function-guard';
import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';

// TsestreeStub parses each level through zod, which builds a fresh object rather than
// preserving the exact reference passed in as `parent` — so a nested `parent: functionNode`
// stub prop would never be `===` the original `functionNode` this guard compares against.
// Real ESLint sets `.parent` by MUTATING the already-constructed node (see
// parse-and-find-node.ts's own PURPOSE: "The parser itself never sets .parent — ESLint adds
// that while it walks"), so linking parents here by direct assignment after each stub is built
// mirrors production exactly and keeps the reference identity this guard depends on.
describe('isAstNodeDirectlyInFunctionGuard', () => {
  describe('node directly inside functionNode', () => {
    it('VALID: {node is immediate child of functionNode} => returns true', () => {
      const functionNode = TsestreeStub({ type: 'ArrowFunctionExpression' });
      const node = TsestreeStub({ type: 'CallExpression' });
      node.parent = functionNode;

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(true);
    });

    it('VALID: {node reaches functionNode through non-function ancestors} => returns true', () => {
      const functionNode = TsestreeStub({ type: 'ArrowFunctionExpression' });
      const returnStatement = TsestreeStub({ type: 'ReturnStatement' });
      returnStatement.parent = functionNode;
      const objectExpression = TsestreeStub({ type: 'ObjectExpression' });
      objectExpression.parent = returnStatement;
      const spreadElement = TsestreeStub({ type: 'SpreadElement' });
      spreadElement.parent = objectExpression;
      const node = TsestreeStub({ type: 'CallExpression' });
      node.parent = spreadElement;

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(true);
    });
  });

  describe('node nested inside a different function', () => {
    it('INVALID: {node inside a nested ArrowFunctionExpression} => returns false', () => {
      const functionNode = TsestreeStub({ type: 'ArrowFunctionExpression' });
      const returnStatement = TsestreeStub({ type: 'ReturnStatement' });
      returnStatement.parent = functionNode;
      const objectExpression = TsestreeStub({ type: 'ObjectExpression' });
      objectExpression.parent = returnStatement;
      const property = TsestreeStub({ type: 'Property' });
      property.parent = objectExpression;
      const nestedFunction = TsestreeStub({ type: 'ArrowFunctionExpression' });
      nestedFunction.parent = property;
      const node = TsestreeStub({ type: 'CallExpression' });
      node.parent = nestedFunction;

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(false);
    });

    it('INVALID: {node inside a nested FunctionExpression} => returns false', () => {
      const functionNode = TsestreeStub({ type: 'ArrowFunctionExpression' });
      const nestedFunction = TsestreeStub({ type: 'FunctionExpression' });
      nestedFunction.parent = functionNode;
      const node = TsestreeStub({ type: 'CallExpression' });
      node.parent = nestedFunction;

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(false);
    });

    it('INVALID: {node inside a nested FunctionDeclaration} => returns false', () => {
      const functionNode = TsestreeStub({ type: 'ArrowFunctionExpression' });
      const nestedFunction = TsestreeStub({ type: 'FunctionDeclaration' });
      nestedFunction.parent = functionNode;
      const node = TsestreeStub({ type: 'CallExpression' });
      node.parent = nestedFunction;

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(false);
    });
  });

  describe('parent chain never reaches functionNode', () => {
    it('EDGE: {parent chain ends at Program without reaching functionNode} => returns false', () => {
      const functionNode = TsestreeStub({ type: 'ArrowFunctionExpression' });
      const program = TsestreeStub({ type: 'Program' });
      const node = TsestreeStub({ type: 'CallExpression' });
      node.parent = program;

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {node: undefined} => returns false', () => {
      const functionNode = TsestreeStub({ type: 'ArrowFunctionExpression' });

      expect(isAstNodeDirectlyInFunctionGuard({ node: undefined, functionNode })).toBe(false);
    });

    it('EMPTY: {functionNode: undefined} => returns false', () => {
      const node = TsestreeStub({ type: 'CallExpression' });

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode: undefined })).toBe(false);
    });

    it('EMPTY: {node without parent} => returns false', () => {
      const functionNode = TsestreeStub({ type: 'ArrowFunctionExpression' });
      const node = TsestreeStub({ type: 'CallExpression' });

      expect(isAstNodeDirectlyInFunctionGuard({ node, functionNode })).toBe(false);
    });
  });
});
