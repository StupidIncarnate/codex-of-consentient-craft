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

    it('VALID: {tool: discover, verbose: true, strict: true} => accepts JSON booleans without coercion', async () => {
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
        args: { grep: 'OrchestrationEventType', verbose: true, strict: true },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('VALID: {tool: discover, verbose: "true", strict: "true"} => coerces stringified booleans from MCP transport', async () => {
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
        args: { grep: 'OrchestrationEventType', verbose: 'true', strict: 'true' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('INVALID: {tool: discover, verbose: "yes"} => rejects non-boolean-shaped string', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'discover' }),
          args: { grep: 'OrchestrationEventType', verbose: 'yes' },
        }),
      ).rejects.toThrow(/Expected boolean/u);
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
    it('VALID: {tool: get-project-map, packages: [shared]} => returns project map text', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-project-map' }),
        args: { packages: ['shared'] },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('INVALID: {tool: get-project-map, args: {}} => throws Required error for packages', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'get-project-map' }),
          args: {},
        }),
      ).rejects.toThrow(/Required/u);
    });

    it('INVALID: {tool: get-project-map, packages: []} => throws min-length error', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'get-project-map' }),
          args: { packages: [] },
        }),
      ).rejects.toThrow(/at least 1 element/u);
    });

    it('INVALID: {tool: get-project-map, packages: [unknown]} => throws Unknown package error', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'get-project-map' }),
          args: { packages: ['shared', 'typo'] },
        }),
      ).rejects.toThrow(/Unknown package\(s\): typo\. Valid: shared/u);
    });
  });

  describe('get-project-inventory', () => {
    it('VALID: {tool: get-project-inventory, packageName} => returns inventory text prefixed by the project-root banner', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-project-inventory' }),
        args: { packageName: 'shared' },
      });

      const text = String(result.content[0]!.text);

      expect(text.split('\n')[0]).toBe(
        "[project-root: /default/cwd — WARNING: could not resolve the caller's own working directory (no matching Claude Code session JSONL within the scan budget); falling back to the MCP server's own startup directory. If the caller is working in a worktree, this result may describe the WRONG tree.]",
      );
    });
  });

  describe('project-root resolution banner', () => {
    it('EDGE: {no meta} => banner reports the server-cwd fallback, by name', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-project-inventory' }),
        args: { packageName: 'shared' },
      });

      const text = String(result.content[0]!.text);

      expect(text.split('\n')[0]).toBe(
        "[project-root: /default/cwd — WARNING: could not resolve the caller's own working directory (no matching Claude Code session JSONL within the scan budget); falling back to the MCP server's own startup directory. If the caller is working in a worktree, this result may describe the WRONG tree.]",
      );
    });

    it('VALID: {meta resolves a caller cwd inside a worktree} => banner names the WORKTREE root, not the server cwd', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupCallerCwdRoot({
        toolUseId: 'toolu_01K6qfGEd8bFzkPvY8nHt1Ts',
        homedir: '/home/tester',
        sessionId: 'aaaaaaaa-1111-4222-9333-444444444444',
        repoRoot: '/repo/worktrees/siegelense',
      });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-project-inventory' }),
        args: { packageName: 'shared' },
        meta: { 'claudecode/toolUseId': 'toolu_01K6qfGEd8bFzkPvY8nHt1Ts' },
      });

      const text = String(result.content[0]!.text);

      expect(text.split('\n')[0]).toBe(
        "[project-root: /repo/worktrees/siegelense — resolved from the caller's own working directory]",
      );
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
