import { mermaidDefinitionContract } from './mermaid-definition-contract';
import { MermaidDefinitionStub } from './mermaid-definition.stub';

describe('mermaidDefinitionContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "graph TD; A-->B"} => parses mermaid definition', () => {
      const result = mermaidDefinitionContract.parse('graph TD; A-->B');

      expect(result).toBe('graph TD; A-->B');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => mermaidDefinitionContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => mermaidDefinitionContract.parse(null)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid mermaid definition', () => {
      const result = MermaidDefinitionStub();

      expect(result).toBe('graph TD; A-->B');
    });

    it('VALID: {value: "sequenceDiagram"} => creates definition with custom value', () => {
      const result = MermaidDefinitionStub({ value: 'sequenceDiagram' });

      expect(result).toBe('sequenceDiagram');
    });
  });
});
