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
      fileName: 'adapters.ts',
      exportPaths: ['./src/adapters/hono/app-create/hono-app-create-adapter'],
    },
    dependencies: {
      hono: '^4.0.0',
    },
    bin: {},
    compilerOptions: {},
    extraInclude: [],
    buildRootDir: null,
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: false,
    files: [
      {
        path: 'src/adapters/hono/app-create/hono-app-create-adapter.ts',
        contents: `/**
 * PURPOSE: Starting point for this package's Hono app — replace with real route registrations
 * once you have handlers to mount.
 *
 * USAGE:
 * const app = honoAppCreateAdapter();
 * // Returns a fresh Hono instance
 */

import { Hono } from 'hono';

export const honoAppCreateAdapter = (): Hono => new Hono();
`,
      },
      {
        path: 'src/adapters/hono/app-create/hono-app-create-adapter.proxy.ts',
        contents: `export const honoAppCreateAdapterProxy = (): Record<PropertyKey, never> => ({});
`,
      },
      {
        path: 'src/adapters/hono/app-create/hono-app-create-adapter.test.ts',
        contents: `import { honoAppCreateAdapter } from './hono-app-create-adapter';
import { honoAppCreateAdapterProxy } from './hono-app-create-adapter.proxy';

describe('honoAppCreateAdapter', () => {
  it('VALID: {} => returns a fresh Hono app with no routes registered', () => {
    honoAppCreateAdapterProxy();

    const app = honoAppCreateAdapter();

    expect(app.routes).toStrictEqual([]);
  });
});
`,
      },
    ],
  },
  'mcp-server': {
    barrel: {
      fileName: 'flows.ts',
      exportPaths: ['./src/flows/__NAME__/__NAME__-flow'],
    },
    dependencies: {
      '__SCOPE__/shared': '*',
    },
    bin: {},
    compilerOptions: {},
    extraInclude: [],
    buildRootDir: null,
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: false,
    files: [
      {
        path: 'src/contracts/tool-registration/tool-registration-contract.ts',
        contents: `/**
 * PURPOSE: Starting point for this package's MCP tool-registration shape — replace with the real
 * fields your tools need once you have some to register.
 *
 * USAGE:
 * const registration = toolRegistrationContract.parse({ name: 'my-tool', description: 'does x' });
 * // Returns validated ToolRegistration with branded fields
 */

import { z } from 'zod';

export const toolRegistrationContract = z.object({
  name: z.string().min(1).brand<'ToolRegistrationName'>(),
  description: z.string().brand<'ToolRegistrationDescription'>(),
});

export type ToolRegistration = z.infer<typeof toolRegistrationContract>;
`,
      },
      {
        path: 'src/contracts/tool-registration/tool-registration.stub.ts',
        contents: `import { toolRegistrationContract } from './tool-registration-contract';
import type { ToolRegistration } from './tool-registration-contract';
import type { StubArgument } from '__SCOPE__/shared/@types';

export const ToolRegistrationStub = (
  { ...props }: StubArgument<ToolRegistration> = {},
): ToolRegistration =>
  toolRegistrationContract.parse({
    name: 'example-tool',
    description: 'Starting point tool registration - replace with a real tool.',
    ...props,
  });
`,
      },
      {
        path: 'src/contracts/tool-registration/tool-registration-contract.test.ts',
        contents: `import { toolRegistrationContract } from './tool-registration-contract';
import { ToolRegistrationStub } from './tool-registration.stub';

describe('toolRegistrationContract', () => {
  it('VALID: {name: "my-tool", description: "does x"} => parses successfully', () => {
    const result = toolRegistrationContract.parse({ name: 'my-tool', description: 'does x' });

    expect(result).toStrictEqual({ name: 'my-tool', description: 'does x' });
  });

  it('INVALID: {name: ""} => throws', () => {
    expect(() =>
      toolRegistrationContract.parse({ name: '', description: 'does x' }),
    ).toThrow(/at least 1 character/u);
  });
});

describe('ToolRegistrationStub', () => {
  it('VALID: {} => returns default stub', () => {
    const result = ToolRegistrationStub();

    expect(result).toStrictEqual({
      name: 'example-tool',
      description: 'Starting point tool registration - replace with a real tool.',
    });
  });
});
`,
      },
      {
        path: 'src/flows/__NAME__/__NAME__-flow.ts',
        contents: `/**
 * PURPOSE: Starting point for this package's MCP tool registrations — replace with the real tools
 * this server exposes once you have some.
 *
 * USAGE:
 * const registrations = __CAMEL__Flow();
 * // Returns the array of ToolRegistration entries this package serves
 */

import { toolRegistrationContract } from '../../contracts/tool-registration/tool-registration-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';

export const __PASCAL__Flow = (): readonly ToolRegistration[] => [
  toolRegistrationContract.parse({
    name: 'example-tool',
    description: 'Starting point tool registration - replace with a real tool.',
  }),
];
`,
      },
      {
        path: 'src/flows/__NAME__/__NAME__-flow.integration.test.ts',
        contents: `import { __PASCAL__Flow } from './__NAME__-flow';

describe('__PASCAL__Flow', () => {
  it('VALID: {} => returns one example tool registration', () => {
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
    dependencies: {},
    bin: {
      __NAME__: './dist/bin/__NAME__-entry.js',
    },
    compilerOptions: {},
    extraInclude: ['bin/**/*'],
    buildRootDir: null,
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: true,
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

import { Start__PASCAL__ } from '../src/startup/start-__NAME__';

const COMMAND_ARG_START_INDEX = 2;

if (require.main === module) {
  const [command] = process.argv.slice(COMMAND_ARG_START_INDEX);

  Start__PASCAL__({ command }).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write('Error: ' + errorMessage + '\\n');
    process.exit(1);
  });
}
`,
      },
      {
        path: 'src/startup/start-__NAME__.ts',
        contents: `/**
 * PURPOSE: Starting point CLI startup — replace with real command dispatch once you have commands
 * to route.
 *
 * USAGE:
 * const result = await Start__PASCAL__({ command: 'hello' });
 * // Writes a line naming the command and resolves { handled: true }
 */

export const Start__PASCAL__ = ({
  command,
}: {
  command: string | undefined;
}): Promise<{ handled: boolean }> => {
  process.stdout.write('Running command: ' + String(command) + '\\n');

  return Promise.resolve({ handled: true });
};
`,
      },
      {
        path: 'src/startup/start-__NAME__.integration.test.ts',
        contents: `import { Start__PASCAL__ } from './start-__NAME__';

describe('Start__PASCAL__', () => {
  it('VALID: {command: "hello"} => writes the command name to stdout and resolves handled true', async () => {
    const originalWrite = process.stdout.write;
    let captured = '';

    Object.assign(process.stdout, {
      write: (chunk: string): boolean => {
        captured += chunk;
        return true;
      },
    });

    const result = await Start__PASCAL__({ command: 'hello' });

    Object.assign(process.stdout, { write: originalWrite });

    expect(captured).toBe('Running command: hello\\n');
    expect(result).toStrictEqual({ handled: true });
  });
});
`,
      },
    ],
  },
} as const;
