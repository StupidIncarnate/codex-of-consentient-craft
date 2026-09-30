import { TextContentSchema } from '#gateway/npm/modelcontextprotocol__sdk__types';
import { projectMapStatics } from '@dungeonmaster/shared/statics';
import { ArchitectureHandleResponderProxy } from './architecture-handle-responder.proxy';

describe('ArchitectureHandleResponder', () => {
  describe('discover', () => {
    it('VALID: {tool: discover, glob pattern} => returns JSON-stringified discover result', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupFileDiscovery({
        filepath:
          'packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts',
        contents: 'export const ArchitectureHandleResponder = () => {};',
        pattern: 'packages/mcp/src/responders/**',
      });

      const result = await proxy.callResponder({
        tool: 'discover',
        args: { glob: 'packages/mcp/src/responders/**' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: TextContentSchema.parse(result.content[0]).text }],
      });
    });

    it('VALID: {tool: discover, verbose: true, strict: true} => accepts JSON booleans without coercion', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupFileDiscovery({
        filepath:
          'packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts',
        contents: 'export const ArchitectureHandleResponder = () => {};',
        pattern: 'packages/mcp/src/responders/**',
      });

      const result = await proxy.callResponder({
        tool: 'discover',
        args: {
          glob: 'packages/mcp/src/responders/**',
          grep: 'OrchestrationEventType',
          verbose: true,
          strict: true,
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: TextContentSchema.parse(result.content[0]).text }],
      });
    });

    it('VALID: {tool: discover, verbose: "true", strict: "true"} => coerces stringified booleans from MCP transport', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupFileDiscovery({
        filepath:
          'packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts',
        contents: 'export const ArchitectureHandleResponder = () => {};',
        pattern: 'packages/mcp/src/responders/**',
      });

      const result = await proxy.callResponder({
        tool: 'discover',
        args: {
          glob: 'packages/mcp/src/responders/**',
          grep: 'OrchestrationEventType',
          verbose: 'true',
          strict: 'true',
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: TextContentSchema.parse(result.content[0]).text }],
      });
    });

    it('INVALID: {tool: discover, verbose: "yes"} => rejects non-boolean-shaped string', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: 'discover',
          args: { grep: 'OrchestrationEventType', verbose: 'yes' },
        }),
      ).rejects.toThrow(/expected boolean/u);
    });
  });

  describe('get-architecture', () => {
    it('VALID: {tool: get-architecture} => returns architecture overview text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: 'get-architecture',
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: TextContentSchema.parse(result.content[0]).text }],
      });
    });
  });

  describe('get-testing-patterns', () => {
    it('VALID: {tool: get-testing-patterns} => returns testing patterns text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: 'get-testing-patterns',
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: TextContentSchema.parse(result.content[0]).text }],
      });
    });
  });

  describe('get-folder-detail', () => {
    it('VALID: {tool: get-folder-detail, folderType: brokers} => returns folder detail text', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: 'get-folder-detail',
        args: { folderType: 'brokers' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: TextContentSchema.parse(result.content[0]).text }],
      });
    });

    it('VALID: {tool: get-folder-detail, folderType with supplemental constraints} => includes constraints in result', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupFolderConstraint({
        folderType: 'brokers',
        content: 'Supplemental constraint content',
      });

      const result = await proxy.callResponder({
        tool: 'get-folder-detail',
        args: { folderType: 'brokers' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: TextContentSchema.parse(result.content[0]).text }],
      });
    });

    it('INVALID: {tool: get-folder-detail, unknown key} => throws Unrecognized key error', async () => {
      const proxy = ArchitectureHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: 'get-folder-detail',
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
        tool: 'get-project-map',
        args: { packages: ['shared'] },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: TextContentSchema.parse(result.content[0]).text }],
      });
    });

    it('INVALID: {tool: get-project-map, args: {}} => throws Required error for packages', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      await expect(
        proxy.callResponder({
          tool: 'get-project-map',
          args: {},
        }),
      ).rejects.toThrow(/received undefined/u);
    });

    it('INVALID: {tool: get-project-map, packages: []} => throws min-length error', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      await expect(
        proxy.callResponder({
          tool: 'get-project-map',
          args: { packages: [] },
        }),
      ).rejects.toThrow(/Too small: expected array to have >=1 items/u);
    });

    it('INVALID: {tool: get-project-map, packages: [unknown]} => throws Unknown package error', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupLibraryPackage({ packageName: 'shared' });

      await expect(
        proxy.callResponder({
          tool: 'get-project-map',
          args: { packages: ['shared', 'typo'] },
        }),
      ).rejects.toThrow(/Unknown package\(s\): typo\. Valid: shared/u);
    });
  });

  describe('get-project-inventory', () => {
    it('VALID: {tool: get-project-inventory, packageName} => returns inventory text prefixed by the project-root banner', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupDirectPackage({ packageName: 'shared' });

      const result = await proxy.callResponder({
        tool: 'get-project-inventory',
        args: { packageName: 'shared' },
      });

      const { text } = TextContentSchema.parse(result.content[0]);

      expect(text.split('\n')[0]).toBe(
        "[project-root: /default/cwd — WARNING: the MCP call carried no caller context from the dungeonmaster-pre-mcp-caller hook (run `dungeonmaster init` to install it); falling back to the MCP server's own startup directory. If the caller is working in a worktree, this result may describe the WRONG tree.]",
      );
    });

    it('VALID: {packageName: npm, packages/@gateway/npm on disk, no packages/npm} => resolves the gateway package by its bare name and renders its inventory header', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupGatewayGroupPackage({ groupName: '@gateway', packageName: 'npm' });

      const result = await proxy.callResponder({
        tool: 'get-project-inventory',
        args: { packageName: 'npm' },
      });

      const lines = TextContentSchema.parse(result.content[0]).text.split('\n');

      expect(lines.slice(2)).toStrictEqual([
        '## npm (0 files)',
        `  ${projectMapStatics.emptyLabel}`,
      ]);
    });

    it('VALID: {packageName: #gateway} => renders the grouped body, never the "(0 files) (empty)" @gateway bug', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupGatewaySubpath({
        folder: 'node',
        subpathName: 'fs',
        barrelContent: [
          "export * from 'fs';",
          "export { existsSync } from './exists-sync/exists-sync';",
        ].join('\n'),
      });

      const result = await proxy.callResponder({
        tool: 'get-project-inventory',
        args: { packageName: '#gateway' },
      });

      const lines = TextContentSchema.parse(result.content[0]).text.split('\n');

      expect(lines[2]).toBe(
        '## #gateway — outside packages, Node, the browser and installed programs, reached only through here',
      );
      expect(lines.some((l) => l === "  #gateway/node/fs  passes through 'fs'")).toBe(true);
      expect(lines.some((l) => l === '      ours: existsSync')).toBe(true);
    });
  });

  describe('project-root resolution banner', () => {
    it('EDGE: {no meta} => banner reports the server-cwd fallback, by name', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      proxy.setupDirectPackage({ packageName: 'shared' });

      const result = await proxy.callResponder({
        tool: 'get-project-inventory',
        args: { packageName: 'shared' },
      });

      const { text } = TextContentSchema.parse(result.content[0]);

      expect(text.split('\n')[0]).toBe(
        "[project-root: /default/cwd — WARNING: the MCP call carried no caller context from the dungeonmaster-pre-mcp-caller hook (run `dungeonmaster init` to install it); falling back to the MCP server's own startup directory. If the caller is working in a worktree, this result may describe the WRONG tree.]",
      );
    });

    it('VALID: {meta resolves a caller cwd inside a worktree} => banner names the WORKTREE root, not the server cwd', async () => {
      const proxy = ArchitectureHandleResponderProxy();
      const repoRoot = '/repo/worktrees/siegelense';
      proxy.setupCallerCwdRoot({ repoRoot });
      proxy.setupDirectPackage({ packageName: 'shared', repoRoot });

      const result = await proxy.callResponder({
        tool: 'get-project-inventory',
        args: { packageName: 'shared' },
        meta: {
          'dungeonmaster/caller': {
            cwd: repoRoot,
            sessionId: 'aaaaaaaa-1111-4222-9333-444444444444',
          },
        },
      });

      const { text } = TextContentSchema.parse(result.content[0]);

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
          tool: 'unknown-tool',
          args: {},
        }),
      ).rejects.toThrow(/Unknown architecture tool/u);
    });
  });
});
