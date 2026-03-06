import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';

import { escapeQuotedMermaidLabelTransformer } from './escape-quoted-mermaid-label-transformer';

describe('escapeQuotedMermaidLabelTransformer', () => {
  describe('labels without special characters', () => {
    it('VALID: {label: "Login Page"} => returns unchanged', () => {
      const node = FlowNodeStub({ label: 'Login Page' });

      const result = escapeQuotedMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('Login Page');
    });
  });

  describe('labels with double quotes', () => {
    it('VALID: {label: "say \\"hello\\""} => escapes quotes as &quot;', () => {
      const node = FlowNodeStub({ label: 'say "hello"' });

      const result = escapeQuotedMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('say &quot;hello&quot;');
    });
  });

  describe('labels with parentheses', () => {
    it('VALID: {label: "fn(x)"} => escapes parens same as unquoted', () => {
      const node = FlowNodeStub({ label: 'fn(x)' });

      const result = escapeQuotedMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('fn#40;x#41;');
    });
  });

  describe('labels with mixed special characters', () => {
    it('VALID: {label: "fn(x) \\"y\\""} => escapes parens and quotes correctly', () => {
      const node = FlowNodeStub({ label: 'fn(x) "y"' });

      const result = escapeQuotedMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('fn#40;x#41; &quot;y&quot;');
    });
  });
});
