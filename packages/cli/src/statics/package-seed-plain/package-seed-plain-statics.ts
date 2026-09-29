/**
 * PURPOSE: Seed source-file templates `create-package` writes for the "plain" package types —
 * library, programmatic-service, eslint-plugin, hook-handlers. Every `\``, `${`, and `\n` inside a
 * `files[].contents` body is escaped (`\\\``, `\\${`, `\\n`) so it survives into the written file
 * instead of being evaluated while this statics file itself is parsed.
 *
 * USAGE:
 * packageSeedPlainStatics.library.files[0].contents;
 * // Returns the __NAME__-statics.ts template body
 */

export const packageSeedPlainStatics = {
  library: {
    barrel: {
      fileName: 'statics.ts',
      exportPaths: ['./__NAME__/__NAME__-statics'],
    },
    dependencies: {},
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
        path: 'src/statics/__NAME__/__NAME__-statics.ts',
        contents: `/**
 * PURPOSE: Starting point for this package's statics — replace with real config values as the
 * package grows.
 *
 * USAGE:
 * __CAMEL__Statics.packageName;
 */

export const __CAMEL__Statics = {
  packageName: '__NAME__',
} as const;
`,
      },
      {
        path: 'src/statics/__NAME__/__NAME__-statics.test.ts',
        contents: `import { __CAMEL__Statics } from './__NAME__-statics';

describe('__CAMEL__Statics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(__CAMEL__Statics).toStrictEqual({
      packageName: '__NAME__',
    });
  });
});
`,
      },
    ],
  },

  'programmatic-service': {
    barrel: {
      fileName: 'flows.ts',
      exportPaths: ['./__NAME__/__NAME__-flow'],
    },
    dependencies: {},
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
        path: 'src/state/__NAME__/__NAME__-state.ts',
        contents: `/**
 * PURPOSE: Starting point for this package's in-memory state — replace with real storage as the
 * package grows. It holds one boolean flag because a keyed store needs a branded key type, and a
 * consumer has no shared contracts package: write the contracts this state needs, then key it.
 *
 * USAGE:
 * __CAMEL__State.markRan();
 * __CAMEL__State.hasRan();
 * // Returns true
 */

const __TESTID___FLAGS = { ran: false };

export const __CAMEL__State = {
  markRan: (): void => {
    __TESTID___FLAGS.ran = true;
  },
  hasRan: (): boolean => __TESTID___FLAGS.ran,
  clear: (): void => {
    __TESTID___FLAGS.ran = false;
  },
};
`,
      },
      {
        path: 'src/state/__NAME__/__NAME__-state.proxy.ts',
        contents: `/**
 * PURPOSE: Starting point test proxy for __CAMEL__State — replace with real mocks as the package
 * grows. Clears the module-level flag directly, with no workspace testing import, so each test
 * starts from empty.
 *
 * USAGE:
 * const proxy = __CAMEL__StateProxy();
 * proxy.setupEmpty();
 */

import { __CAMEL__State } from './__NAME__-state';

export const __CAMEL__StateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    __CAMEL__State.clear();
  },
});
`,
      },
      {
        path: 'src/state/__NAME__/__NAME__-state.test.ts',
        contents: `import { __CAMEL__State } from './__NAME__-state';
import { __CAMEL__StateProxy } from './__NAME__-state.proxy';

describe('__CAMEL__State', () => {
  it('VALID: {markRan called} => hasRan returns true', () => {
    const proxy = __CAMEL__StateProxy();
    proxy.setupEmpty();

    __CAMEL__State.markRan();

    expect(__CAMEL__State.hasRan()).toBe(true);
  });

  it('EMPTY: {nothing marked} => hasRan returns false', () => {
    const proxy = __CAMEL__StateProxy();
    proxy.setupEmpty();

    expect(__CAMEL__State.hasRan()).toBe(false);
  });
});
`,
      },
      {
        path: 'src/responders/__NAME__/run/__NAME__-run-responder.ts',
        contents: `/**
 * PURPOSE: Starting point run responder — replace with real orchestration as the package grows.
 * It reports whether it was handed any input and touches no platform global, so a consumer's lint
 * passes on the fresh scaffold.
 *
 * USAGE:
 * await __PASCAL__RunResponder({ input: 'example' });
 * // Returns { handled: true }
 */

export const __PASCAL__RunResponder = ({
  input,
}: {
  input: string;
}): Promise<{ handled: boolean }> => Promise.resolve({ handled: input.length > 0 });
`,
      },
      {
        path: 'src/responders/__NAME__/run/__NAME__-run-responder.proxy.ts',
        contents: `/**
 * PURPOSE: Starting point empty proxy for __PASCAL__RunResponder — replace with real mocks as the
 * package grows.
 *
 * USAGE:
 * const proxy = __PASCAL__RunResponderProxy();
 */

export const __PASCAL__RunResponderProxy = (): Record<PropertyKey, never> => ({});
`,
      },
      {
        path: 'src/responders/__NAME__/run/__NAME__-run-responder.test.ts',
        contents: `import { __PASCAL__RunResponder } from './__NAME__-run-responder';
import { __PASCAL__RunResponderProxy } from './__NAME__-run-responder.proxy';

describe('__PASCAL__RunResponder', () => {
  it('VALID: {input: "example"} => resolves handled true', async () => {
    __PASCAL__RunResponderProxy();

    const result = await __PASCAL__RunResponder({ input: 'example' });

    expect(result).toStrictEqual({ handled: true });
  });

  it('EMPTY: {input: ""} => resolves handled false', async () => {
    __PASCAL__RunResponderProxy();

    const result = await __PASCAL__RunResponder({ input: '' });

    expect(result).toStrictEqual({ handled: false });
  });
});
`,
      },
      {
        path: 'src/flows/__NAME__/__NAME__-flow.ts',
        contents: `/**
 * PURPOSE: Starting point flow wiring the run responder — replace with real orchestration as the
 * package grows. Flows hold no logic of their own.
 *
 * USAGE:
 * await __PASCAL__Flow({ input: 'example' });
 */

import { __PASCAL__RunResponder } from '../../responders/__NAME__/run/__NAME__-run-responder';

export const __PASCAL__Flow = ({
  input,
}: {
  input: string;
}): Promise<{ handled: boolean }> => __PASCAL__RunResponder({ input });
`,
      },
      {
        path: 'src/flows/__NAME__/__NAME__-flow.integration.test.ts',
        contents: `import { __PASCAL__Flow } from './__NAME__-flow';

describe('__PASCAL__Flow', () => {
  it('VALID: {input: "example"} => resolves handled true', async () => {
    const result = await __PASCAL__Flow({ input: 'example' });

    expect(result).toStrictEqual({ handled: true });
  });
});
`,
      },
      {
        path: 'src/startup/start-__NAME__.ts',
        contents: `/**
 * PURPOSE: Starting point startup entry delegating to the flow — replace with real bootstrapping
 * as the package grows.
 *
 * USAGE:
 * await Start__PASCAL__.run({ input: 'example' });
 * // Returns { handled: true }
 */

import { __PASCAL__Flow } from '../flows/__NAME__/__NAME__-flow';

export const Start__PASCAL__ = {
  run: async ({ input }: { input: string }): Promise<{ handled: boolean }> => {
    const result = await __PASCAL__Flow({ input });
    return result;
  },
};
`,
      },
      {
        path: 'src/startup/start-__NAME__.integration.test.ts',
        contents: `import { Start__PASCAL__ } from './start-__NAME__';

describe('Start__PASCAL__', () => {
  it('VALID: {input: "example"} => resolves handled true', async () => {
    const result = await Start__PASCAL__.run({ input: 'example' });

    expect(result).toStrictEqual({ handled: true });
  });
});
`,
      },
    ],
  },

  'eslint-plugin': {
    barrel: null,
    dependencies: {},
    devDependencies: {},
    bin: {},
    compilerOptions: {},
    extraInclude: [],
    buildRootDir: './src',
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: true,
    needsMswTransform: false,
    files: [
      {
        path: 'src/brokers/rule/__NAME__/rule-__NAME__-broker.ts',
        contents: `/**
 * PURPOSE: Starting point ESLint rule — replace with a real rule implementation as the package
 * grows.
 *
 * USAGE:
 * rule__PASCAL__Broker().meta;
 */

const RULE_TYPE = 'problem';
const RULE_MESSAGES = { default: 'Replace this starting-point rule with a real one.' } as const;

export const rule__PASCAL__Broker = (): {
  meta: { type: 'problem'; messages: typeof RULE_MESSAGES };
  create: () => Record<PropertyKey, never>;
} => ({
  meta: {
    type: RULE_TYPE,
    messages: RULE_MESSAGES,
  },
  create: (): Record<PropertyKey, never> => ({}),
});
`,
      },
      {
        path: 'src/brokers/rule/__NAME__/rule-__NAME__-broker.proxy.ts',
        contents: `/**
 * PURPOSE: Starting point empty proxy for rule__PASCAL__Broker — replace with real mocks as the
 * package grows.
 *
 * USAGE:
 * const proxy = rule__PASCAL__BrokerProxy();
 */

export const rule__PASCAL__BrokerProxy = (): Record<PropertyKey, never> => ({});
`,
      },
      {
        path: 'src/brokers/rule/__NAME__/rule-__NAME__-broker.test.ts',
        contents: `import { rule__PASCAL__Broker } from './rule-__NAME__-broker';
import { rule__PASCAL__BrokerProxy } from './rule-__NAME__-broker.proxy';

describe('rule__PASCAL__Broker', () => {
  it('VALID: {} => returns the starting-point rule meta', () => {
    rule__PASCAL__BrokerProxy();

    expect(rule__PASCAL__Broker().meta).toStrictEqual({
      type: 'problem',
      messages: { default: 'Replace this starting-point rule with a real one.' },
    });
  });
});
`,
      },
      {
        path: 'src/responders/config/create/config-create-responder.ts',
        contents: `/**
 * PURPOSE: Starting point ESLint plugin rules map — replace with real rules as the package grows.
 *
 * USAGE:
 * ConfigCreateResponder().rules;
 */

import { rule__PASCAL__Broker } from '../../../brokers/rule/__NAME__/rule-__NAME__-broker';

export const ConfigCreateResponder = (): {
  rules: { '__NAME__': ReturnType<typeof rule__PASCAL__Broker> };
} => ({
  rules: {
    '__NAME__': rule__PASCAL__Broker(),
  },
});
`,
      },
      {
        path: 'src/responders/config/create/config-create-responder.proxy.ts',
        contents: `/**
 * PURPOSE: Starting point proxy for ConfigCreateResponder — creates the child rule broker proxy so
 * enforce-proxy-child-creation is satisfied; replace with real mocks as the package grows.
 *
 * USAGE:
 * const proxy = ConfigCreateResponderProxy();
 */

import { rule__PASCAL__BrokerProxy } from '../../../brokers/rule/__NAME__/rule-__NAME__-broker.proxy';

export const ConfigCreateResponderProxy = (): Record<PropertyKey, never> => {
  rule__PASCAL__BrokerProxy();
  return {};
};
`,
      },
      {
        path: 'src/responders/config/create/config-create-responder.test.ts',
        contents: `import { ConfigCreateResponder } from './config-create-responder';
import { ConfigCreateResponderProxy } from './config-create-responder.proxy';
import { rule__PASCAL__Broker } from '../../../brokers/rule/__NAME__/rule-__NAME__-broker';

describe('ConfigCreateResponder', () => {
  it('VALID: {} => returns the rules map keyed by "__NAME__" carrying the broker meta and a create function', () => {
    ConfigCreateResponderProxy();

    const { '__NAME__': rule } = ConfigCreateResponder().rules;

    expect(rule.meta).toStrictEqual(rule__PASCAL__Broker().meta);
    expect(Object.prototype.hasOwnProperty.call(rule, 'create')).toBe(true);
  });
});
`,
      },
      {
        path: 'src/index.ts',
        contents: `/**
 * PURPOSE: Starting point public entry re-exporting the plugin's responder — replace with real
 * exports as the package grows.
 *
 * USAGE:
 * import { ConfigCreateResponder } from '__NAME__';
 */

export { ConfigCreateResponder } from './responders/config/create/config-create-responder';
`,
      },
      {
        path: 'src/index.test.ts',
        contents: `import { ConfigCreateResponder } from './index';
import { ConfigCreateResponder as ConfigCreateResponderDirect } from './responders/config/create/config-create-responder';

describe('index', () => {
  it('VALID: re-exported ConfigCreateResponder => is the same function as the direct import', () => {
    expect(ConfigCreateResponder).toBe(ConfigCreateResponderDirect);
  });
});
`,
      },
    ],
  },

  'hook-handlers': {
    barrel: null,
    // The bin entries read argv and write stderr through the node gateway (`#gateway/node/process`),
    // and `gateway-dependency-declared` requires the importing package.json to list it.
    dependencies: { '__SCOPE__/node': '*' },
    devDependencies: {},
    bin: {
      '__NAME__-pre-tool-use': './dist/bin/__NAME__-pre-tool-use.js',
      '__NAME__-session-start': './dist/bin/__NAME__-session-start.js',
    },
    compilerOptions: {},
    extraInclude: ['bin/**/*'],
    buildRootDir: null,
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: false,
    needsMswTransform: false,
    files: [
      {
        path: 'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.ts',
        contents: `/**
 * PURPOSE: Starting point pre-tool-use hook responder — replace with real hook logic as the
 * package grows. It reports whether it was handed a payload and touches no platform global, so a
 * consumer's lint passes on the fresh scaffold.
 *
 * USAGE:
 * await HookPreToolUseResponder({ payload: '{}' });
 * // Returns { handled: true }
 */

export const HookPreToolUseResponder = ({
  payload,
}: {
  payload: string;
}): Promise<{ handled: boolean }> => Promise.resolve({ handled: payload.length > 0 });
`,
      },
      {
        path: 'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.proxy.ts',
        contents: `/**
 * PURPOSE: Starting point empty proxy for HookPreToolUseResponder — replace with real mocks as the
 * package grows.
 *
 * USAGE:
 * const proxy = HookPreToolUseResponderProxy();
 */

export const HookPreToolUseResponderProxy = (): Record<PropertyKey, never> => ({});
`,
      },
      {
        path: 'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.test.ts',
        contents: `import { HookPreToolUseResponder } from './hook-pre-tool-use-responder';
import { HookPreToolUseResponderProxy } from './hook-pre-tool-use-responder.proxy';

describe('HookPreToolUseResponder', () => {
  it('VALID: {payload: "{}"} => resolves handled true', async () => {
    HookPreToolUseResponderProxy();

    const result = await HookPreToolUseResponder({ payload: '{}' });

    expect(result).toStrictEqual({ handled: true });
  });

  it('EMPTY: {payload: ""} => resolves handled false', async () => {
    HookPreToolUseResponderProxy();

    const result = await HookPreToolUseResponder({ payload: '' });

    expect(result).toStrictEqual({ handled: false });
  });
});
`,
      },
      {
        path: 'bin/__NAME__-pre-tool-use.ts',
        contents: `#!/usr/bin/env node

/**
 * PURPOSE: Starting point pre-tool-use hook entry point — replace with real payload parsing as
 * the package grows.
 *
 * USAGE:
 * node __NAME__-pre-tool-use.js '{"tool":"example"}'
 */

import { argv, exit, stderr } from '#gateway/node/process';
import { HookPreToolUseResponder } from '../src/responders/hook/pre-tool-use/hook-pre-tool-use-responder';

const PAYLOAD_ARG_START_INDEX = 2;

if (require.main === module) {
  const [payload] = argv.slice(PAYLOAD_ARG_START_INDEX);

  HookPreToolUseResponder({ payload: payload ?? '' }).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    stderr.write(\`Error: \${errorMessage}\\n\`);
    exit(1);
  });
}
`,
      },
      {
        path: 'bin/__NAME__-session-start.ts',
        contents: `#!/usr/bin/env node

/**
 * PURPOSE: Starting point session-start hook entry point — replace with real payload parsing as
 * the package grows.
 *
 * USAGE:
 * node __NAME__-session-start.js '{"session":"example"}'
 */

import { argv, exit, stderr } from '#gateway/node/process';
import { HookPreToolUseResponder } from '../src/responders/hook/pre-tool-use/hook-pre-tool-use-responder';

const PAYLOAD_ARG_START_INDEX = 2;

if (require.main === module) {
  const [payload] = argv.slice(PAYLOAD_ARG_START_INDEX);

  HookPreToolUseResponder({ payload: payload ?? '' }).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    stderr.write(\`Error: \${errorMessage}\\n\`);
    exit(1);
  });
}
`,
      },
    ],
  },
} as const;
