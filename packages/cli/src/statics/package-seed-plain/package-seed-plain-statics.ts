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
      exportPaths: ['./src/statics/__NAME__/__NAME__-statics'],
    },
    dependencies: {},
    bin: {},
    compilerOptions: {},
    extraInclude: [],
    buildRootDir: null,
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: false,
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
      exportPaths: ['./src/flows/__NAME__/__NAME__-flow'],
    },
    dependencies: { '__SCOPE__/shared': '*' },
    bin: {},
    compilerOptions: {},
    extraInclude: [],
    buildRootDir: null,
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: false,
    files: [
      {
        path: 'src/state/__NAME__/__NAME__-state.ts',
        contents: `/**
 * PURPOSE: Starting point for this package's in-memory state — replace with real storage as the
 * package grows.
 *
 * USAGE:
 * __CAMEL__State.set({ key: pathSegmentContract.parse('a'), value: contentTextContract.parse('b') });
 * __CAMEL__State.get({ key: pathSegmentContract.parse('a') });
 */

import type { PathSegment, ContentText } from '__SCOPE__/shared/contracts';

const __TESTID___STORE = new Map<PathSegment, ContentText>();

export const __CAMEL__State = {
  set: ({ key, value }: { key: PathSegment; value: ContentText }): void => {
    __TESTID___STORE.set(key, value);
  },
  get: ({ key }: { key: PathSegment }): ContentText | undefined => __TESTID___STORE.get(key),
  clear: (): void => {
    __TESTID___STORE.clear();
  },
};
`,
      },
      {
        path: 'src/state/__NAME__/__NAME__-state.proxy.ts',
        contents: `/**
 * PURPOSE: Starting point test proxy for __CAMEL__State — replace with real mocks as the package
 * grows. Clears the module-level store directly, with no workspace testing import, so each test
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
        contents: `import { PathSegmentStub, ContentTextStub } from '__SCOPE__/shared/contracts';
import { __CAMEL__State } from './__NAME__-state';
import { __CAMEL__StateProxy } from './__NAME__-state.proxy';

describe('__CAMEL__State', () => {
  it('VALID: {key: "a", value: "b"} => get returns "b"', () => {
    const proxy = __CAMEL__StateProxy();
    proxy.setupEmpty();

    __CAMEL__State.set({
      key: PathSegmentStub({ value: 'a' }),
      value: ContentTextStub({ value: 'b' }),
    });

    expect(__CAMEL__State.get({ key: PathSegmentStub({ value: 'a' }) })).toBe(
      ContentTextStub({ value: 'b' }),
    );
  });

  it('EMPTY: {key: "missing"} => get returns undefined', () => {
    const proxy = __CAMEL__StateProxy();
    proxy.setupEmpty();

    expect(__CAMEL__State.get({ key: PathSegmentStub({ value: 'missing' }) })).toBe(undefined);
  });
});
`,
      },
      {
        path: 'src/responders/__NAME__/run/__NAME__-run-responder.ts',
        contents: `/**
 * PURPOSE: Starting point run responder — replace with real orchestration as the package grows.
 *
 * USAGE:
 * await __PASCAL__RunResponder({ input: 'example' });
 */

export const __PASCAL__RunResponder = ({
  input,
}: {
  input: string;
}): Promise<{ handled: boolean }> => {
  process.stdout.write(\`__NAME__ run: \${input}\\n\`);

  return Promise.resolve({ handled: true });
};
`,
      },
      {
        path: 'src/responders/__NAME__/run/__NAME__-run-responder.proxy.ts',
        contents: `/**
 * PURPOSE: Starting point test proxy for __PASCAL__RunResponder — replace with real mocks as the
 * package grows. Captures stdout writes directly, with no workspace testing import, so the
 * colocated test can assert the exact line.
 *
 * USAGE:
 * const proxy = __PASCAL__RunResponderProxy();
 * await proxy.callResponder({ input: 'example' });
 * proxy.capturedOutput();
 */

import { contentTextContract, type ContentText } from '__SCOPE__/shared/contracts';
import { __PASCAL__RunResponder } from './__NAME__-run-responder';

export const __PASCAL__RunResponderProxy = (): {
  callResponder: (params: { input: string }) => Promise<void>;
  capturedOutput: () => readonly ContentText[];
} => {
  const output: ContentText[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);

  return {
    callResponder: async (params: { input: string }): Promise<void> => {
      process.stdout.write = ((chunk: string): boolean => {
        output.push(contentTextContract.parse(chunk));
        return true;
      }) as unknown as typeof process.stdout.write;

      await __PASCAL__RunResponder(params);

      process.stdout.write = originalWrite;
    },
    capturedOutput: (): readonly ContentText[] => output,
  };
};
`,
      },
      {
        path: 'src/responders/__NAME__/run/__NAME__-run-responder.test.ts',
        contents: `import { __PASCAL__RunResponderProxy } from './__NAME__-run-responder.proxy';

describe('__PASCAL__RunResponder', () => {
  it('VALID: {input: "example"} => writes "__NAME__ run: example" to stdout', async () => {
    const proxy = __PASCAL__RunResponderProxy();

    await proxy.callResponder({ input: 'example' });

    expect(proxy.capturedOutput()).toStrictEqual(['__NAME__ run: example\\n']);
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
        contents: `import { ContentTextStub } from '__SCOPE__/shared/contracts';
import { __PASCAL__Flow } from './__NAME__-flow';

describe('__PASCAL__Flow', () => {
  it('VALID: {input: "example"} => writes "__NAME__ run: example" to stdout', async () => {
    const output: ReturnType<typeof ContentTextStub>[] = [];
    const originalWrite = process.stdout.write.bind(process.stdout);

    process.stdout.write = ((chunk: string): boolean => {
      output.push(ContentTextStub({ value: chunk }));
      return true;
    }) as unknown as typeof process.stdout.write;

    await __PASCAL__Flow({ input: 'example' });

    process.stdout.write = originalWrite;

    expect(output).toStrictEqual(['__NAME__ run: example\\n']);
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
 */

import { __PASCAL__Flow } from '../flows/__NAME__/__NAME__-flow';

export const Start__PASCAL__ = {
  run: async ({ input }: { input: string }): Promise<void> => {
    await __PASCAL__Flow({ input });
  },
};
`,
      },
      {
        path: 'src/startup/start-__NAME__.integration.test.ts',
        contents: `import { ContentTextStub } from '__SCOPE__/shared/contracts';
import { Start__PASCAL__ } from './start-__NAME__';

describe('Start__PASCAL__', () => {
  it('VALID: {input: "example"} => writes "__NAME__ run: example" to stdout', async () => {
    const output: ReturnType<typeof ContentTextStub>[] = [];
    const originalWrite = process.stdout.write.bind(process.stdout);

    process.stdout.write = ((chunk: string): boolean => {
      output.push(ContentTextStub({ value: chunk }));
      return true;
    }) as unknown as typeof process.stdout.write;

    await Start__PASCAL__.run({ input: 'example' });

    process.stdout.write = originalWrite;

    expect(output).toStrictEqual(['__NAME__ run: example\\n']);
  });
});
`,
      },
    ],
  },

  'eslint-plugin': {
    barrel: null,
    dependencies: { '__SCOPE__/shared': '*' },
    bin: {},
    compilerOptions: {},
    extraInclude: [],
    buildRootDir: './src',
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: true,
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

import { contentTextContract, type ContentText } from '__SCOPE__/shared/contracts';

const RULE_TYPE = 'problem';
const RULE_MESSAGE_ID = 'default';
const RULE_MESSAGE = contentTextContract.parse('Replace this starting-point rule with a real one.');

export const rule__PASCAL__Broker = (): {
  meta: { type: 'problem'; messages: Record<PropertyKey, ContentText> };
  create: () => Record<PropertyKey, never>;
} => ({
  meta: {
    type: RULE_TYPE,
    messages: { [RULE_MESSAGE_ID]: RULE_MESSAGE },
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
    dependencies: { '__SCOPE__/shared': '*' },
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
    files: [
      {
        path: 'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.ts',
        contents: `/**
 * PURPOSE: Starting point pre-tool-use hook responder — replace with real hook logic as the
 * package grows.
 *
 * USAGE:
 * await HookPreToolUseResponder({ payload: '{}' });
 */

export const HookPreToolUseResponder = ({
  payload,
}: {
  payload: string;
}): Promise<{ handled: boolean }> => {
  process.stdout.write(\`__NAME__ pre-tool-use: \${payload}\\n\`);

  return Promise.resolve({ handled: true });
};
`,
      },
      {
        path: 'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.proxy.ts',
        contents: `/**
 * PURPOSE: Starting point test proxy for HookPreToolUseResponder — replace with real mocks as the
 * package grows. Captures stdout writes directly, with no workspace testing import, so the
 * colocated test can assert the exact line.
 *
 * USAGE:
 * const proxy = HookPreToolUseResponderProxy();
 * await proxy.callResponder({ payload: '{}' });
 * proxy.capturedOutput();
 */

import { contentTextContract, type ContentText } from '__SCOPE__/shared/contracts';
import { HookPreToolUseResponder } from './hook-pre-tool-use-responder';

export const HookPreToolUseResponderProxy = (): {
  callResponder: (params: { payload: string }) => Promise<void>;
  capturedOutput: () => readonly ContentText[];
} => {
  const output: ContentText[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);

  return {
    callResponder: async (params: { payload: string }): Promise<void> => {
      process.stdout.write = ((chunk: string): boolean => {
        output.push(contentTextContract.parse(chunk));
        return true;
      }) as unknown as typeof process.stdout.write;

      await HookPreToolUseResponder(params);

      process.stdout.write = originalWrite;
    },
    capturedOutput: (): readonly ContentText[] => output,
  };
};
`,
      },
      {
        path: 'src/responders/hook/pre-tool-use/hook-pre-tool-use-responder.test.ts',
        contents: `import { HookPreToolUseResponderProxy } from './hook-pre-tool-use-responder.proxy';

describe('HookPreToolUseResponder', () => {
  it('VALID: {payload: "{}"} => writes "__NAME__ pre-tool-use: {}" to stdout', async () => {
    const proxy = HookPreToolUseResponderProxy();

    await proxy.callResponder({ payload: '{}' });

    expect(proxy.capturedOutput()).toStrictEqual(['__NAME__ pre-tool-use: {}\\n']);
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

import { HookPreToolUseResponder } from '../src/responders/hook/pre-tool-use/hook-pre-tool-use-responder';

const PAYLOAD_ARG_START_INDEX = 2;

if (require.main === module) {
  const [payload] = process.argv.slice(PAYLOAD_ARG_START_INDEX);

  HookPreToolUseResponder({ payload: payload ?? '' }).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(\`Error: \${errorMessage}\\n\`);
    process.exit(1);
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

import { HookPreToolUseResponder } from '../src/responders/hook/pre-tool-use/hook-pre-tool-use-responder';

const PAYLOAD_ARG_START_INDEX = 2;

if (require.main === module) {
  const [payload] = process.argv.slice(PAYLOAD_ARG_START_INDEX);

  HookPreToolUseResponder({ payload: payload ?? '' }).catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(\`Error: \${errorMessage}\\n\`);
    process.exit(1);
  });
}
`,
      },
    ],
  },
} as const;
