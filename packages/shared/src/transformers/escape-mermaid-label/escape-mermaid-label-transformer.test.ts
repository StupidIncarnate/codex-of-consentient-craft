import { FlowEdgeStub } from '../../contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';

import { escapeMermaidLabelTransformer } from './escape-mermaid-label-transformer';

describe('escapeMermaidLabelTransformer', () => {
  describe('labels without special characters', () => {
    it('VALID: {label: "Login Page"} => returns unchanged', () => {
      const node = FlowNodeStub({ label: 'Login Page' });

      const result = escapeMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('Login Page');
    });
  });

  describe('labels with parentheses', () => {
    it('VALID: {label: "Delete failed (error displayed)"} => escapes parens', () => {
      const node = FlowNodeStub({ label: 'Delete failed (error displayed)' });

      const result = escapeMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('Delete failed #40;error displayed#41;');
    });

    it('VALID: {label: "fn(x)"} => escapes both parens', () => {
      const node = FlowNodeStub({ label: 'fn(x)' });

      const result = escapeMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('fn#40;x#41;');
    });
  });

  describe('labels with brackets', () => {
    it('VALID: {label: "array[0]"} => escapes square brackets', () => {
      const node = FlowNodeStub({ label: 'array[0]' });

      const result = escapeMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('array#91;0#93;');
    });
  });

  describe('labels with braces', () => {
    it('VALID: {label: "config{key}"} => escapes curly braces', () => {
      const node = FlowNodeStub({ label: 'config{key}' });

      const result = escapeMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('config#123;key#125;');
    });
  });

  describe('labels with mixed special characters', () => {
    it('VALID: {label: "fn(x) [y] {z}"} => escapes all special chars', () => {
      const node = FlowNodeStub({ label: 'fn(x) [y] {z}' });

      const result = escapeMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('fn#40;x#41; #91;y#93; #123;z#125;');
    });
  });

  describe('labels with pipes', () => {
    it('VALID: {label: "A|B"} => escapes pipe character', () => {
      const node = FlowNodeStub({ label: 'A|B' });

      const result = escapeMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('A#124;B');
    });

    it('VALID: {label: "yes|no|maybe"} => escapes multiple pipes', () => {
      const node = FlowNodeStub({ label: 'yes|no|maybe' });

      const result = escapeMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('yes#124;no#124;maybe');
    });
  });

  describe('labels with double quotes', () => {
    it('VALID: {label: "say \\"hello\\""} => escapes quotes', () => {
      const node = FlowNodeStub({ label: 'say "hello"' });

      const result = escapeMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('say #34;hello#34;');
    });
  });

  describe('edge labels with special characters', () => {
    it('VALID: {label: "Error (404/500)"} => escapes parens in edge label', () => {
      const edge = FlowEdgeStub({ label: 'Error (404/500)' });

      const result = escapeMermaidLabelTransformer({ label: edge.label! });

      expect(result).toBe('Error #40;404/500#41;');
    });

    it('VALID: {label: "A|B"} => escapes pipe in edge label', () => {
      const edge = FlowEdgeStub({ label: 'A|B' });

      const result = escapeMermaidLabelTransformer({ label: edge.label! });

      expect(result).toBe('A#124;B');
    });

    it('VALID: {label: "status \\"OK\\""} => escapes quotes in edge label', () => {
      const edge = FlowEdgeStub({ label: 'status "OK"' });

      const result = escapeMermaidLabelTransformer({ label: edge.label! });

      expect(result).toBe('status #34;OK#34;');
    });
  });

  describe('labels with all special characters combined', () => {
    it('VALID: {label: "fn(x) [y] {z} | \\"q\\""} => escapes everything', () => {
      const node = FlowNodeStub({ label: 'fn(x) [y] {z} | "q"' });

      const result = escapeMermaidLabelTransformer({ label: node.label });

      expect(result).toBe('fn#40;x#41; #91;y#93; #123;z#125; #124; #34;q#34;');
    });
  });
});
