import { ToolNameStub } from '../../../contracts/tool-name/tool-name.stub';
import {
  FileContentsStub,
  GlobPatternStub,
  PathSegmentStub as FilePathStub,
} from '@dungeonmaster/shared/contracts';
import { ArchitectureHandleResponderProxy } from './architecture-handle-responder.proxy';

describe('ArchitectureHandleResponder', () => {
  describe('discover', () => {
    it('VALID: {tool: discover, glob pattern} => returns JSON-stringified discover result', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupFileDiscovery({
        filepath: FilePathStub({
          value: 'packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts',
        }),
        contents: FileContentsStub({
          value: 'export const ArchitectureHandleResponder = () => {};',
        }),
        pattern: GlobPatternStub({ value: 'packages/mcp/src/responders/**' }),
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'discover' }),
        args: { glob: 'packages/mcp/src/responders/**' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });
  });

  describe('get-architecture', () => {
    it('VALID: {tool: get-architecture} => returns architecture overview text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-architecture' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });
  });

  describe('get-syntax-rules', () => {
    it('VALID: {tool: get-syntax-rules} => returns syntax rules text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-syntax-rules' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });
  });

  describe('get-testing-patterns', () => {
    it('VALID: {tool: get-testing-patterns} => returns testing patterns text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-testing-patterns' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });
  });

  describe('get-folder-detail', () => {
    it('VALID: {tool: get-folder-detail, folderType: brokers} => returns folder detail text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-folder-detail' }),
        args: { folderType: 'brokers' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('VALID: {tool: get-folder-detail, folderType with supplemental constraints} => includes constraints in result', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupFolderConstraint({
        folderType: 'brokers',
        content: 'Supplemental constraint content',
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-folder-detail' }),
        args: { folderType: 'brokers' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('INVALID: {tool: get-folder-detail, unknown key} => throws Unrecognized key error', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'get-folder-detail' }),
          args: { folderType: 'brokers', path: '/some/path' },
        }),
      ).rejects.toThrow(/Unrecognized key/u);
    });
  });

  describe('get-project-map', () => {
    it('VALID: {tool: get-project-map} => returns project map text', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-project-map' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });
  });

  describe('unknown tool', () => {
    it('ERROR: {tool: unknown-tool} => throws unknown tool error', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'unknown-tool' }),
          args: {},
        }),
      ).rejects.toThrow(/Unknown architecture tool/u);
    });
  });
});
