import { mcpHandlerResponderExtractTransformer } from './mcp-handler-responder-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('mcpHandlerResponderExtractTransformer', () => {
  describe('empty source', () => {
    it('EMPTY: {source: ""} => returns []', () => {
      const result = mcpHandlerResponderExtractTransformer({
        source: ContentTextStub({ value: '' }),
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {source with no handler entries} => returns []', () => {
      const result = mcpHandlerResponderExtractTransformer({
        source: ContentTextStub({ value: 'export const SomeFlow = () => [];' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single handler', () => {
    it('VALID: {single handler entry} => returns the responder name', () => {
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

      const result = mcpHandlerResponderExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual(['ArchitectureHandleResponder']);
    });
  });

  describe('multiple handlers', () => {
    it('VALID: {three handler entries} => returns all responder names in order', () => {
      const source = ContentTextStub({
        value: `export const ArchitectureFlow = (): ToolRegistration[] => [
  {
    name: 'discover' as never,
    description: 'A' as never,
    inputSchema: s as never,
    handler: async ({ args }) => ArchitectureHandleResponder({ tool: 'discover' as never, args }),
  },
  {
    name: 'get-architecture' as never,
    description: 'B' as never,
    inputSchema: s as never,
    handler: async ({ args }) =>
      ArchitectureHandleResponder({ tool: 'get-architecture' as never, args }),
  },
  {
    name: 'get-quest' as never,
    description: 'C' as never,
    inputSchema: s as never,
    handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest' as never, args }),
  },
];`,
      });

      const result = mcpHandlerResponderExtractTransformer({ source });

      expect(result.map(String)).toStrictEqual([
        'ArchitectureHandleResponder',
        'ArchitectureHandleResponder',
        'QuestHandleResponder',
      ]);
    });
  });
});
