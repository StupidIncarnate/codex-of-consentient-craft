import { filePathToSymbolNameTransformer } from './file-path-to-symbol-name-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('filePathToSymbolNameTransformer', () => {
  describe('typical file paths', () => {
    it('VALID: {responder file} => returns basename without extension', () => {
      const filePath = '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts';
      const result = filePathToSymbolNameTransformer({ filePath });

      expect(result).toBe(ContentTextStub({ value: 'quest-start-responder' }));
    });

    it('VALID: {adapter file} => returns basename without extension', () => {
      const filePath = '/repo/packages/server/src/adapters/hono/serve/hono-serve-adapter.ts';
      const result = filePathToSymbolNameTransformer({ filePath });

      expect(result).toBe(ContentTextStub({ value: 'hono-serve-adapter' }));
    });

    it('VALID: {flow file} => returns basename without extension', () => {
      const filePath = '/repo/packages/server/src/flows/quest/quest-flow.ts';
      const result = filePathToSymbolNameTransformer({ filePath });

      expect(result).toBe(ContentTextStub({ value: 'quest-flow' }));
    });
  });

  describe('files without extension', () => {
    it('EDGE: {file with no extension} => returns full basename', () => {
      const filePath = '/repo/packages/server/src/flows/quest/quest-flow';
      const result = filePathToSymbolNameTransformer({ filePath });

      expect(result).toBe(ContentTextStub({ value: 'quest-flow' }));
    });
  });
});
