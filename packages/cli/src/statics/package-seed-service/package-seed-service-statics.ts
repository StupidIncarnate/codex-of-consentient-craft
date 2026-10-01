/**
 * PURPOSE: The three seeds `dungeonmaster create-package` writes for the SERVICE package types —
 * `http-backend`, `mcp-server`, `cli-tool`. Reach for `packageSeedPlainStatics` /
 * `packageSeedFrontendStatics` for every other package type; this file owns only the types whose
 * entry point boots a server, registers MCP tools, or ships a CLI bin.
 *
 * USAGE:
 * packageSeedServiceStatics['http-backend'].files;
 * // Returns the ordered list of {path, contents} entries create-package writes for that type
 */

export const packageSeedServiceStatics = {
  'http-backend': {
    barrel: {
      fileName: 'flows.ts',
      exportPaths: ['./__NAME__/__NAME__-flow'],
    },
    // `hono` is declared, never imported, and the seed carries no contract: `#gateway/npm/hono`
    // exists only once the npm-gateway sync runs after this scaffold (the next `npm install`), the
    // package declares no `zod`, and a consumer has no `shared` package, so a seed reaching for any
    // of them fails install, lint or typecheck on a fresh scaffold. The detector reads the declared dependency beside the flows folder instead.
    dependencies: {
      hono: '^4.0.0',
    },
    devDependencies: {},
    bin: {},
    compilerOptions: {},
    extraInclude: [],
    buildRootDir: null,
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: false,
    needsMswTransform: false,
    files: [
      {
        path: 'src/statics/route/route-statics.ts',
        contents: `/**
 * PURPOSE: Starting point for this package's HTTP route table — replace with the real routes this
 * service serves.
 *
 * USAGE:
 * routeStatics.routes[0].path;
 * // Returns '/health'
 */

export const routeStatics = {
  routes: [{ method: 'GET', path: '/health' }],
} as const;
`,
      },
      {
        path: 'src/statics/route/route-statics.test.ts',
        contents: `import { routeStatics } from './route-statics';

describe('routeStatics', () => {
  it('VALID: {} => holds the health route', () => {
    expect(routeStatics).toStrictEqual({ routes: [{ method: 'GET', path: '/health' }] });
  });
});
`,
      },
      {
        path: 'src/flows/__NAME__/__NAME__-flow.ts',
        contents: `/**
 * PURPOSE: Starting point for this package's HTTP routes — replace with the real routes this
 * service serves. Mount them on a Hono app from a responder through \`#gateway/npm/hono\`: once
 * \`npm install\` has run, \`dungeonmaster gateway-sync\` has given the declared \`hono\`
 * dependency its packages/@gateway/npm/src/hono/ folder.
 *
 * USAGE:
 * const routes = __CAMEL__Flow();
 * // Returns the route table this package serves
 */

import { routeStatics } from '../../statics/route/route-statics';

export const __PASCAL__Flow = (): typeof routeStatics.routes => routeStatics.routes;
`,
      },
      {
        path: 'src/flows/__NAME__/__NAME__-flow.integration.test.ts',
        contents: `import { __PASCAL__Flow } from './__NAME__-flow';

describe('__PASCAL__Flow', () => {
  it('VALID: {} => returns the health route', () => {
    const result = __PASCAL__Flow();

    expect(result).toStrictEqual([{ method: 'GET', path: '/health' }]);
  });
});
`,
      },
    ],
  },
  'mcp-server': {
    barrel: {
      fileName: 'flows.ts',
      exportPaths: ['./__NAME__/__NAME__-flow'],
    },
    // The MCP SDK is declared, never imported, and the seed carries no contract: its
    // `#gateway/npm` wrapper exists only once the npm-gateway sync runs after this scaffold (the
    // next `npm install`), the package declares no `zod`, and a consumer has no `shared` package, so
    // a seed reaching for any of them fails install, lint or typecheck on a fresh scaffold. The detector reads the declared dependency
    // beside the flows folder instead.
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
    },
    devDependencies: {},
    bin: {},
    compilerOptions: {},
    extraInclude: [],
    buildRootDir: null,
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: false,
    needsMswTransform: true,
    files: [
      {
        path: 'src/statics/tool/tool-statics.ts',
        contents: `/**
 * PURPOSE: Starting point for this package's MCP tool table — replace with the real tools this
 * server exposes.
 *
 * USAGE:
 * toolStatics.tools[0].name;
 * // Returns 'example-tool'
 */

export const toolStatics = {
  tools: [
    {
      name: 'example-tool',
      description: 'Starting point tool registration - replace with a real tool.',
    },
  ],
} as const;
`,
      },
      {
        path: 'src/statics/tool/tool-statics.test.ts',
        contents: `import { toolStatics } from './tool-statics';

describe('toolStatics', () => {
  it('VALID: {} => holds the example tool', () => {
    expect(toolStatics).toStrictEqual({
      tools: [
        {
          name: 'example-tool',
          description: 'Starting point tool registration - replace with a real tool.',
        },
      ],
    });
  });
});
`,
      },
      {
        path: 'src/flows/__NAME__/__NAME__-flow.ts',
        contents: `/**
 * PURPOSE: Starting point for this package's MCP tools — replace with the real tools this server
 * exposes. Register them on an MCP server from a responder through the \`#gateway/npm\` wrapper
 * for \`@modelcontextprotocol/sdk\`: once \`npm install\` has run, \`dungeonmaster gateway-sync\` has
 * given the declared SDK its folder under packages/@gateway/npm/src/.
 *
 * USAGE:
 * const tools = __CAMEL__Flow();
 * // Returns the tool table this package serves
 */

import { toolStatics } from '../../statics/tool/tool-statics';

export const __PASCAL__Flow = (): typeof toolStatics.tools => toolStatics.tools;
`,
      },
      {
        path: 'src/flows/__NAME__/__NAME__-flow.integration.test.ts',
        contents: `import { __PASCAL__Flow } from './__NAME__-flow';

describe('__PASCAL__Flow', () => {
  it('VALID: {} => returns the example tool', () => {
    const result = __PASCAL__Flow();

    expect(result).toStrictEqual([
      { name: 'example-tool', description: 'Starting point tool registration - replace with a real tool.' },
    ]);
  });
});
`,
      },
    ],
  },
  'cli-tool': {
    barrel: null,
    // The bin entry reads argv and writes stderr through the node gateway (`#gateway/node/process`),
    // and `gateway-dependency-declared` requires the importing package.json to list it.
    dependencies: {
      '__SCOPE__/node': '*',
    },
    devDependencies: {},
    bin: {
      __NAME__: './dist/bin/__NAME__-entry.js',
    },
    compilerOptions: {},
    extraInclude: ['bin/**/*'],
    buildRootDir: null,
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: true,
    needsMswTransform: true,
    files: [
      {
        path: 'bin/__NAME__-entry.ts',
        contents: `#!/usr/bin/env node

/**
 * PURPOSE: Starting point CLI entry point — replace with real command routing once you have
 * commands to dispatch.
 *
 * USAGE:
 * node dist/bin/__NAME__-entry.js hello
 * // Runs Start__PASCAL__({ command: 'hello' })
 */

import { argv, exit, stderr } from '#gateway/node/process';
import { Start__PASCAL__ } from '../src/startup/start-__NAME__';

const COMMAND_ARG_START_INDEX = 2;

if (require.main === module) {
  const [command] = argv.slice(COMMAND_ARG_START_INDEX);

  Start__PASCAL__({ command }).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    stderr.write('Error: ' + errorMessage + '\\n');
    exit(1);
  });
}
`,
      },
      {
        path: 'src/startup/start-__NAME__.ts',
        contents: `/**
 * PURPOSE: Starting point CLI startup — replace with real command dispatch once you have commands
 * to route. It reports whether a command was given and touches no platform global.
 *
 * USAGE:
 * const result = await Start__PASCAL__({ command: 'hello' });
 * // Resolves { handled: true }
 */

export const Start__PASCAL__ = ({
  command,
}: {
  command: string | undefined;
}): Promise<{ handled: boolean }> => Promise.resolve({ handled: command !== undefined });
`,
      },
      {
        path: 'src/startup/start-__NAME__.integration.test.ts',
        contents: `import { Start__PASCAL__ } from './start-__NAME__';

describe('Start__PASCAL__', () => {
  it('VALID: {command: "hello"} => resolves handled true', async () => {
    const result = await Start__PASCAL__({ command: 'hello' });

    expect(result).toStrictEqual({ handled: true });
  });

  it('EMPTY: {command: undefined} => resolves handled false', async () => {
    const result = await Start__PASCAL__({ command: undefined });

    expect(result).toStrictEqual({ handled: false });
  });
});
`,
      },
    ],
  },
} as const;
