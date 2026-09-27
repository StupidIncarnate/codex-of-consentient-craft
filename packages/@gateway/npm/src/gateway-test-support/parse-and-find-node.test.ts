import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { parseAndFindNode } from './parse-and-find-node';

describe('parseAndFindNode', () => {
  describe('a real CallExpression', () => {
    it('VALID: {code: "foo(a);"} => arguments populated, unlike a hand-built node', () => {
      const node = parseAndFindNode({ code: 'foo(a);', nodeType: AST_NODE_TYPES.CallExpression });

      expect({ argumentCount: node.arguments.length, calleeType: node.callee.type }).toStrictEqual({
        argumentCount: 1,
        calleeType: AST_NODE_TYPES.Identifier,
      });
    });

    it('VALID: {code: "foo(a);"} => .parent is set via simpleTraverse, not by the parser', () => {
      const node = parseAndFindNode({ code: 'foo(a);', nodeType: AST_NODE_TYPES.CallExpression });

      expect(node.parent.type).toBe(AST_NODE_TYPES.ExpressionStatement);
    });
  });

  describe('jsx: true', () => {
    it('VALID: {code: JSX, jsx: true} => finds a real JSXElement', () => {
      const node = parseAndFindNode({
        code: 'const el = <div>hi</div>;',
        nodeType: AST_NODE_TYPES.JSXElement,
        jsx: true,
      });

      expect(node.openingElement.name.type).toBe(AST_NODE_TYPES.JSXIdentifier);
    });
  });

  describe('no matching node', () => {
    it('ERROR: {code: "foo(a);", nodeType: JSXElement} => throws naming the code', () => {
      expect(() =>
        parseAndFindNode({ code: 'foo(a);', nodeType: AST_NODE_TYPES.JSXElement }),
      ).toThrow(/no JSXElement node found in code: foo\(a\);/u);
    });
  });
});
