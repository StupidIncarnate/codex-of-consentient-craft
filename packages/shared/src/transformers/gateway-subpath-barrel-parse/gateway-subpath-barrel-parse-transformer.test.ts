import { gatewaySubpathBarrelParseTransformer } from './gateway-subpath-barrel-parse-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('gatewaySubpathBarrelParseTransformer', () => {
  describe('a Node module subpath', () => {
    it('VALID: {#gateway/node/fs barrel} => realModule "fs" and every value wrapper, no type-only re-exports', () => {
      const barrelContent = ContentTextStub({
        value: [
          "export * from 'fs';",
          "export { appendFileSync } from './append-file-sync/append-file-sync';",
          "export { existsSync } from './exists-sync/exists-sync';",
          "export { isFsError } from './is-fs-error/is-fs-error';",
          "export type { FsError } from './is-fs-error/fs-error';",
          "export { walkFilesSync } from './walk-files-sync/walk-files-sync';",
          "export type { WalkedFile } from './walk-files-sync/walked-file';",
        ].join('\n'),
      });

      const result = gatewaySubpathBarrelParseTransformer({ barrelContent });

      expect(result).toStrictEqual({
        realModule: 'fs',
        wrapperNames: ['appendFileSync', 'existsSync', 'isFsError', 'walkFilesSync'],
      });
    });
  });

  describe('a pure pass-through npm subpath', () => {
    it('VALID: {#gateway/npm/zod barrel} => realModule "zod" and no wrapper names, since both lines forward zod itself', () => {
      const barrelContent = ContentTextStub({
        value: ["export * from 'zod';", "export { default } from 'zod';"].join('\n'),
      });

      const result = gatewaySubpathBarrelParseTransformer({ barrelContent });

      expect(result).toStrictEqual({ realModule: 'zod', wrapperNames: [] });
    });
  });

  describe('a bin subpath (no real module to pass through)', () => {
    it('VALID: {#gateway/bin/claude barrel} => no realModule, every export is a wrapper name', () => {
      const barrelContent = ContentTextStub({
        value: [
          "export { ClaudeNotInstalledError } from './claude-not-installed-error/claude-not-installed-error';",
          "export { resolveClaudeCliPath } from './resolve-claude-cli-path/resolve-claude-cli-path';",
          "export { spawnStreamJson } from './spawn-stream-json/spawn-stream-json';",
        ].join('\n'),
      });

      const result = gatewaySubpathBarrelParseTransformer({ barrelContent });

      expect(result).toStrictEqual({
        wrapperNames: ['ClaudeNotInstalledError', 'resolveClaudeCliPath', 'spawnStreamJson'],
      });
    });
  });

  describe('a browser global pass-through with no export * line', () => {
    it('EMPTY: {#gateway/browser/document barrel, destructures globalThis} => no realModule, no wrapper names', () => {
      const barrelContent = ContentTextStub({ value: 'export const { document } = globalThis;' });

      const result = gatewaySubpathBarrelParseTransformer({ barrelContent });

      expect(result).toStrictEqual({ wrapperNames: [] });
    });
  });

  describe('empty content', () => {
    it('EMPTY: {barrelContent: ""} => no realModule, no wrapper names', () => {
      const barrelContent = ContentTextStub({ value: '' });

      const result = gatewaySubpathBarrelParseTransformer({ barrelContent });

      expect(result).toStrictEqual({ wrapperNames: [] });
    });
  });

  describe('multiple names on one export line', () => {
    it("EDGE: {export { A, B } from './x';} => both names collected", () => {
      const barrelContent = ContentTextStub({ value: "export { one, two } from './x/x';" });

      const result = gatewaySubpathBarrelParseTransformer({ barrelContent });

      expect(result).toStrictEqual({ wrapperNames: ['one', 'two'] });
    });
  });

  describe('an aliased named export', () => {
    it("EDGE: {export { real as alias } from './x';} => the alias is the reported wrapper name", () => {
      const barrelContent = ContentTextStub({
        value: "export { internalName as publicName } from './x/x';",
      });

      const result = gatewaySubpathBarrelParseTransformer({ barrelContent });

      expect(result).toStrictEqual({ wrapperNames: ['publicName'] });
    });
  });
});
