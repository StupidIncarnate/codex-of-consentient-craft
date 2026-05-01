import { mcpToolNamesExtractTransformer } from './mcp-tool-names-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('mcpToolNamesExtractTransformer', () => {
  describe('empty source', () => {
    it('EMPTY: {source: ""} => returns []', () => {
      const result = mcpToolNamesExtractTransformer({ source: ContentTextStub({ value: '' }) });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {source with no tool names} => returns []', () => {
      const result = mcpToolNamesExtractTransformer({
        source: ContentTextStub({ value: 'export const SomeFlow = () => [];' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single tool', () => {
    it('VALID: {single name entry} => returns the tool name', () => {
      const source = ContentTextStub({
        value: `export const ArchitectureFlow = (): ToolRegistration[] => [
  {
    name: 'discover' as never,
    description: 'Discover utilities' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) => ArchitectureHandleResponder({ tool: 'discover' as never, args }),
  },
];`,
      });

      const result = mcpToolNamesExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual(['discover']);
    });
  });

  describe('multiple tools', () => {
    it('VALID: {three name entries} => returns all tool names in order', () => {
      const source = ContentTextStub({
        value: `export const ArchitectureFlow = (): ToolRegistration[] => [
  { name: 'discover' as never, description: 'A' as never, inputSchema: s, handler: H },
  { name: 'get-architecture' as never, description: 'B' as never, inputSchema: s, handler: H },
  { name: 'get-syntax-rules' as never, description: 'C' as never, inputSchema: s, handler: H },
];`,
      });

      const result = mcpToolNamesExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual([
        'discover',
        'get-architecture',
        'get-syntax-rules',
      ]);
    });
  });

  describe('double-quoted names', () => {
    it('VALID: {double-quoted name} => returns the tool name', () => {
      const source = ContentTextStub({
        value: `{ name: "my-tool" as never, description: 'x' as never, inputSchema: s, handler: H }`,
      });

      const result = mcpToolNamesExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual(['my-tool']);
    });
  });
});
