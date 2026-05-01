import { namespaceExportNameExtractTransformer } from './namespace-export-name-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('namespaceExportNameExtractTransformer', () => {
  describe('no matching export', () => {
    it('EMPTY: {source with no exported const object} => returns null', () => {
      const result = namespaceExportNameExtractTransformer({
        source: ContentTextStub({ value: 'const x = 1;' }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {lowercase export const} => returns null', () => {
      const result = namespaceExportNameExtractTransformer({
        source: ContentTextStub({ value: 'export const lowerCase = {};' }),
      });

      expect(result).toBe(null);
    });
  });

  describe('valid namespace export', () => {
    it('VALID: {StartOrchestrator exported} => returns StartOrchestrator', () => {
      const result = namespaceExportNameExtractTransformer({
        source: ContentTextStub({
          value: 'export const StartOrchestrator = {\n  listGuilds: async () => [],\n};\n',
        }),
      });

      expect(String(result)).toBe('StartOrchestrator');
    });

    it('VALID: {StartMcp exported} => returns StartMcp', () => {
      const result = namespaceExportNameExtractTransformer({
        source: ContentTextStub({
          value: 'export const StartMcp = { discover: async () => {} };\n',
        }),
      });

      expect(String(result)).toBe('StartMcp');
    });
  });
});
