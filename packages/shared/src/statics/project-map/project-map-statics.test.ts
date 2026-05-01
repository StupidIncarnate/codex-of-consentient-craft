import { projectMapStatics } from './project-map-statics';

describe('projectMapStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(projectMapStatics).toStrictEqual({
      defaultFolderDepth: 1,
      depth0: 0,
      depth2: 2,
      header: '# Codebase Map',
      emptyLabel: '(empty)',
      rootPackageName: 'root',
      packagesDirName: 'packages',
      srcDirName: 'src',
      packageJsonName: 'package.json',
      descriptionSeparator: '—',
      excludedFolders: ['guards', 'transformers', 'contracts', 'assets'],
      excludedAuditColumnPadding: 2,
      excludedAuditColumnWidth: 15,
      staticsInlineThreshold: 15,
      testFileSuffixes: [
        '.integration.test.ts',
        '.e2e.test.ts',
        '.test.ts',
        '.test.tsx',
        '.proxy.ts',
        '.proxy.tsx',
        '.stub.ts',
      ],
      symbolLegend: `**Symbol legend** (used throughout this file):

| Symbol | Meaning |
|---|---|
| \`→\` | direct call (one node calls another) |
| \`↳\` | import (one file imports another) |
| \`├─\` \`└─\` | fan-out (one node calls multiple) |
| \`╔═...═╗\` | BOUNDARY box for cross-package effects |
| \`─── ───►\` | data crossing a transport (HTTP, WS, etc.) |
| \`{x?}\` | optional field on a method signature |
| \`{...}\` | signature truncated for brevity |
`,
      urlPairingConvention: `**URL pairing convention** (every http-backend route): the literal path is the same string in both \`webConfigStatics.api.routes.<key>\` (web side) and \`apiRoutesStatics.<group>.<key>\` (server side). For example, both resolve to \`'/api/quests/:questId/start'\`. Every row of the route table below is one such pairing — the route table is exhaustive (every endpoint registered by the server is listed).`,
      hookHandlersMinBinCount: 2,
      sourceFileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
      fsWriteAdapterNames: ['fsAppendFileAdapter', 'fsWriteFileAdapter', 'fsMkdirAdapter'],
      webFetchAdapterMethods: {
        fetchGetAdapter: 'GET',
        fetchPostAdapter: 'POST',
        fetchPatchAdapter: 'PATCH',
        fetchDeleteAdapter: 'DELETE',
        fetchPutAdapter: 'PUT',
      },
      browserStoragePatterns: {
        localStoragePrefix: 'localStorage: ',
        sessionStoragePrefix: 'sessionStorage: ',
        indexedDbPrefix: 'indexedDB: ',
      },
      edgesFooterHeader: '## EDGES',
      edgesFooterPairedLabel: 'HTTP edges (paired)',
      edgesFooterOrphanLabel: 'HTTP edges (orphan)',
      pointerFooter:
        '> Call `get-project-inventory({ packageName })` for the per-package folder/file detail.',
    });
  });
});
