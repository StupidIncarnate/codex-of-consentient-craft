import { layerFileParentResolveTransformer } from './layer-file-parent-resolve-transformer';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';

describe('layerFileParentResolveTransformer', () => {
  describe('layer files with -layer- infix', () => {
    it('VALID: {layerFilePath: "/repo/packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.tsx"} => returns parent widget path', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({
          value: '/repo/packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.tsx',
        }),
      });

      expect(result).toBe('/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx');
    });

    it('VALID: {layerFilePath: "/repo/packages/web/src/widgets/quest-chat/quest-chat-header-layer-widget.tsx"} => returns parent widget path', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({
          value: '/repo/packages/web/src/widgets/quest-chat/quest-chat-header-layer-widget.tsx',
        }),
      });

      expect(result).toBe('/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx');
    });

    it('VALID: {layerFilePath: "/repo/packages/web/src/widgets/quest-list/quest-list-row-layer-widget.tsx"} => returns parent widget path', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({
          value: '/repo/packages/web/src/widgets/quest-list/quest-list-row-layer-widget.tsx',
        }),
      });

      expect(result).toBe('/repo/packages/web/src/widgets/quest-list/quest-list-widget.tsx');
    });

    it('VALID: {layerFilePath: "./something-extra-layer-broker.ts"} => returns parent broker path with .ts extension', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({ value: './something-extra-layer-broker.ts' }),
      });

      expect(result).toBe('./something-broker.ts');
    });

    it('VALID: {layerFilePath: "/abs/src/responders/foo/validate-input-layer-responder.ts"} => returns parent responder path', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({
          value: '/abs/src/responders/foo/validate-input-layer-responder.ts',
        }),
      });

      expect(result).toBe('/abs/src/responders/foo/validate-responder.ts');
    });
  });

  describe('extension and suffix handling', () => {
    it('VALID: {layerFilePath: ".ts file with -broker suffix} => preserves .ts extension', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({
          value: '/abs/packages/shared/src/brokers/user/fetch/validate-input-layer-broker.ts',
        }),
      });

      expect(result).toBe('/abs/packages/shared/src/brokers/user/fetch/validate-broker.ts');
    });

    it('VALID: {layerFilePath: ".tsx file with -widget suffix} => preserves .tsx extension', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({
          value: '/abs/packages/web/src/widgets/foo/bar-baz-layer-widget.tsx',
        }),
      });

      expect(result).toBe('/abs/packages/web/src/widgets/foo/bar-widget.tsx');
    });
  });

  describe('multiple -layer- infixes', () => {
    it('EDGE: {layerFilePath: "./foo-layer-bar-layer-widget.tsx"} => last -layer- wins, returns "./foo-layer-widget.tsx"', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({ value: './foo-layer-bar-layer-widget.tsx' }),
      });

      expect(result).toBe('./foo-layer-widget.tsx');
    });
  });

  describe('files without -layer- infix', () => {
    it('EMPTY: {layerFilePath: "./quest-chat-widget.tsx"} => returns null when no -layer- infix', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({ value: './quest-chat-widget.tsx' }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {layerFilePath: "/abs/packages/shared/src/brokers/user/fetch/user-fetch-broker.ts"} => returns null for entry broker file', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({
          value: '/abs/packages/shared/src/brokers/user/fetch/user-fetch-broker.ts',
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {layerFilePath: "/abs/no-extension"} => returns null when basename has no extension', () => {
      const result = layerFileParentResolveTransformer({
        layerFilePath: FilePathStub({ value: '/abs/no-extension' }),
      });

      expect(result).toBe(null);
    });
  });
});
